// @ts-nocheck
import { connect } from 'cloudflare:sockets';
// Import pako library for zlib compression (will be used client-side)
// NOTE: We just need the reference here for clarity; the actual inclusion happens in the HTML.

// basic encoding/decoding utilities (Keep if used elsewhere, otherwise can be removed)
/*
function encodeSecure(str) {
  return btoa(str.split('').reverse().join(''));
}

function decodeSecure(encoded) {
  return atob(encoded).split('').reverse().join('');
}
*/

// NOTE: These encoded constants seem unused in the main logic, remove if not needed.
/*
const ENCODED = {
  NETWORK: 'c3c=', // ws reversed + base64
  TYPE: 'YW5haWQ=', // diana reversed + base64
  STREAM: 'bWFlcnRz', // stream reversed + base64
  PROTOCOL: 'c3NlbHY=', // vless reversed + base64
};
*/

// Default values, will be overridden by environment variables if set
let userCode = '10e894da-61b1-4998-ac2b-e9ccb6af9d30'; // Default UUID
let proxyIP = 'turk.radicalization.ir'; // Default ProxyIP

if (!isValidUserCode(userCode)) {
    // Validate default UUID - might be redundant if env var is always used
    // console.warn('Default user code is not valid, ensure ENV variable is set.');
}

export default {
    /**
     * @param {import("@cloudflare/workers-types").Request} request
     * @param {{UUID?: string, PROXYIP?: string}} env
     * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
     * @returns {Promise<Response>}
     */
    async fetch(request, env, ctx) {
        // --- Get UUID and PROXYIP from environment variables ---
        // Use environment variables if available, otherwise fall back to defaults
        const currentUUID = env.UUID || userCode;
        const currentProxyIP = env.PROXYIP || proxyIP;

        // --- Validate the final UUID ---
        if (!isValidUserCode(currentUUID)) {
            return new Response('Invalid user code (UUID). Please check the environment variable.', { status: 400 });
        }

        try {
            const upgradeHeader = request.headers.get('Upgrade');
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                const url = new URL(request.url);
                switch (url.pathname) {
                    case '/':
                        // Optional: Return Cloudflare request info or a custom landing page
                        return new Response(JSON.stringify(request.cf, null, 4), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        });
                    case `/${currentUUID}`: { // Use the validated UUID for the path
                        // Generate the HTML config page
                        const streamConfig = getDianaConfig(currentUUID, request.headers.get('Host'), currentProxyIP);
                        return new Response(streamConfig, {
                            status: 200,
                            headers: { 'Content-Type': 'text/html;charset=utf-8' },
                        });
                    }
                    default:
                        // Return 404 for other paths
                        return new Response('Not found.', { status: 404 });
                }
            } else {
                // Handle WebSocket upgrade requests
                // Pass the validated UUID to the handler
                return await streamOverWSHandler(request, currentUUID);
            }
        } catch (err) {
            /** @type {Error} */ let e = err;
            console.error("Fetch Error:", e.stack || e); // Log error details
            return new Response(e.message || 'An internal error occurred.', { status: 500 });
        }
    },
};

/**
 * Handles the WebSocket connection.
 * @param {import("@cloudflare/workers-types").Request} request The incoming request.
 * @param {string} validatedUserCode The validated UUID for this connection.
 */
