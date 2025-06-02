import { connect } from 'cloudflare:sockets';

let sessionToken, apiToken;

export default {
  async fetch(request, env, ctx) {
    const faviconUrl =
      env.ICO ||
      'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
    const url = new URL(request.url);
    const userAgent = request.headers.get('User-Agent') || 'null';
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    // Timestamp every 31 minutes for backend token generation
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31));
    sessionToken = await generateTokenHash(url.hostname + timestamp + userAgent); // Renamed from 临时TOKEN, function 双重哈希
    apiToken = env.TOKEN || sessionToken;

    if (path.toLowerCase() === '/check') {
      if (!url.searchParams.has('proxyip'))
        return new Response('Missing proxyip parameter', { status: 400 });
      if (url.searchParams.get('proxyip') === '')
        return new Response('Invalid proxyip parameter', { status: 400 });
      if (
        !url.searchParams.get('proxyip').includes('.') &&
        !(
          url.searchParams.get('proxyip').includes('[') &&
          url.searchParams.get('proxyip').includes(']')
        )
      )
        return new Response('Invalid proxyip format', { status: 400 });

      if (env.TOKEN) {
        if (!url.searchParams.has('token') || url.searchParams.get('token') !== apiToken) {
          return new Response(
            JSON.stringify(
              {
                status: 'error',
                message: `ProxyIP check failed: Invalid TOKEN`,
                timestamp: new Date().toISOString(),
              },
              null,
              4,
            ),
            {
              status: 403,
              headers: {
                'content-type': 'application/json; charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
              },
            },
          );
        }
      }

      const proxyIP = url.searchParams.get('proxyip').toLowerCase();
      const result = await checkProxyIPConnectivity(proxyIP);

      return new Response(JSON.stringify(result, null, 2), {
        status: result.success ? 200 : 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (path.toLowerCase() === '/resolve') {
      if (
        !url.searchParams.has('token') ||
        (url.searchParams.get('token') !== sessionToken &&
          url.searchParams.get('token') !== apiToken)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `Domain resolution failed: Invalid TOKEN`, // Translated
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 403,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
      if (!url.searchParams.has('domain'))
        return new Response('Missing domain parameter', { status: 400 });
      const domain = url.searchParams.get('domain');

      try {
        const ips = await resolveDomain(domain);
        return new Response(JSON.stringify({ success: true, domain, ips }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } else if (path.toLowerCase() === '/ip-info') {
      if (
        !url.searchParams.has('token') ||
        (url.searchParams.get('token') !== sessionToken &&
          url.searchParams.get('token') !== apiToken)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP info lookup failed: Invalid TOKEN`, // Translated
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 403,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
      let ip = url.searchParams.get('ip') || request.headers.get('CF-Connecting-IP');
      if (!ip) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: 'IP parameter not provided', // Translated
              code: 'MISSING_PARAMETER',
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 400,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }

      if (ip.includes('[')) {
        ip = ip.replace('[', '').replace(']', '');
      }

      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=en`); // lang changed to en

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        data.timestamp = new Date().toISOString();

        return new Response(JSON.stringify(data, null, 4), {
          headers: {
            'content-type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('IP info lookup failed:', error); // Translated
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP info lookup failed: ${error.message}`, // Translated
              code: 'API_REQUEST_FAILED',
              query: ip,
              timestamp: new Date().toISOString(),
              details: {
                errorType: error.name,
                stack: error.stack ? error.stack.split('\n')[0] : null,
              },
            },
            null,
            4,
          ),
          {
            status: 500,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    } else {
      const envKey = env.URL302 ? 'URL302' : env.URL ? 'URL' : null;
      if (envKey) {
        const urls = await normalizeAndDeduplicateUrls(env[envKey]); // Renamed from 整理
        const targetUrl = urls[Math.floor(Math.random() * urls.length)];
        return envKey === 'URL302'
          ? Response.redirect(targetUrl, 302)
          : fetch(new Request(targetUrl, request));
      } else if (env.TOKEN) {
        return new Response(await nginxWelcomePage(), {
          // Renamed from nginx
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
        });
      } else if (path.toLowerCase() === '/favicon.ico') {
        return Response.redirect(faviconUrl, 302);
      }
      return await generateHtmlPage(hostname, faviconUrl, sessionToken); // Renamed from HTML, pass sessionToken
    }
  },
};

async function resolveDomain(domain) {
  domain = domain.includes(':') ? domain.split(':')[0] : domain;
  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
        headers: { Accept: 'application/dns-json' },
      }),
      fetch(`https://1.1.1.1/dns-query?name=${domain}&type=AAAA`, {
        headers: { Accept: 'application/dns-json' },
      }),
    ]);

    const [ipv4Data, ipv6Data] = await Promise.all([ipv4Response.json(), ipv6Response.json()]);

    const ips = [];

    if (ipv4Data.Answer) {
      const ipv4Addresses = ipv4Data.Answer.filter(record => record.type === 1) // A record
        .map(record => record.data);
      ips.push(...ipv4Addresses);
    }

    if (ipv6Data.Answer) {
      const ipv6Addresses = ipv6Data.Answer.filter(record => record.type === 28) // AAAA record
        .map(record => `[${record.data}]`);
      ips.push(...ipv6Addresses);
    }

    if (ips.length === 0) {
      throw new Error('No A or AAAA records found');
    }

    return ips;
  } catch (error) {
    throw new Error(`DNS resolution failed: ${error.message}`);
  }
}

async function checkProxyIPConnectivity(proxyIP) {
  // Renamed from CheckProxyIP
  let portRemote = 443;
  let targetHost = proxyIP; // Use a different variable for the host part

  if (proxyIP.includes('.tp')) {
    const portMatch = proxyIP.match(/\.tp(\d+)\./);
    if (portMatch) portRemote = parseInt(portMatch[1]);
    // targetHost remains proxyIP as .tp might be part of a special hostname format
  } else if (proxyIP.includes('[') && proxyIP.includes(']:')) {
    portRemote = parseInt(proxyIP.split(']:')[1]);
    targetHost = proxyIP.split(']:')[0] + ']';
  } else if (proxyIP.includes(':') && !proxyIP.startsWith('[')) {
    // Ensure it's not an IPv6 without port
    const parts = proxyIP.split(':');
    // Check if the last part is a number (port) and there's more than one colon (potential IPv6)
    // This logic might need refinement for IPv6 with ports if not bracketed
    if (!isNaN(parseInt(parts[parts.length - 1])) && parts.length > 2 && proxyIP.includes('.')) {
      // Likely IPv4 with port
      portRemote = parseInt(parts[parts.length - 1]);
      targetHost = parts.slice(0, -1).join(':');
    } else if (!isNaN(parseInt(parts[parts.length - 1])) && parts.length === 2) {
      // Simple host:port
      portRemote = parseInt(parts[parts.length - 1]);
      targetHost = parts[0];
    }
    // If it's an IPv6 address without brackets and a port, this simple split might be problematic.
    // The original code assumed proxyIP was already the host part for non-bracketed IPv6.
  }

  const tcpSocket = connect({
    hostname: targetHost,
    port: portRemote,
  });

  try {
    const httpRequest =
      'GET /cdn-cgi/trace HTTP/1.1\r\n' +
      'Host: speed.cloudflare.com\r\n' +
      'User-Agent: CheckProxyIP/cmliu\r\n' + // User-Agent can remain as is or be generic
      'Connection: close\r\n\r\n';

    const writer = tcpSocket.writable.getWriter();
    await writer.write(new TextEncoder().encode(httpRequest));
    writer.releaseLock();

    const reader = tcpSocket.readable.getReader();
    let responseData = new Uint8Array(0);

    while (true) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(() => resolve({ done: true }), 5000)), // 5-second timeout
      ]);

      if (done) break;
      if (value) {
        const newData = new Uint8Array(responseData.length + value.length);
        newData.set(responseData);
        newData.set(value, responseData.length);
        responseData = newData;

        const responseText = new TextDecoder().decode(responseData);
        if (
          responseText.includes('\r\n\r\n') &&
          (responseText.includes('Connection: close') || responseText.includes('content-length'))
        ) {
          break;
        }
      }
    }
    reader.releaseLock();

    const responseText = new TextDecoder().decode(responseData);
    const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;

    function isValidProxyResponse(text, data) {
      const httpStatusMatch = text.match(/^HTTP\/\d\.\d\s+(\d+)/i);
      const httpStatusCode = httpStatusMatch ? parseInt(httpStatusMatch[1]) : null;
      const looksLikeCloudflare = text.includes('cloudflare');
      // Cloudflare often returns "400 Bad Request" with "plain HTTP request sent to HTTPS port"
      // or similar when a direct IP is hit on a port expecting SNI/TLS for a specific domain.
      // This is an indicator that the IP is likely a Cloudflare IP.
      const isExpectedError =
        text.includes('plain HTTP request') ||
        text.includes('400 Bad Request') ||
        text.includes('Client sent an HTTP request to an HTTPS server.');
      const hasSufficientBody = data.length > 50; // Arbitrary small size to ensure some response beyond headers

      return httpStatusCode !== null && looksLikeCloudflare && isExpectedError && hasSufficientBody;
    }
    const isSuccessful = isValidProxyResponse(responseText, responseData);

    const jsonResponse = {
      success: isSuccessful,
      proxyIP: targetHost, // Return the cleaned host
      portRemote: portRemote,
      statusCode: statusCode || null,
      responseSize: responseData.length,
      responseData: isSuccessful
        ? 'Response indicates a likely Cloudflare IP. Full trace hidden for brevity.'
        : responseText, // Avoid sending full trace if successful
      timestamp: new Date().toISOString(),
    };

    await tcpSocket.close();
    return jsonResponse;
  } catch (error) {
    return {
      success: false,
      proxyIP: targetHost, // Return the cleaned host even on failure
      portRemote: portRemote,
      timestamp: new Date().toISOString(),
      error: error.message || error.toString(),
    };
  }
}

async function normalizeAndDeduplicateUrls(content) {
  // Renamed from 整理
  // Replaces carriage returns and newlines with a single pipe, then multiple pipes with a single pipe.
  const replacedContent = content.replace(/[\r\n]+/g, '|').replace(/\|+/g, '|'); // Renamed from 替换后的内容
  const urlArray = replacedContent.split('|'); // Renamed from 地址数组
  // Filters out empty strings and duplicate items.
  const normalizedArray = urlArray.filter((item, index) => {
    // Renamed from 整理数组
    return item !== '' && urlArray.indexOf(item) === index;
  });
  return normalizedArray;
}

async function generateTokenHash(text) {
  // Renamed from 双重哈希, parameter 文本 to text
  const encoder = new TextEncoder(); // Renamed from 编码器

  const firstHashBuffer = await crypto.subtle.digest('MD5', encoder.encode(text)); // Renamed from 第一次哈希
  const firstHashArray = Array.from(new Uint8Array(firstHashBuffer)); // Renamed from 第一次哈希数组
  const firstHex = firstHashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); // Renamed from 第一次十六进制, 字节 to byte

  const secondHashBuffer = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27))); // Renamed from 第二次哈希
  const secondHashArray = Array.from(new Uint8Array(secondHashBuffer)); // Renamed from 第二次哈希数组
  const secondHex = secondHashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); // Renamed from 第二次十六进制, 字节 to byte

  return secondHex.toLowerCase();
}