async function streamOverWSHandler(request, validatedUserCode) {
    /** @type {import("@cloudflare/workers-types").WebSocket[]} */
    // @ts-ignore
    const webSocketPair = new WebSocketPair();
    const [client, webSocket] = Object.values(webSocketPair);

    webSocket.accept();

    let address = '';
    let portWithRandomLog = '';
    const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
        console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
    };
    const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

    const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

    /** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
    let remoteSocketWapper = {
        value: null,
    };
    let udpStreamWrite = null;
    let isDns = false;

    // ws --> remote
    readableWebSocketStream
        .pipeTo(
            new WritableStream({
                async write(chunk, controller) {
                    if (isDns && udpStreamWrite) {
                        return udpStreamWrite(chunk);
                    }
                    if (remoteSocketWapper.value) {
                        try {
                            const writer = remoteSocketWapper.value.writable.getWriter();
                            await writer.write(chunk);
                            writer.releaseLock();
                        } catch (error) {
                             console.error("Error writing to remote socket:", error);
                             controller.error(error); // Abort the stream on write error
                             safeCloseWebSocket(webSocket); // Close WS connection
                        }
                        return;
                    }

                    // Process VLESS header
                    const {
                        hasError,
                        message,
                        portRemote = 443,
                        addressRemote = '',
                        rawDataIndex,
                        streamVersion = new Uint8Array([0, 0]),
                        isUDP,
                    } = processStreamHeader(chunk, validatedUserCode); // Use validated UUID

                    address = addressRemote;
                    portWithRandomLog = `${portRemote}--${Math.random().toString(36).substring(2, 7)} ${isUDP ? 'udp' : 'tcp'}`; // Shorter random suffix

                    if (hasError) {
                        log(`VLESS Header Error: ${message}`);
                        throw new Error(message); // Throw error to abort the stream
                    }

                    // Handle UDP (DNS only for now)
                    if (isUDP) {
                        if (portRemote === 53) {
                            isDns = true;
                        } else {
                             log(`UDP proxy attempt to non-DNS port: ${portRemote}`);
                             throw new Error('UDP proxy only enabled for DNS requests to port 53.');
                        }
                    }

                    const streamResponseHeader = new Uint8Array([streamVersion[0], 0]);
                    const rawClientData = chunk.slice(rawDataIndex);

                    // Handle outbound connections
                    if (isDns) {
                        try {
                           const { write } = await handleUDPOutBound(webSocket, streamResponseHeader, log);
                           udpStreamWrite = write;
                           await udpStreamWrite(rawClientData); // Use await for the first write
                        } catch (error) {
                           console.error("Error setting up UDP outbound:", error);
                           controller.error(error);
                           safeCloseWebSocket(webSocket);
                        }
                    } else {
                       // Handle TCP outbound connection
                       // Use await here to ensure the connection attempt completes or fails before proceeding
                       try {
                           await handleTCPOutBound(
                               remoteSocketWapper,
                               addressRemote,
                               portRemote,
                               rawClientData,
                               webSocket,
                               streamResponseHeader,
                               log,
                           );
                       } catch (error) {
                            console.error("Error setting up TCP outbound:", error);
                            controller.error(error);
                            safeCloseWebSocket(webSocket); // Ensure WS is closed on TCP setup failure
                       }
                    }
                },
                close() {
                    log(`[${address}:${portWithRandomLog}] WebSocket readable stream closed by client.`);
                    // Close the remote socket if it exists when the client closes the WS stream.
                     if (remoteSocketWapper.value) {
                         log(`Closing remote socket for [${address}:${portWithRandomLog}]`);
                         remoteSocketWapper.value.close().catch(e => log(`Error closing remote socket: ${e}`));
                     }
                },
                abort(reason) {
                     log(`[${address}:${portWithRandomLog}] WebSocket readable stream aborted: ${reason}`);
                     // Abort the remote socket if it exists when the stream is aborted.
                     if (remoteSocketWapper.value) {
                        log(`Aborting remote socket for [${address}:${portWithRandomLog}]`);
                        // Use abort() which might be more immediate than close()
                        remoteSocketWapper.value.abort().catch(e => log(`Error aborting remote socket: ${e}`));
                    }
                },
            }),
        )
        .catch(err => {
            log(`[${address}:${portWithRandomLog}] WebSocket readable stream pipeTo error: ${err}`);
            safeCloseWebSocket(webSocket); // Close WS if the pipe fails
            // Close/Abort the remote socket on pipe failure as well
             if (remoteSocketWapper.value) {
                log(`Aborting remote socket due to pipe error for [${address}:${portWithRandomLog}]`);
                remoteSocketWapper.value.abort().catch(e => log(`Error aborting remote socket: ${e}`));
            }
        });

    // Return the response to upgrade the connection
    return new Response(null, {
        status: 101,
        // @ts-ignore
        webSocket: client,
    });
}

// =============================================
//        WebSocket Stream Handling
// =============================================

/**
 * Creates a ReadableStream from a WebSocket server connection.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer The WebSocket server instance.
 * @param {string} earlyDataHeader Base64 encoded early data.
 * @param {(info: string, event?: any) => void} log Logging function.
 * @returns {ReadableStream<any>} A ReadableStream that yields messages from the WebSocket.
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
    let readableStreamCancel = false;
    return new ReadableStream({
        start(controller) {
            webSocketServer.addEventListener('message', (event) => {
                if (readableStreamCancel) return;
                const message = event.data;
                controller.enqueue(message);
            });

            webSocketServer.addEventListener('close', (event) => {
                log('WebSocket closed by client', event);
                safeCloseWebSocket(webSocketServer); // Ensure server side is closed
                if (readableStreamCancel) return;
                controller.close();
            });

            webSocketServer.addEventListener('error', (err) => {
                log('WebSocket error', err);
                controller.error(err);
            });

            // Process early data if present
            if (earlyDataHeader) {
                const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
                if (error) {
                    log('Error decoding early data header', error);
                    controller.error(new Error('Failed to decode early data: ' + error.message));
                } else if (earlyData) {
                    log('Processing early data');
                    controller.enqueue(earlyData);
                }
            }
        },

        pull(controller) {
            // Implement backpressure if needed
        },

        cancel(reason) {
            log(`WebSocket ReadableStream canceled: ${reason}`);
            if (readableStreamCancel) return;
            readableStreamCancel = true;
            safeCloseWebSocket(webSocketServer);
        },
    });
}

// =============================================
//        VLESS Header Processing
// =============================================

/**
 * Processes the VLESS header from the incoming WebSocket data.
 * @param {ArrayBuffer} chunk The data chunk containing the header.
 * @param {string} userCode The expected UUID.
 * @returns {{hasError: boolean, message?: string, portRemote?: number, addressRemote?: string, addressType?: number, rawDataIndex?: number, streamVersion?: Uint8Array, isUDP?: boolean}} Result object.
 */
function processStreamHeader(chunk, userCode) {
    if (chunk.byteLength < 24) {
        return { hasError: true, message: 'Data chunk too short for VLESS header.' };
    }

    const view = new DataView(chunk);
    const version = new Uint8Array(chunk.slice(0, 1));
    if (version[0] !== 0) {
         return { hasError: true, message: `Unsupported VLESS version: ${version[0]}` };
    }

    const uuidBytes = new Uint8Array(chunk.slice(1, 17));
    let receivedUUID;
    try {
        receivedUUID = stringify(uuidBytes); // Convert bytes to UUID string format
    } catch (e) {
         return { hasError: true, message: `Invalid UUID format in header: ${e.message}` };
    }


    if (receivedUUID !== userCode) {
        return { hasError: true, message: 'Invalid user UUID.' };
    }

    const optLength = view.getUint8(17);
    let currentIndex = 18 + optLength;

    if (chunk.byteLength <= currentIndex) {
         return { hasError: true, message: 'Data chunk too short after addon length.' };
    }


    const command = view.getUint8(currentIndex);
    currentIndex += 1;

    let isUDP = false;
    if (command === 1) { // TCP
        // Continue
    } else if (command === 2) { // UDP
        isUDP = true;
    } else {
        return { hasError: true, message: `Unsupported command: ${command}` };
    }

    if (chunk.byteLength <= currentIndex + 2) {
         return { hasError: true, message: 'Data chunk too short for port.' };
    }

    const portRemote = view.getUint16(currentIndex); // Port is Big-Endian
    currentIndex += 2;

    if (chunk.byteLength <= currentIndex) {
        return { hasError: true, message: 'Data chunk too short for address type.' };
    }

    const addressType = view.getUint8(currentIndex);
    currentIndex += 1;

    let addressLength = 0;
    let addressRemote = '';

    switch (addressType) {
        case 1: // IPv4
            addressLength = 4;
            if (chunk.byteLength < currentIndex + addressLength) {
                 return { hasError: true, message: 'Data chunk too short for IPv4 address.' };
            }
            addressRemote = new Uint8Array(chunk.slice(currentIndex, currentIndex + addressLength)).join('.');
            break;
        case 2: // Domain Name
            if (chunk.byteLength <= currentIndex) {
                 return { hasError: true, message: 'Data chunk too short for domain length.' };
            }
            addressLength = view.getUint8(currentIndex);
            currentIndex += 1;
             if (chunk.byteLength < currentIndex + addressLength) {
                 return { hasError: true, message: 'Data chunk too short for domain name.' };
            }
            addressRemote = new TextDecoder().decode(chunk.slice(currentIndex, currentIndex + addressLength));
            break;
        case 3: // IPv6
            addressLength = 16;
             if (chunk.byteLength < currentIndex + addressLength) {
                 return { hasError: true, message: 'Data chunk too short for IPv6 address.' };
            }
            const ipv6Bytes = chunk.slice(currentIndex, currentIndex + addressLength);
            const ipv6Segments = [];
            for (let i = 0; i < 16; i += 2) {
                ipv6Segments.push(view.getUint16(currentIndex + i).toString(16));
            }
            addressRemote = ipv6Segments.join(':');
            break;
        default:
            return { hasError: true, message: `Invalid address type: ${addressType}` };
    }

     if (!addressRemote) {
        return { hasError: true, message: 'Failed to parse remote address.' };
    }


    return {
        hasError: false,
        addressRemote,
        addressType,
        portRemote,
        rawDataIndex: currentIndex + addressLength,
        streamVersion: version,
        isUDP,
    };
}


// =============================================
//        Outbound Connection Handling
// =============================================

/**
 * Handles outbound TCP connections, including retrying with PROXYIP.
 * @param {{ value: import("@cloudflare/workers-types").Socket | null }} remoteSocketWapper Wrapper for the remote socket.
 * @param {string} addressRemote The initial remote address.
 * @param {number} portRemote The remote port.
 * @param {Uint8Array} rawClientData Initial data to send.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The client WebSocket.
 * @param {Uint8Array} streamResponseHeader VLESS response header.
 * @param {(info: string, event?: any) => void} log Logging function.
 */
async function handleTCPOutBound(
    remoteSocketWapper,
    addressRemote,
    portRemote,
    rawClientData,
    webSocket,
    streamResponseHeader,
    log,
) {
    /** Connects to the specified address and port, sends initial data. */
    async function connectAndWrite(address, port) {
        log(`Attempting to connect to ${address}:${port}`);
        try {
            /** @type {import("@cloudflare/workers-types").Socket} */
            const tcpSocket = connect({ hostname: address, port: port });
            remoteSocketWapper.value = tcpSocket; // Store the socket
            log(`Connected to ${address}:${port}`);

            const writer = tcpSocket.writable.getWriter();
            await writer.write(rawClientData);
            writer.releaseLock();
            log(`Sent initial data to ${address}:${port}`);
            return tcpSocket;
        } catch (error) {
            log(`Failed to connect or write to ${address}:${port}: ${error}`);
            remoteSocketWapper.value = null; // Clear socket on failure
            throw error; // Re-throw to be caught by the caller
        }
    }

    /** Retries connection using the PROXYIP. */
    async function retryConnection() {
         // Retrieve PROXYIP again in case it's dynamic (though unlikely here)
        const currentProxyIP = (self.env && self.env.PROXYIP) || proxyIP; // Access env if available

         if (!currentProxyIP || currentProxyIP === addressRemote) {
             log(`PROXYIP (${currentProxyIP}) is not set or same as original address, cannot retry.`);
             safeCloseWebSocket(webSocket);
             return; // No point retrying if PROXYIP is not valid or same
         }

        log(`Retrying connection to PROXYIP: ${currentProxyIP}:${portRemote}`);
        try {
            const tcpSocket = await connectAndWrite(currentProxyIP, portRemote);
            // If retry succeeds, pipe the new connection back to the WebSocket
             remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, null, log); // No further retry needed
            // Close the *old* socket if it exists from the failed attempt
             // This is handled implicitly as remoteSocketWapper.value gets overwritten
        } catch (error) {
             log(`Retry connection failed: ${error}`);
             safeCloseWebSocket(webSocket); // Close WS if retry also fails
        }
    }

    try {
        // Initial connection attempt
        const tcpSocket = await connectAndWrite(addressRemote, portRemote);
        // Start piping data from the successful connection to the WebSocket
        remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, retryConnection, log);
    } catch (initialError) {
        log(`Initial connection to ${addressRemote}:${portRemote} failed: ${initialError}.`);
        // If initial connection fails, try the PROXYIP
        await retryConnection();
    }
}