async function nginxWelcomePage() {
  // Renamed from nginx
  const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `; // Content is already English
  return text;
}

async function generateHtmlPage(hostname, faviconUrl, currentSessionToken) {
  // Renamed from HTML, added currentSessionToken
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check ProxyIP - Proxy IP Detection Service</title>
  <link rel="icon" href="${faviconUrl}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-color: #00aeff; /* Bright Blue */
      --primary-dark: #007fcc; 
      --secondary-color: #00f5d4; /* Bright Teal */
      --success-color: #2df792; /* Bright Green */
      --warning-color: #ffc400; /* Bright Yellow/Orange */
      --error-color: #ff3864;   /* Bright Red/Pink */
      
      --bg-primary: #121212;    /* Very Dark Gray (almost black) */
      --bg-secondary: #1e1e1e;  /* Dark Gray */
      --bg-tertiary: #2a2a2a;   /* Medium Dark Gray */
      
      --text-primary: #e0e0e0;  /* Light Gray */
      --text-secondary: #b0b0b0; /* Medium Light Gray */
      --text-light: #757575;    /* Gray for placeholders/muted text */
      
      --border-color: #333333;  /* Dark Border */
      
      --shadow-sm: 0 2px 4px rgba(0,0,0,0.2);
      --shadow-md: 0 4px 8px rgba(0,0,0,0.3);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.4);
      
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: linear-gradient(135deg, var(--bg-primary) 0%, #000000 100%);
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 50px;
      animation: fadeInDown 0.8s ease-out;
    }
    
    .main-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      text-shadow: 0 4px 12px rgba(0, 174, 255, 0.3);
    }
    
    .subtitle {
      font-size: 1.2rem;
      color: var(--text-secondary);
      font-weight: 400;
      margin-bottom: 8px;
    }
    
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 50px;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      border: 1px solid rgba(255,255,255,0.15);
    }
    
    .card {
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 32px;
      box-shadow: var(--shadow-lg);
      margin-bottom: 32px;
      border: 1px solid var(--border-color);
      transition: var(--transition);
      animation: fadeInUp 0.8s ease-out;
      position: relative;
      overflow: hidden;
    }
    
    .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    
    .form-label {
      display: block;
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    
    .input-group {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    
    .input-wrapper {
      flex: 1;
      min-width: 300px;
      position: relative;
    }
    
    .form-input {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      font-size: 16px;
      font-family: inherit;
      transition: var(--transition);
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(0, 174, 255, 0.2);
      transform: translateY(-1px);
    }
    
    .form-input::placeholder {
      color: var(--text-light);
    }
    
    .btn {
      padding: 16px 32px;
      border: none;
      border-radius: var(--border-radius-sm);
      font-size: 16px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-width: 120px;
      position: relative;
      overflow: hidden;
    }
    
    .btn::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transition: left 0.6s;
    }
    
    .btn:hover::before {
      left: 100%;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: #ffffff;
      box-shadow: var(--shadow-md);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 174, 255, 0.3);
    }
    
    .btn-primary:active {
      transform: translateY(0);
    }
    
    .btn-primary:disabled {
      background: var(--text-light);
      cursor: not-allowed;
      transform: none;
      box-shadow: var(--shadow-sm);
    }
        
    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .result-section {
      margin-top: 32px;
      opacity: 0;
      transform: translateY(20px);
      transition: var(--transition);
    }
    
    .result-section.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .result-card {
      border-radius: var(--border-radius-sm);
      padding: 24px;
      margin-bottom: 16px;
      border-left: 4px solid;
      position: relative;
      overflow: hidden;
    }
    
    .result-success {
      background: linear-gradient(135deg, rgba(45, 247, 146, 0.1), rgba(45, 247, 146, 0.05));
      border-color: var(--success-color);
      color: var(--success-color);
    }
    
    .result-error {
      background: linear-gradient(135deg, rgba(255, 56, 100, 0.1), rgba(255, 56, 100, 0.05));
      border-color: var(--error-color);
      color: var(--error-color);
    }
    
    .result-warning {
      background: linear-gradient(135deg, rgba(255, 196, 0, 0.1), rgba(255, 196, 0, 0.05));
      border-color: var(--warning-color);
      color: var(--warning-color);
    }
    
    .ip-grid {
      display: grid;
      gap: 16px;
      margin-top: 20px;
    }
    
    .ip-item {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 20px;
      transition: var(--transition);
      position: relative;
      color: var(--text-primary); /* Ensure text color is appropriate */
    }
    
    .ip-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--primary-color);
    }
    
    .ip-status-line {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .status-icon {
      font-size: 18px;
      margin-left: auto;
    }
    
    .copy-btn {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 4px 0;
    }
    
    .copy-btn:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
    
    .copy-btn.copied {
      background: var(--success-color);
      color: white;
      border-color: var(--success-color);
    }
    
    .info-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    
    .tag {
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .tag-country {
      background: rgba(0, 174, 255, 0.15); /* primary-color with alpha */
      color: var(--primary-color);
    }
    
    .tag-as {
      background: rgba(0, 245, 212, 0.15); /* secondary-color with alpha */
      color: var(--secondary-color);
    }
    
    .api-docs {
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      padding: 32px;
      box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }
    
    .section-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 24px;
      position: relative;
      padding-bottom: 12px;
    }
    
    .section-title::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
      border-radius: 2px;
    }
    
    .code-block {
      background: #0d1117; /* GitHub dark theme code block */
      color: #c9d1d9;
      padding: 20px;
      border-radius: var(--border-radius-sm);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      overflow-x: auto;
      margin: 16px 0;
      border: 1px solid #30363d;
      position: relative;
    }
    
    .code-block::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--success-color), var(--secondary-color));
    }
    
    .highlight {
      color: var(--error-color); /* Use error color for highlighting, or a specific highlight color */
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding: 20px 20px 20px;
      color: var(--text-secondary);
      font-size: 14px;
      margin-top: 40px;
      border-top: 1px solid var(--border-color);
    }
    
    .github-corner {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 1000;
      transition: var(--transition);
    }
    
    .github-corner:hover {
      transform: scale(1.1);
    }
    
    .github-corner svg {
      fill: var(--primary-color); /* Accent color for the corner background */
      color: var(--bg-primary);   /* Background color for the octocat, creating a "cutout" effect */
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }
    
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes octocat-wave {
      0%, 100% { transform: rotate(0); }
      20%, 60% { transform: rotate(-25deg); }
      40%, 80% { transform: rotate(10deg); }
    }
    
    .github-corner:hover .octo-arm {
      animation: octocat-wave 560ms ease-in-out;
    }
    
    @media (max-width: 768px) {
      .container { padding: 16px; }
      .card { padding: 24px; margin-bottom: 24px; }
      .input-group { flex-direction: column; align-items: stretch; }
      .input-wrapper { min-width: auto; }
      .btn { width: 100%; }
      .github-corner svg { width: 60px; height: 60px; }
      .github-corner:hover .octo-arm { animation: none; }
      .github-corner .octo-arm { animation: octocat-wave 560ms ease-in-out; }
      .main-title { font-size: 2.5rem; }
    }
    
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      padding: 12px 20px;
      border-radius: var(--border-radius-sm);
      box-shadow: var(--shadow-lg);
      transform: translateY(100px);
      opacity: 0;
      transition: var(--transition);
      z-index: 1000;
    }
    
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <a href="https://github.com/cmliu/CF-Workers-CheckProxyIP" target="_blank" class="github-corner" aria-label="View source on Github">
    <svg viewBox="0 0 250 250" aria-hidden="true">
      <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
      <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>
      <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path>
    </svg>
  </a>

  <div class="container">
    <header class="header">
      <h1 class="main-title">Check ProxyIP</h1>
    </header>

    <div class="card">
      <div class="form-section">
        <label for="proxyip" class="form-label">🔍 Enter ProxyIP Address</label>
        <div class="input-group">
          <div class="input-wrapper">
            <input type="text" id="proxyip" class="form-input" placeholder="e.g., 1.2.3.4:443 or example.com" autocomplete="off">
          </div>
          <button id="checkBtn" class="btn btn-primary" onclick="checkProxyIP()">
            <span class="btn-text">Check</span>
            <div class="loading-spinner" style="display: none;"></div>
          </button>
        </div>
      </div>
      
      <div id="result" class="result-section"></div>
    </div>
    
    <div class="api-docs">
      <h2 class="section-title">📚 API Documentation</h2>
      <p style="margin-bottom: 24px; color: var(--text-secondary); font-size: 1.1rem;">
        Provides a simple and easy-to-use RESTful API interface, supporting batch detection and domain resolution.
      </p>
      
      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">📍 Check ProxyIP</h3>
      <div class="code-block">
        <strong style="color: var(--success-color);">GET</strong> /check?proxyip=<span class="highlight">YOUR_PROXY_IP</span>
      </div>
      
      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">💡 Usage Example</h3>
      <div class="code-block">
curl "https://${hostname}/check?proxyip=1.2.3.4:443"
      </div>

      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">🔗 JSON Response Format</h3>
      <div class="code-block">
{<br>
  "success": true|false, <span style="color:var(--text-light)">// Whether the proxy IP is valid</span><br>
  "proxyIP": "1.2.3.4", <span style="color:var(--text-light)">// If valid, returns the proxy IP, otherwise -1</span><br>
  "portRemote": 443, <span style="color:var(--text-light)">// If valid, returns the port, otherwise -1</span><br>
  "timestamp": "2025-05-10T14:44:30.597Z" <span style="color:var(--text-light)">// Check time</span><br>
}<br>
      </div>
    </div>
    <footer class="footer">
      <p style="margin-top: 8px; opacity: 0.8;">© ${new Date().getFullYear()} Check ProxyIP - High-performance ProxyIP validation service built on Cloudflare Workers | Developed by <strong>cmliu</strong></p>
    </footer>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    let isChecking = false;
    const ipCheckResults = new Map(); 
    let pageLoadTimestamp; 
    const frontendSessionToken = "${currentSessionToken}"; // Use the passed session token

    function calculateTimestamp() {
      const currentDate = new Date();
      return Math.ceil(currentDate.getTime() / (1000 * 60 * 13)); // One timestamp every 13 minutes
    }
    
    function isValidProxyIPFormat(input) {
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$/;
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
      const withPortRegex = /^.+:\\d+$/;
      const tpPortRegex = /^.+\\.tp\\d+\\./;

      return domainRegex.test(input) ||
        ipv4Regex.test(input) ||
        ipv6Regex.test(input) ||
        withPortRegex.test(input) ||
        tpPortRegex.test(input);
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      pageLoadTimestamp = calculateTimestamp();
      console.log('Page loaded, timestamp:', pageLoadTimestamp);
      
      const input = document.getElementById('proxyip');
      input.focus();
      
      const currentPath = window.location.pathname;
      let autoCheckValue = null;
      
      const urlParams = new URLSearchParams(window.location.search);
      autoCheckValue = urlParams.get('autocheck');
      
      if (!autoCheckValue && currentPath.length > 1) {
        const pathContent = currentPath.substring(1);
        if (isValidProxyIPFormat(pathContent)) {
          autoCheckValue = pathContent;
          const newUrl = new URL(window.location);
          newUrl.pathname = '/';
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      if (!autoCheckValue) {
        try {
          const lastSearch = localStorage.getItem('lastProxyIP');
          if (lastSearch && isValidProxyIPFormat(lastSearch)) {
            input.value = lastSearch;
          }
        } catch (error) {
          console.log('Failed to read history:', error);
        }
      }
      
      if (autoCheckValue) {
        input.value = autoCheckValue;
        if (urlParams.has('autocheck')) {
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('autocheck');
          window.history.replaceState({}, '', newUrl);
        }
        
        setTimeout(() => {
          if (!isChecking) {
            checkProxyIP();
          }
        }, 500);
      }
      
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !isChecking) {
          checkProxyIP();
        }
      });
      
      document.addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-btn')) {
          const text = event.target.getAttribute('data-copy');
          if (text) {
            copyToClipboard(text, event.target);
          }
        }
      });
    });
    
    function showToast(message, duration = 3000) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
    
    function copyToClipboard(text, element) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = element.textContent;
        element.classList.add('copied');
        element.textContent = 'Copied ✓';
        showToast('Copied successfully!');
        
        setTimeout(() => {
          element.classList.remove('copied');
          element.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Copy failed, please copy manually');
      });
    }
    
    function createCopyButton(text) {
      return \`<span class="copy-btn" data-copy="\${text}">\${text}</span>\`;
    }
    
    function isIPAddress(input) {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/; // Matches [::1] or ::1 (though latter is less common for input)
      const ipv6WithPortRegex = /^\\[[0-9a-fA-F:]+\\]:\\d+$/; // Matches [::1]:80
      const ipv4WithPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\\d+$/; // Matches 1.2.3.4:80
      
      // Simpler check: if it contains a colon and is not an IPv6 address without port, it might have a port.
      // Or if it's a valid IPv4 or IPv6 address.
      return ipv4Regex.test(input) || ipv6Regex.test(input.replace(/\\[|\\]/g, '')) || ipv6WithPortRegex.test(input) || ipv4WithPortRegex.test(input);
    }
    
    function preprocessInput(input) {
      if (!input) return input;
      let processed = input.trim();
      if (processed.includes(' ')) {
        processed = processed.split(' ')[0];
      }
      return processed;
    }
    
    async function checkProxyIP() {
      if (isChecking) return;
      
      const proxyipInput = document.getElementById('proxyip');
      const resultDiv = document.getElementById('result');
      const checkBtn = document.getElementById('checkBtn');
      const btnText = checkBtn.querySelector('.btn-text');
      const spinner = checkBtn.querySelector('.loading-spinner');
      
      const rawInput = proxyipInput.value;
      const proxyip = preprocessInput(rawInput);
      
      if (proxyip !== rawInput) {
        proxyipInput.value = proxyip;
        showToast('Input automatically cleaned');
      }
      
      if (!proxyip) {
        showToast('Please enter a ProxyIP address');
        proxyipInput.focus();
        return;
      }
      
      const currentTimestamp = calculateTimestamp();
      console.log('Timestamp on check click:', currentTimestamp);
      console.log('Timestamp on page load:', pageLoadTimestamp);
      console.log('Are timestamps consistent:', currentTimestamp === pageLoadTimestamp);
      
      if (currentTimestamp !== pageLoadTimestamp) {
        const currentHost = window.location.host;
        const currentProtocol = window.location.protocol;
        const redirectUrl = \`\${currentProtocol}//\${currentHost}/\${encodeURIComponent(proxyip)}\`;
        
        console.log('Timestamp expired, redirecting to:', redirectUrl);
        showToast('TOKEN expired, refreshing page...');
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
        return;
      }
      
      console.log('Timestamp validation passed, proceeding with check logic');
      
      try {
        localStorage.setItem('lastProxyIP', proxyip);
      } catch (error) {
        console.log('Failed to save history:', error);
      }
      
      isChecking = true;
      checkBtn.classList.add('btn-loading'); // Ensure this class is defined or handled
      checkBtn.disabled = true;
      btnText.style.display = 'none';
      spinner.style.display = 'block';
      resultDiv.classList.remove('show');
      
      try {
        if (isIPAddress(proxyip)) {
          await checkSingleIP(proxyip, resultDiv);
        } else {
          await checkDomain(proxyip, resultDiv);
        }
      } catch (err) {
        resultDiv.innerHTML = \`
          <div class="result-card result-error">
            <h3>❌ Check Failed</h3>
            <p><strong>Error message:</strong> \${err.message}</p>
            <p><strong>Check time:</strong> \${new Date().toLocaleString()}</p>
          </div>
        \`;
        resultDiv.classList.add('show');
      } finally {
        isChecking = false;
        checkBtn.classList.remove('btn-loading');
        checkBtn.disabled = false;
        btnText.style.display = 'block';
        spinner.style.display = 'none';
      }
    }
    
    async function checkSingleIP(proxyip, resultDiv) {
      const response = await fetch(\`./check?proxyip=\${encodeURIComponent(proxyip)}&token=\${frontendSessionToken}\`); // Added token
      const data = await response.json();
      
      if (data.success) {
        const ipInfo = await getIPInfo(data.proxyIP);
        const ipInfoHTML = formatIPInfo(ipInfo);
        
        resultDiv.innerHTML = \`
          <div class="result-card result-success">
            <h3>✅ ProxyIP Valid</h3>
            <div style="margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <strong>🌐 ProxyIP Address:</strong>
                \${createCopyButton(data.proxyIP)}
                \${ipInfoHTML}
                <span style="color: var(--success-color); font-weight: 600; font-size: 18px;">✅</span>
              </div>
              <p><strong>🔌 Port:</strong> \${createCopyButton(data.portRemote.toString())}</p>
              <p><strong>🕒 Check time:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
        \`;
      } else {
        resultDiv.innerHTML = \`
          <div class="result-card result-error">
            <h3>❌ ProxyIP Invalid</h3>
            <div style="margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <strong>🌐 IP Address:</strong>
                \${createCopyButton(proxyip)}
                <span style="color: var(--error-color); font-weight: 600; font-size: 18px;">❌</span>
              </div>
              \${data.error ? \`<p><strong>Error message:</strong> \${data.error}</p>\` : ''}
              <p><strong>🕒 Check time:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
        \`;
      }
      resultDiv.classList.add('show');
    }
    
    async function checkDomain(domain, resultDiv) {
      let portRemote = 443;
      let cleanDomain = domain;
      
      if (domain.includes('.tp')) {
        const portMatch = domain.match(/\\.tp(\\d+)\\./);
        if (portMatch) portRemote = parseInt(portMatch[1]);
      } else if (domain.includes('[') && domain.includes(']:')) {
        portRemote = parseInt(domain.split(']:')[1]) || 443;
        cleanDomain = domain.split(']:')[0] + ']';
      } else if (domain.includes(':') && !domain.startsWith('[')) {
         const parts = domain.split(':');
         if (parts.length > 1 && !isNaN(parseInt(parts[parts.length-1]))) {
            portRemote = parseInt(parts[parts.length-1]) || 443;
            cleanDomain = parts.slice(0,-1).join(':');
         }
      }
      
      const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=\${frontendSessionToken}\`);
      const resolveData = await resolveResponse.json();
      
      if (!resolveData.success) {
        throw new Error(resolveData.error || 'Domain resolution failed');
      }
      
      const ips = resolveData.ips;
      if (!ips || ips.length === 0) {
        throw new Error('No IP address found for the domain');
      }
      
      ipCheckResults.clear();
      
      resultDiv.innerHTML = \`
        <div class="result-card result-warning">
          <h3>🔍 Domain Resolution Results</h3>
          <div style="margin-top: 20px;">
            <p><strong>🌐 ProxyIP Domain:</strong> \${createCopyButton(cleanDomain)}</p>
            <p><strong>🔌 Port:</strong> \${createCopyButton(portRemote.toString())}</p>
            <p><strong>📋 IPs Found:</strong> \${ips.length}</p>
            <p><strong>🕒 Resolution Time:</strong> \${new Date().toLocaleString()}</p>
          </div>
          <div class="ip-grid" id="ip-grid">
            \${ips.map((ip, index) => \`
              <div class="ip-item" id="ip-item-\${index}">
                <div class="ip-status-line" id="ip-status-line-\${index}">
                  <strong>IP:</strong>
                  \${createCopyButton(ip)}
                  <span id="ip-info-\${index}" style="color: var(--text-secondary);">Fetching info...</span>
                  <span class="status-icon" id="status-icon-\${index}">🔄</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
      resultDiv.classList.add('show');
      
      const checkPromises = ips.map((ip, index) => checkIPWithIndex(ip, portRemote, index));
      const ipInfoPromises = ips.map((ip, index) => getIPInfoWithIndex(ip, index));
      
      await Promise.all([...checkPromises, ...ipInfoPromises]);
      
      const validCount = Array.from(ipCheckResults.values()).filter(r => r.success).length;
      const totalCount = ips.length;
      const resultCard = resultDiv.querySelector('.result-card');
      
      if (validCount === totalCount && totalCount > 0) {
        resultCard.className = 'result-card result-success';
        resultCard.querySelector('h3').innerHTML = '✅ All IPs are valid';
      } else if (validCount === 0) {
        resultCard.className = 'result-card result-error';
        resultCard.querySelector('h3').innerHTML = '❌ All IPs are invalid';
      } else {
        resultCard.className = 'result-card result-warning';
        resultCard.querySelector('h3').innerHTML = \`⚠️ Some IPs are valid (\${validCount}/\${totalCount})\`;
      }
    }
    
    async function checkIPWithIndex(ip, port, index) {
      try {
        const cacheKey = \`\${ip}:\${port}\`;
        let result;
        
        if (ipCheckResults.has(cacheKey)) {
          result = ipCheckResults.get(cacheKey);
        } else {
          result = await checkIPStatus(\`\${ip}:\${port}\`); // Pass combined IP:port
          ipCheckResults.set(cacheKey, result);
        }
        
        const itemElement = document.getElementById(\`ip-item-\${index}\`);
        const statusIcon = document.getElementById(\`status-icon-\${index}\`);
        
        if (result.success) {
          itemElement.style.background = 'linear-gradient(135deg, rgba(45, 247, 146, 0.1), rgba(45, 247, 146, 0.05))';
          itemElement.style.borderColor = 'var(--success-color)';
          statusIcon.textContent = '✅';
          statusIcon.style.color = 'var(--success-color)';
        } else {
          itemElement.style.background = 'linear-gradient(135deg, rgba(255, 56, 100, 0.1), rgba(255, 56, 100, 0.05))';
          itemElement.style.borderColor = 'var(--error-color)';
          statusIcon.textContent = '❌';
          statusIcon.style.color = 'var(--error-color)';
        }
      } catch (error) {
        console.error('Failed to check IP:', error);
        const statusIcon = document.getElementById(\`status-icon-\${index}\`);
        if (statusIcon) {
          statusIcon.textContent = '❌';
          statusIcon.style.color = 'var(--error-color)';
        }
        const cacheKey = \`\${ip}:\${port}\`;
        ipCheckResults.set(cacheKey, { success: false, error: error.message });
      }
    }
    
    async function getIPInfoWithIndex(ip, index) {
      try {
        const ipInfo = await getIPInfo(ip);
        const infoElement = document.getElementById(\`ip-info-\${index}\`);
        if (infoElement) {
          infoElement.innerHTML = formatIPInfo(ipInfo);
        }
      } catch (error) {
        console.error('Failed to get IP info:', error);
        const infoElement = document.getElementById(\`ip-info-\${index}\`);
        if (infoElement) {
          infoElement.innerHTML = '<span style="color: var(--text-light);">Failed to fetch info</span>';
        }
      }
    }
    
    async function getIPInfo(ip) {
      try {
        const cleanIP = ip.replace(/[\\[\\]]/g, ''); // Remove brackets for API call
        const response = await fetch(\`./ip-info?ip=\${encodeURIComponent(cleanIP)}&token=\${frontendSessionToken}\`);
        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    }
    
    function formatIPInfo(ipInfo) {
      if (!ipInfo || ipInfo.status !== 'success') {
        return '<span style="color: var(--text-light);">Failed to fetch info</span>';
      }
      
      const country = ipInfo.country || 'Unknown';
      const as = ipInfo.as || 'Unknown';
      
      return \`
        <span class="tag tag-country">\${country}</span>
        <span class="tag tag-as">\${as.split(' ')[0]}</span>
      \`;
    }
    
    async function checkIPStatus(ipWithPort) { // Expects "ip:port" or "[ipv6]:port"
      try {
        const response = await fetch(\`./check?proxyip=\${encodeURIComponent(ipWithPort)}&token=\${frontendSessionToken}\`); // Added token
        const data = await response.json();
        return data;
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  </script>
</body>
</html>
`;

  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  });
}