/**
 * Pipes data from the remote socket to the WebSocket. Handles potential retry logic.
 * @param {import("@cloudflare/workers-types").Socket} remoteSocket The connected remote socket.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The client WebSocket.
 * @param {Uint8Array} streamResponseHeader VLESS response header.
 * @param {(() => Promise<void>) | null} retry Function to call if no data received.
 * @param {(info: string, event?: any) => void} log Logging function.
 */
async function remoteSocketToWS(remoteSocket, webSocket, streamResponseHeader, retry, log) {
    let vlessHeader = streamResponseHeader; // Use a local copy for this pipe session
    let hasIncomingData = false;
    let remoteClosed = false; // Flag to track if remote socket closed normally

    await remoteSocket.readable
        .pipeTo(
            new WritableStream({
                start() {},
                async write(chunk, controller) {
                    // Check if WebSocket is still open before sending
                    if (webSocket.readyState !== WS_READY_STATE_OPEN) {
                        log("WebSocket is not open, aborting remote read.");
                        // Abort the remote socket's readable stream
                        // This signals the remote end that we're no longer reading
                        controller.error("WebSocket closed unexpectedly.");
                        // Ensure the remote socket itself is closed/aborted
                        remoteSocket.abort().catch(e => log(`Error aborting remote socket: ${e}`));
                        return;
                    }

                    hasIncomingData = true;
                    try {
                        if (vlessHeader) {
                            // Send header + first chunk
                            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
                            vlessHeader = null; // Clear header after sending
                        } else {
                            // Send subsequent chunks
                            webSocket.send(chunk);
                        }
                    } catch (error) {
                         log(`Error sending data to WebSocket: ${error}`);
                         controller.error(error); // Propagate error to abort the stream
                         // Close the remote socket if WebSocket send fails
                         remoteSocket.abort().catch(e => log(`Error aborting remote socket: ${e}`));
                    }
                },
                close() {
                     log(`Remote socket readable stream closed for ${remoteSocket.remoteAddress?.hostname}:${remoteSocket.remoteAddress?.port}.`);
                     remoteClosed = true; // Mark as normally closed
                     // When the remote end closes the connection (readable stream ends),
                     // close the WebSocket connection gracefully from the server side.
                     safeCloseWebSocket(webSocket);
                },
                abort(reason) {
                    // This is called if controller.error() is called or if the stream is aborted externally
                     log(`Remote socket readable stream aborted: ${reason}`);
                     // Ensure WebSocket is closed if the remote stream aborts unexpectedly
                     safeCloseWebSocket(webSocket);
                },
            }),
        )
        .catch(error => {
            // This catches errors from pipeTo itself or controller.error()
            log(`Error piping remote socket to WebSocket: ${error}`);
            // Ensure both sockets are closed on pipe failure
            safeCloseWebSocket(webSocket);
             if (remoteSocket) {
                remoteSocket.abort().catch(e => log(`Error aborting remote socket on pipe failure: ${e}`));
            }
        });

    // After the pipe finishes (successfully or with error), check for retry condition
    // Only retry if the remote connection closed *without* receiving any data *and* a retry function exists
    if (!remoteClosed && !hasIncomingData && retry) {
        log(`No data received from initial connection, attempting retry.`);
        await retry(); // Don't call retry if the pipe aborted due to WS closure
    } else if (remoteClosed && !hasIncomingData) {
         log("Remote connection closed normally without sending data, no retry.");
    }
}

/**
 * Handles outbound UDP (DNS) requests.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The client WebSocket.
 * @param {Uint8Array} streamResponseHeader VLESS response header.
 * @param {(info: string, event?: any) => void} log Logging function.
 * @returns {Promise<{write: (chunk: Uint8Array) => Promise<void>}>} Write function for UDP data.
 */
async function handleUDPOutBound(webSocket, streamResponseHeader, log) {
    let isHeaderSent = false;
    const dnsServer = 'https://1.1.1.1/dns-query'; // Could make this configurable

    /**
     * Sends a DNS query over DoH and forwards the response.
     * @param {Uint8Array} udpChunk The raw DNS query payload.
     */
    async function processAndForwardDns(udpChunk) {
        try {
             log(`Forwarding DNS query (size: ${udpChunk.byteLength}) to ${dnsServer}`);
             const response = await fetch(dnsServer, {
                method: 'POST',
                headers: { 'content-type': 'application/dns-message' },
                body: udpChunk,
            });

            if (!response.ok) {
                 throw new Error(`DoH server returned status: ${response.status}`);
             }

             const dnsQueryResult = await response.arrayBuffer();
             const udpSize = dnsQueryResult.byteLength;
             const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]); // Big-Endian size prefix

            // Check WebSocket state *before* sending
            if (webSocket.readyState === WS_READY_STATE_OPEN) {
                 log(`Received DNS response (size: ${udpSize}), sending back to client.`);
                const dataToSend = isHeaderSent
                     ? await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer() // Size + Payload
                     : await new Blob([streamResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer(); // Header + Size + Payload

                 webSocket.send(dataToSend);
                 if (!isHeaderSent) {
                     isHeaderSent = true; // Mark header as sent after the first successful send
                 }
            } else {
                 log('WebSocket closed before DNS response could be sent.');
            }
        } catch (error) {
             log(`Error handling DNS query: ${error}`);
             // Optionally, close the WebSocket on DNS errors? Depends on desired behavior.
             // safeCloseWebSocket(webSocket);
        }
    }

    // Return the write function that consumers will use
    return {
        write: processAndForwardDns,
    };
}


// =============================================
//        HTML Generation
// =============================================

/**
 * Generates the HTML configuration page.
 * @param {string} userCode The user's UUID.
 * @param {string | null} hostName The requested hostname (from headers).
 * @param {string} determinedProxyIP The ProxyIP to display/use.
 * @returns {string} The HTML content.
 */
function getDianaConfig(userCode, hostName, determinedProxyIP) {
    // Use requested hostname if available, otherwise fallback to determinedProxyIP
    const effectiveHost = hostName || determinedProxyIP;
    if (!effectiveHost) {
       // Handle case where neither hostname nor proxyIP is available
       return `<html><body>Error: Could not determine hostname for configuration.</body></html>`;
    }

    // Define the base URL using the validated UUID and effective host
    const baseUrl = `vless://${userCode}@${effectiveHost}:443`;

    // --- Define Common Parameters ---
    // Note: security=tls and encryption=none are standard for this setup
    const commonParams = `type=ws&security=tls&encryption=none&sni=${effectiveHost}`;

    // --- Configuration Definitions ---
    // Freedom Config (Sing-Box focused: ALPN h3, Chrome FP, ED 2560)
    const freedomPath = '/api/v4'; // Example path
    const freedomEd = 2560;
    const freedomFp = 'chrome';
    const freedomAlpn = 'h3';
    const freedomFragment = `${effectiveHost}-Freedom`; // Unique name
    const freedomConfig = `${baseUrl}?path=${encodeURIComponent(freedomPath)}&host=${effectiveHost}&${commonParams}&fp=${freedomFp}&alpn=${freedomAlpn}&ed=${freedomEd}#${encodeURIComponent(freedomFragment)}`;

    // Dream Config (Xray focused: Firefox FP, H2/HTTP1.1 ALPN, ED 2048)
    const dreamPath = '/api/v2?ed=2048'; // Example path with ED in it
    const dreamEd = 2048; // Separate ED value if needed elsewhere
    const dreamFp = 'firefox';
    const dreamAlpn = 'h2,http/1.1';
    const dreamFragment = `${effectiveHost}-Dream`; // Unique name
    const dreamConfig = `${baseUrl}?path=${encodeURIComponent(dreamPath)}&host=${effectiveHost}&${commonParams}&fp=${dreamFp}&alpn=${dreamAlpn}#${encodeURIComponent(dreamFragment)}`;

    // --- Clash Meta Subscription Link (Using Freedom Config as Base) ---
    // Note: The subscription URL itself generates the Clash config.
    // We URL-encode the VLESS URL *within* the subscription URL parameters.
    // Added allowInsecure=1 based on user request, might need adjustment
    // Added forced_ws0rtt=true as well, adjust if needed
    const clashSubscriptionBase = `https://sub.victoriacross.ir/sub/clash-meta`;
    const clashParams = new URLSearchParams({
        url: freedomConfig, // Base VLESS link for the sub
        udp: 'true', // Enable UDP for Clash
        // remote_config: '', // Add remote config URL if needed
        // ss_uot: 'false',
        // show_host: 'false',
        forced_ws0rtt: 'true',
        allow_insecure: 'true', // Allow insecure TLS
    }).toString();
    const clashMetaFullUrl = `clash://install-config?url=${encodeURIComponent(`${clashSubscriptionBase}?${clashParams}`)}`;


    // Start HTML Generation
    return `
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Include pako library for sn:// conversion -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js"></script>
    <title>پیکربندی پروکسی</title>
    <style>
      /* CSS Styles (mostly unchanged, using provided styles) */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      :root {
        --background-primary: #121212; --background-secondary: #1E1E1E; --background-tertiary: #2C2C2C;
        --border-color: #383838; --border-color-hover: #555555;
        --text-primary: #E0E0E0; --text-secondary: #A0A0A0; --text-accent: #FFFFFF;
        --accent-primary: #FFCA28; --accent-primary-darker: #FFA000;
        --button-text-primary: #121212; --button-text-secondary: var(--text-primary);
        --shadow-color: rgba(0, 0, 0, 0.4); --shadow-color-accent: rgba(255, 202, 40, 0.3);
        --border-radius: 8px; --transition-speed: 0.2s;
      }
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-optical-sizing: auto; font-style: normal;
        background-color: var(--background-primary); color: var(--text-primary);
        padding: 24px; line-height: 1.5; font-weight: 600;
      }
      .container { max-width: 800px; margin: 20px auto; padding: 0 16px; }
      .header { text-align: center; margin-bottom: 40px; }
      .header h1 { font-weight: 1,400; color: var(--text-accent); font-size: 28px; margin-bottom: 8px; }
      .header p { color: var(--text-secondary); font-size: 14px; }
      .config-card {
        background: var(--background-secondary); border-radius: var(--border-radius);
        padding: 20px; margin-bottom: 24px; border: 1px solid var(--border-color);
        transition: border-color var(--transition-speed) ease;
      }
      .config-title {
        font-size: 18px; font-weight: 500; color: var(--text-accent);
        margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);
      }
      .config-content {
        position: relative; background: var(--background-tertiary);
        border-radius: var(--border-radius); padding: 16px;
        margin-bottom: 20px; border: 1px solid var(--border-color);
      }
      .config-content pre {
        direction: ltr; /* Ensure LTR for config strings */
        text-align: left;
        overflow-x: auto; font-family: Cansolas, 'IBM Plex Mono', monospace;
        font-size: 13px; font-weight: 400; line-height: 1.6;
        color: var(--text-primary); margin: 0; white-space: pre-wrap; word-break: break-all;
      }
      .attributes {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 20px; margin-bottom: 16px;
      }
      .attribute { display: flex; flex-direction: column; gap: 4px; }
      .attribute span { font-size: 13px; color: var(--text-secondary); }
      .attribute strong { font-size: 14px; font-weight: 500; color: var(--text-accent); word-break: break-all; }
      .button {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 8px 16px; border-radius: var(--border-radius);
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
        text-decoration: none; cursor: pointer; border: 1px solid var(--border-color);
        background-color: var(--background-tertiary); color: var(--button-text-secondary);
        transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease, transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation; user-select: none;
        -webkit-user-select: none; position: relative; overflow: hidden;
      }
      .button:hover {
        background-color: #383838; border-color: var(--border-color-hover);
        transform: translateY(-1px); box-shadow: 0 4px 8px var(--shadow-color);
      }
      .button:active { transform: translateY(0px) scale(0.98); box-shadow: none; }
      .button:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
      .copy-btn {
        position: absolute; top: 12px; left: 12px; /* Changed to left for RTL */
        padding: 6px 12px; font-size: 12px; font-family: 'IBM Plex Mono', monospace; font-weight: 500;
      }
      .client-buttons {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px; margin-top: 16px;
      }
      .client-btn { width: 100%; }
      .client-icon {
        width: 20px; height: 20px; border-radius: 4px; background-color: #3a3a3a;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .client-icon svg { width: 14px; height: 14px; fill: var(--accent-primary); }
      .footer {
        text-align: center; margin-top: 40px; padding-bottom: 20px;
        color: var(--text-secondary); font-size: 13px; font-weight: 400;
      }
      .footer p { margin-bottom: 4px; }
      /* Scrollbar Styles */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--background-primary); border-radius: 4px; }
      ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; border: 2px solid var(--background-primary); }
      ::-webkit-scrollbar-thumb:hover { background: var(--border-color-hover); }
      * { scrollbar-width: thin; scrollbar-color: var(--border-color) var(--background-primary); }
      @media (max-width: 768px) {
        body { padding: 16px; } .container { padding: 0 8px; } .header h1 { font-size: 24px; }
        .header p { font-size: 13px; } .config-card { padding: 16px; } .config-title { font-size: 16px; }
        .config-content pre { font-size: 12px; } .attributes { grid-template-columns: 1fr; gap: 16px; }
        .client-buttons { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
        .button { padding: 8px 12px; font-size: 13px; } .copy-btn { top: 10px; left: 10px; /* Adjusted for RTL */ }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-thumb { border-width: 1px; }
      }
      @media (max-width: 480px) { .client-buttons { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>پیکربندی پروکسی VLESS</h1>
        <p>کانفیگ را کپی کرده یا مستقیماً به کلاینت خود وارد کنید</p>
      </div>

      <!-- Proxy Info Card -->
      <div class="config-card">
        <div class="config-title">اطلاعات پروکسی</div>
        <div class="attributes">
          <div class="attribute">
            <span>آدرس/میزبان پروکسی:</span>
            <strong>${determinedProxyIP || 'N/A'}</strong>
          </div>
           <div class="attribute">
             <span>آدرس میزبان (Host):</span>
             <strong>${effectiveHost}</strong>
           </div>
          <div class="attribute">
            <span>وضعیت:</span>
            <strong>فعال</strong>
          </div>
          </div>
      </div>

      <!-- Xray Core Clients -->
      <div class="config-card">
        <div class="config-title">کلاینت‌های با هسته Xray (مانند V2rayNG، Hiddify)</div>
        <div class="config-content">
          <button class="button copy-btn" onclick="copyToClipboard(this, '${dreamConfig}')">کپی</button>
          <pre>${dreamConfig}</pre>
        </div>
        <div class="client-buttons">
          <!-- Hiddify (Uses freedomConfig for simplicity, adjust if needed) -->
          <a href="hiddify://install-config?url=${encodeURIComponent(freedomConfig)}" class="button client-btn">
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            ورود به Hiddify
          </a>
          <!-- V2rayNG -->
          <a href="v2rayng://install-config?url=${encodeURIComponent(dreamConfig)}" class="button client-btn">
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L4 5v6c0 5.5 3.5 10.7 8 12.3 4.5-1.6 8-6.8 8-12.3V5l-8-3z" /></svg>
            </div>
            ورود به V2rayNG
          </a>
        </div>
      </div>

      <!-- Sing-Box Core Clients -->
      <div class="config-card">
        <div class="config-title">کلاینت‌های با هسته Sing-Box (مانند Clash Meta، NekoBox)</div>
        <div class="config-content">
          <button class="button copy-btn" onclick="copyToClipboard(this, '${freedomConfig}')">کپی</button>
          <pre>${freedomConfig}</pre>
        </div>
        <div class="client-buttons">
          <!-- Clash Meta -->
          <a href="${clashMetaFullUrl}" class="button client-btn">
            <div class="client-icon">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z" /> <path d="M10 10h4v4H10z" /> <path d="M14 8H10V4h4z" /> <path d="M4 14h4v4H4z" /></svg>
            </div>
            ورود به Clash Meta
          </a>
          <!-- NekoBox (Link generated dynamically by JS) -->
          <a id="nekobox-import-link" href="javascript:void(0);" class="button client-btn">
            <div class="client-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
            </div>
            ورود به NekoBox
          </a>
        </div>
      </div>
      <div class="footer">
         <p>© REvil ${new Date().getFullYear()} تمام حقوق محفوظ است. </p>
         <p>امن. خصوصی. سریع.</p>
      </div>
    </div>

    <script>
      // --- Clipboard Function ---
      function copyToClipboard(button, text) {
        navigator.clipboard.writeText(text).then(() => {
          const originalText = button.textContent;
          button.textContent = 'کپی شد!';
          button.style.backgroundColor = 'var(--accent-primary)';
          button.style.color = 'var(--button-text-primary)';
          button.style.borderColor = 'var(--accent-primary-darker)';
          button.disabled = true;
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = 'var(--background-tertiary)';
            button.style.color = 'var(--button-text-secondary)';
            button.style.borderColor = 'var(--border-color)';
            button.disabled = false;
          }, 1200);
        }).catch(err => {
          console.error('Failed to copy: ', err);
          const originalText = button.textContent;
          button.textContent = 'خطا';
          button.style.backgroundColor = '#D32F2F'; button.style.color = '#FFFFFF'; button.style.borderColor = '#B71C1C';
          button.disabled = true;
           setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = 'var(--background-tertiary)'; button.style.color = 'var(--button-text-secondary)'; button.style.borderColor = 'var(--border-color)';
            button.disabled = false;
          }, 1500);
        });
      }

      // --- sn:// Conversion Functions ---

      // Helper: Uint8Array to Base64
      function uint8ArrayToBase64(bytes) {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

                  // Main conversion function
      function convertVlessToSn(vlessUrl) {
        try {
          // Check if pako library is loaded (it should be available globally via the script tag)
          if (typeof pako === 'undefined') {
             throw new Error("pako library is not loaded.");
          }

          const url = new URL(vlessUrl);
          if (url.protocol !== 'vless:') {
            throw new Error('Invalid VLESS URL protocol');
          }

          const params = url.searchParams;
          // Decode the fragment part (the part after #)
          const fragment = url.hash ? decodeURIComponent(url.hash.substring(1)) : '';

          // --- Construct Sing-box JSON object ---
          const singboxJson = {
            // Property: value, (Comma needed after each property except the last one)
            type: "vless", // Comma is REQUIRED here
            tag: fragment || `nekobox-${url.hostname}`, // Comma is REQUIRED here
            server: url.hostname, // Comma is REQUIRED here
            server_port: parseInt(url.port, 10), // Comma is REQUIRED here
            uuid: url.username, // Comma is REQUIRED here (UUID comes from username part)
            tls: { // TLS settings block
                enabled: true, // Always true for this specific worker setup
                server_name: params.get('sni') || params.get('host') || url.hostname, // Use SNI > Host > Server address
                insecure: params.get('allowInsecure') === '1' || params.get('allowInsecure') === 'true' || true, // Default to true (allow insecure)
                utls: {
                    enabled: !!params.get('fp'), // Enable if 'fp' parameter exists
                    fingerprint: params.get('fp') || "" // Get fingerprint or default to empty string
                },
                alpn: params.get('alpn') ? params.get('alpn').split(',') : null // Parse ALPN, split if multiple values
                // reality: { enabled: false } // Explicitly disable reality if needed for clarity
            }, // Comma is REQUIRED here to separate tls object from transport object
            transport: { // Transport settings block
                type: params.get('type') || 'ws', // Default to 'ws' if not specified
                path: params.get('path') || '/', // Default path to '/'
                headers: {
                    Host: params.get('host') || url.hostname // Set Host header
                }, // Comma REQUIRED here to separate headers from early_data
                early_data_header_name: params.get('eh') || "Sec-WebSocket-Protocol", // Use 'eh' param or default
                max_early_data: params.get('ed') ? parseInt(params.get('ed'), 10) : (params.get('path')?.includes('ed=2048') ? 2048 : 2560) // Determine max_early_data
            } // NO comma after the last property ('transport') inside the main object
             // 'encryption=none' is default for VLESS, typically no explicit field needed in Sing-box JSON
          }; // Semicolon removed here

           // --- Clean up optional/null fields ---
           if (!singboxJson.tls.alpn || singboxJson.tls.alpn.length === 0) {
               delete singboxJson.tls.alpn; // Remove alpn if null or empty array
           }
           // Check utls enabled state *before* checking fingerprint (using optional chaining ?. for safety)
           if (!singboxJson.tls.utls?.enabled) {
               delete singboxJson.tls.utls; // Remove entire utls block if not enabled
           } else if (!singboxJson.tls.utls.fingerprint) {
              // If utls is enabled but fingerprint is empty, remove the block
              delete singboxJson.tls.utls;
           }

          // --- JSON to String ---
          const jsonString = JSON.stringify(singboxJson);
          // console.log("Sing-box JSON:", jsonString); // For debugging

          // --- Compress with pako (zlib/deflate) ---
          const compressedData = pako.deflate(jsonString); // Returns Uint8Array
          // console.log("Compressed (Uint8Array):", compressedData); // For debugging

          // --- Base64 Encode ---
          const base64String = uint8ArrayToBase64(compressedData); // Use the helper function
          // console.log("Base64 Encoded:", base64String); // For debugging

          // --- Prepend Prefix ---
          // Using 'sn://vmess?' prefix as observed in Nekobox exports
          const snUrl = `sn://vmess?${base64String}`;
          return snUrl; // Return the final sn:// URL

        } catch (error) {
          // Log the error for easier debugging
          console.error("VLESS to sn:// Conversion Error:", error.stack || error);
          // Return a user-friendly error string
          return `Error: ${error.message}`;
        }
}


      // --- Generate and set NekoBox link on page load ---
      document.addEventListener('DOMContentLoaded', function () {
        const vlessConfigForNeko = '${freedomConfig}'; // Use the freedom config as base for NekoBox sn:// link
        const nekoLinkElement = document.getElementById('nekobox-import-link');

        if (nekoLinkElement && vlessConfigForNeko) {
           try {
              const snUrl = convertVlessToSn(vlessConfigForNeko);
              if (snUrl && !snUrl.startsWith('Error')) {
                 nekoLinkElement.href = snUrl;
              } else {
                 console.error("Failed to generate NekoBox link:", snUrl);
                 nekoLinkElement.textContent = "خطا در ساخت لینک";
                 nekoLinkElement.style.pointerEvents = 'none';
                 nekoLinkElement.style.opacity = '0.5';
              }
           } catch (e) {
               console.error("Error generating NekoBox link on load:", e);
               nekoLinkElement.textContent = "خطا در ساخت لینک";
               nekoLinkElement.style.pointerEvents = 'none';
               nekoLinkElement.style.opacity = '0.5';
           }
        } else {
           console.warn("Could not find NekoBox link element or config.");
           if (nekoLinkElement) {
              nekoLinkElement.textContent = "لینک ناموجود";
              nekoLinkElement.style.pointerEvents = 'none';
              nekoLinkElement.style.opacity = '0.5';
           }
        }

        // Example: Hide ProxyIP if it's the default placeholder (optional)
        /*
        const proxyIPElement = document.getElementById('proxyIPDisplay'); // Assuming you add an ID
        if (proxyIPElement && proxyIPElement.innerText === '${determinedProxyIP || 'N/A'}' && '${determinedProxyIP}' === 'turk.radicalization.ir') {
          // Maybe hide or change display if it's the default
        }
        */
      });
    </script>
  </body>
</html>
`;
}


// =============================================
//        Utility Functions
// =============================================

/**
 * Validates if a string is a standard UUID format.
 * @param {string} code The string to validate.
 * @returns {boolean} True if valid UUID format, false otherwise.
 */
function isValidUserCode(code) {
    if (!code) return false;
    const codeRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return codeRegex.test(code);
}

/**
 * Decodes a Base64 string (URL-safe variations) to an ArrayBuffer.
 * @param {string} base64Str The Base64 encoded string.
 * @returns {{earlyData?: ArrayBuffer, error?: Error}} Result object.
 */
function base64ToArrayBuffer(base64Str) {
    if (!base64Str) {
        return { error: null };
    }
    try {
        // Replace URL-safe characters and remove padding if necessary before decoding
        let base64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        // Pad if necessary
        while (base64.length % 4) {
           base64 += '=';
       }
        const decode = atob(base64);
        const arryBuffer = Uint8Array.from(decode, c => c.charCodeAt(0));
        return { earlyData: arryBuffer.buffer, error: null };
    } catch (error) {
        // Catch potential errors from atob() like invalid characters
        return { error: new Error("Failed to decode Base64 string: " + error.message) };
    }
}

// WebSocket Ready States
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2; // Added for completeness

/**
 * Safely closes a WebSocket connection, catching potential errors.
 * @param {import("@cloudflare/workers-types").WebSocket} socket The WebSocket to close.
 */
function safeCloseWebSocket(socket) {
    try {
        // Only attempt to close if it's open or closing
        if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
            socket.close(1000, "Closing connection"); // Provide a reason code
        }
    } catch (error) {
        console.error('safeCloseWebSocket error:', error);
    }
}

// --- UUID Stringification (copied from original code) ---
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
    // Ensure arr is long enough
     if (!arr || arr.length < offset + 16) {
         throw new TypeError('Input array is too short for UUID stringification.');
     }
    return (
        byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' +
        byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' +
        byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' +
        byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' +
        byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]
    ).toLowerCase();
}

function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    // Re-validate the generated string (optional but good practice)
    // if (!isValidUserCode(uuid)) {
    //   throw TypeError('Stringified UUID is invalid');
    // }
    return uuid;
}
