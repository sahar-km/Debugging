import { connect } from 'cloudflare:sockets';
let 临时TOKEN, 永久TOKEN;
export default {
  async fetch(request, env, ctx) {
    const 网站图标 =
      env.ICO ||
      'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
    const url = new URL(request.url);
    const UA = request.headers.get('User-Agent') || 'null';
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31)); // 每31分钟一个时间戳
    临时TOKEN = await 双重哈希(url.hostname + timestamp + UA);
    永久TOKEN = env.TOKEN || 临时TOKEN;

    // 不区分大小写检查路径
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
        if (!url.searchParams.has('token') || url.searchParams.get('token') !== 永久TOKEN) {
          return new Response(
            JSON.stringify(
              {
                status: 'error',
                message: `ProxyIP查询失败: 无效的TOKEN`,
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

      // 获取参数中的IP或使用默认IP
      const proxyIP = url.searchParams.get('proxyip').toLowerCase();

      // 调用CheckProxyIP函数
      const result = await CheckProxyIP(proxyIP);

      // 返回JSON响应，根据检查结果设置不同的状态码
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
        (url.searchParams.get('token') !== 临时TOKEN && url.searchParams.get('token') !== 永久TOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `域名查询失败: 无效的TOKEN`,
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
        (url.searchParams.get('token') !== 临时TOKEN && url.searchParams.get('token') !== 永久TOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP查询失败: 无效的TOKEN`,
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
              message: 'IP参数未提供',
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
        // 使用Worker代理请求HTTP的IP API
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        // 添加时间戳到成功的响应数据中
        data.timestamp = new Date().toISOString();

        // 返回数据给客户端，并添加CORS头
        return new Response(JSON.stringify(data, null, 4), {
          headers: {
            'content-type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('IP查询失败:', error);
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP查询失败: ${error.message}`,
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
        const URLs = await 整理(env[envKey]);
        const URL = URLs[Math.floor(Math.random() * URLs.length)];
        return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
      } else if (env.TOKEN) {
        return new Response(await nginx(), {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
        });
      } else if (path.toLowerCase() === '/favicon.ico') {
        return Response.redirect(网站图标, 302);
      }
      // 直接返回HTML页面，路径解析交给前端处理
      return await HTML(hostname, 网站图标);
    }
  },
};

// 新增域名解析函数
async function resolveDomain(domain) {
  domain = domain.includes(':') ? domain.split(':')[0] : domain;
  try {
    // 并发请求IPv4和IPv6记录
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

    // 添加IPv4地址
    if (ipv4Data.Answer) {
      const ipv4Addresses = ipv4Data.Answer.filter(record => record.type === 1) // A记录
        .map(record => record.data);
      ips.push(...ipv4Addresses);
    }

    // 添加IPv6地址
    if (ipv6Data.Answer) {
      const ipv6Addresses = ipv6Data.Answer.filter(record => record.type === 28) // AAAA记录
        .map(record => `[${record.data}]`); // IPv6地址用方括号包围
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

async function CheckProxyIP(proxyIP) {
  //const portRemote = proxyIP.includes('.tp') ? parseInt(proxyIP.split('.tp')[1].split('.')[0]) || 443 : 443;
  let portRemote = 443;
  if (proxyIP.includes('.tp')) {
    const portMatch = proxyIP.match(/\.tp(\d+)\./);
    if (portMatch) portRemote = parseInt(portMatch[1]);
  } else if (proxyIP.includes('[') && proxyIP.includes(']:')) {
    portRemote = parseInt(proxyIP.split(']:')[1]);
    proxyIP = proxyIP.split(']:')[0] + ']';
  } else if (proxyIP.includes(':')) {
    portRemote = parseInt(proxyIP.split(':')[1]);
    proxyIP = proxyIP.split(':')[0];
  }

  const tcpSocket = connect({
    hostname: proxyIP,
    port: portRemote,
  });

  try {
    // 构建HTTP GET请求
    const httpRequest =
      'GET /cdn-cgi/trace HTTP/1.1\r\n' +
      'Host: speed.cloudflare.com\r\n' +
      'User-Agent: CheckProxyIP/cmliu\r\n' +
      'Connection: close\r\n\r\n';

    // 发送HTTP请求
    const writer = tcpSocket.writable.getWriter();
    await writer.write(new TextEncoder().encode(httpRequest));
    writer.releaseLock();

    // 读取HTTP响应
    const reader = tcpSocket.readable.getReader();
    let responseData = new Uint8Array(0);
    let receivedData = false;

    // 读取所有可用数据
    while (true) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(() => resolve({ done: true }), 5000)), // 5秒超时
      ]);

      if (done) break;
      if (value) {
        receivedData = true;
        // 合并数据
        const newData = new Uint8Array(responseData.length + value.length);
        newData.set(responseData);
        newData.set(value, responseData.length);
        responseData = newData;

        // 检查是否接收到完整响应
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

    // 解析HTTP响应
    const responseText = new TextDecoder().decode(responseData);
    const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;

    // 判断是否成功
    function isValidProxyResponse(responseText, responseData) {
      const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
      const looksLikeCloudflare = responseText.includes('cloudflare');
      const isExpectedError =
        responseText.includes('plain HTTP request') || responseText.includes('400 Bad Request');
      const hasBody = responseData.length > 100;

      return statusCode !== null && looksLikeCloudflare && isExpectedError && hasBody;
    }
    const isSuccessful = isValidProxyResponse(responseText, responseData);

    // 构建JSON响应
    const jsonResponse = {
      success: isSuccessful,
      proxyIP: proxyIP,
      portRemote: portRemote,
      statusCode: statusCode || null,
      responseSize: responseData.length,
      responseData: responseText,
      timestamp: new Date().toISOString(),
    };

    // 关闭连接
    await tcpSocket.close();

    return jsonResponse;
  } catch (error) {
    // 连接失败，返回失败的JSON
    return {
      success: false,
      proxyIP: -1,
      portRemote: -1,
      timestamp: new Date().toISOString(),
      error: error.message || error.toString(),
    };
  }
}

async function 整理(内容) {
  var 替换后的内容 = 内容.replace(/[\r\n]+/g, '|').replace(/\|+/g, '|');
  const 地址数组 = 替换后的内容.split('|');
  const 整理数组 = 地址数组.filter((item, index) => {
    return item !== '' && 地址数组.indexOf(item) === index;
  });

  return 整理数组;
}

async function 双重哈希(文本) {
  const 编码器 = new TextEncoder();

  const 第一次哈希 = await crypto.subtle.digest('MD5', 编码器.encode(文本));
  const 第一次哈希数组 = Array.from(new Uint8Array(第一次哈希));
  const 第一次十六进制 = 第一次哈希数组.map(字节 => 字节.toString(16).padStart(2, '0')).join('');

  const 第二次哈希 = await crypto.subtle.digest('MD5', 编码器.encode(第一次十六进制.slice(7, 27)));
  const 第二次哈希数组 = Array.from(new Uint8Array(第二次哈希));
  const 第二次十六进制 = 第二次哈希数组.map(字节 => 字节.toString(16).padStart(2, '0')).join('');

  return 第二次十六进制.toLowerCase();
}

async function nginx() {
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
    `;
  return text;
}

async function HTML(hostname, 网站图标) {
  // 首页 HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check ProxyIP - 代理IP检测服务</title>
  <link rel="icon" href="${网站图标}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-color: #3498db;
      --primary-dark: #2980b9;
      --secondary-color: #1abc9c;
      --success-color: #2ecc71;
      --warning-color: #f39c12;
      --error-color: #e74c3c;
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fa;
      --bg-tertiary: #e9ecef;
      --text-primary: #2c3e50;
      --text-secondary: #6c757d;
      --text-light: #adb5bd;
      --border-color: #dee2e6;
      --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .subtitle {
      font-size: 1.2rem;
      color: rgba(255,255,255,0.9);
      font-weight: 400;
      margin-bottom: 8px;
    }
    
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 50px;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      border: 1px solid rgba(255,255,255,0.3);
    }
    
    .card {
      background: var(--bg-primary);
      border-radius: var(--border-radius);
      padding: 32px;
      box-shadow: var(--shadow-lg);
      margin-bottom: 32px;
      border: 1px solid var(--border-color);
      transition: var(--transition);
      animation: fadeInUp 0.8s ease-out;
      backdrop-filter: blur(20px);
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
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    }
    
    .form-section {
      margin-bottom: 32px;
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
      background: var(--bg-primary);
      color: var(--text-primary);
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.1);
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
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.6s;
    }
    
    .btn:hover::before {
      left: 100%;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      box-shadow: var(--shadow-md);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
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
    
    .btn-loading {
      pointer-events: none;
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
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
      border-color: var(--success-color);
      color: #155724;
    }
    
    .result-error {
      background: linear-gradient(135deg, #f8d7da, #f5c6cb);
      border-color: var(--error-color);
      color: #721c24;
    }
    
    .result-warning {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border-color: var(--warning-color);
      color: #856404;
    }
    
    .ip-grid {
      display: grid;
      gap: 16px;
      margin-top: 20px;
    }
    
    .ip-item {
      background: rgba(255,255,255,0.9);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 20px;
      transition: var(--transition);
      position: relative;
    }
    
    .ip-item:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
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
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
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
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .tag-as {
      background: #f3e5f5;
      color: #7b1fa2;
    }
    
    .api-docs {
      background: var(--bg-primary);
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
      background: #2d3748;
      color: #e2e8f0;
      padding: 20px;
      border-radius: var(--border-radius-sm);
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      overflow-x: auto;
      margin: 16px 0;
      border: 1px solid #4a5568;
      position: relative;
    }
    
    .code-block::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #48bb78, #38b2ac);
    }
    
    .highlight {
      color: #f56565;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding: 20px 20px 20px;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      margin-top: 40px;
      border-top: 1px solid rgba(255,255,255,0.1);
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
      fill: rgba(255,255,255,0.9);
      color: var(--primary-color);
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      .container {
        padding: 16px;
      }
      
      .card {
        padding: 24px;
        margin-bottom: 24px;
      }
      
      .input-group {
        flex-direction: column;
        align-items: stretch;
      }
      
      .input-wrapper {
        min-width: auto;
      }
      
      .btn {
        width: 100%;
      }
      
      .github-corner svg {
        width: 60px;
        height: 60px;
      }
      
      .github-corner:hover .octo-arm {
        animation: none;
      }
      
      .github-corner .octo-arm {
        animation: octocat-wave 560ms ease-in-out;
      }
      
      .main-title {
        font-size: 2.5rem;
      }
    }
    
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--text-primary);
      color: white;
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
        <label for="proxyip" class="form-label">🔍 输入 ProxyIP 地址</label>
        <div class="input-group">
          <div class="input-wrapper">
            <input type="text" id="proxyip" class="form-input" placeholder="例如: 1.2.3.4:443 或 example.com" autocomplete="off">
          </div>
          <button id="checkBtn" class="btn btn-primary" onclick="checkProxyIP()">
            <span class="btn-text">检测</span>
            <div class="loading-spinner" style="display: none;"></div>
          </button>
        </div>
      </div>
      
      <div id="result" class="result-section"></div>
    </div>
    
    <div class="api-docs">
      <h2 class="section-title">📚 API 文档</h2>
      <p style="margin-bottom: 24px; color: var(--text-secondary); font-size: 1.1rem;">
        提供简单易用的 RESTful API 接口，支持批量检测和域名解析
      </p>
      
      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">📍 检查ProxyIP</h3>
      <div class="code-block">
        <strong style="color: #68d391;">GET</strong> /check?proxyip=<span class="highlight">YOUR_PROXY_IP</span>
      </div>
      
      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">💡 使用示例</h3>
      <div class="code-block">
curl "https://${hostname}/check?proxyip=1.2.3.4:443"
      </div>

      <h3 style="color: var(--text-primary); margin: 24px 0 16px;">🔗 响应Json格式</h3>
      <div class="code-block">
{<br>
&nbsp;&nbsp;"success": true|false, // 代理 IP 是否有效<br>
&nbsp;&nbsp;"proxyIP": "1.2.3.4", // 如果有效,返回代理 IP,否则为 -1<br>
&nbsp;&nbsp;"portRemote": 443, // 如果有效,返回端口,否则为 -1<br>
&nbsp;&nbsp;"timestamp": "2025-05-10T14:44:30.597Z" // 检查时间<br>
}<br>
      </div>
    </div>
    <footer class="footer">
      <p style="margin-top: 8px; opacity: 0.8;">© 2025 Check ProxyIP - 基于 Cloudflare Workers 构建的高性能 ProxyIP 验证服务 | 由 <strong>cmliu</strong> 开发</p>
    </footer>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    // 全局变量
    let isChecking = false;
    const ipCheckResults = new Map(); // 缓存IP检查结果
    let pageLoadTimestamp; // 页面加载时的时间戳
    
    // 计算时间戳的函数
    function calculateTimestamp() {
      const currentDate = new Date();
      return Math.ceil(currentDate.getTime() / (1000 * 60 * 13)); // 每13分钟一个时间戳
    }
    
    // 添加前端的代理IP格式验证函数
    function isValidProxyIPFormat(input) {
      // 检查是否为域名格式
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$/;
      // 检查是否为IP格式
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;

      // 允许带端口的格式
      const withPortRegex = /^.+:\\d+$/;
      const tpPortRegex = /^.+\\.tp\\d+\\./;

      return domainRegex.test(input) ||
        ipv4Regex.test(input) ||
        ipv6Regex.test(input) ||
        withPortRegex.test(input) ||
        tpPortRegex.test(input);
    }
    
    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      // 记录页面加载时的时间戳
      pageLoadTimestamp = calculateTimestamp();
      console.log('页面加载完成，时间戳:', pageLoadTimestamp);
      
      const input = document.getElementById('proxyip');
      input.focus();
      
      // 直接解析当前URL路径
      const currentPath = window.location.pathname;
      let autoCheckValue = null;
      
      // 检查URL参数中的autocheck（保持兼容性）
      const urlParams = new URLSearchParams(window.location.search);
      autoCheckValue = urlParams.get('autocheck');
      
      // 如果没有autocheck参数，检查路径
      if (!autoCheckValue && currentPath.length > 1) {
        const pathContent = currentPath.substring(1); // 移除开头的 '/'
        
        // 检查路径是否为有效的代理IP格式
        if (isValidProxyIPFormat(pathContent)) {
          autoCheckValue = pathContent;
          // 清理URL，移除路径部分
          const newUrl = new URL(window.location);
          newUrl.pathname = '/';
          window.history.replaceState({}, '', newUrl);
        }
      }
      
      // 如果没有从URL获取到值，尝试从localStorage获取上次搜索的地址
      if (!autoCheckValue) {
        try {
          const lastSearch = localStorage.getItem('lastProxyIP');
          if (lastSearch && isValidProxyIPFormat(lastSearch)) {
            input.value = lastSearch;
            // 不自动执行检测，只是填充输入框
          }
        } catch (error) {
          console.log('读取历史记录失败:', error);
        }
      }
      
      if (autoCheckValue) {
        input.value = autoCheckValue;
        // 如果来自URL参数，清除参数
        if (urlParams.has('autocheck')) {
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('autocheck');
          window.history.replaceState({}, '', newUrl);
        }
        
        // 延迟执行搜索，确保页面完全加载
        setTimeout(() => {
          if (!isChecking) {
            checkProxyIP();
          }
        }, 500);
      }
      
      // 输入框回车事件
      input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !isChecking) {
          checkProxyIP();
        }
      });
      
      // 添加事件委托处理复制按钮点击
      document.addEventListener('click', function(event) {
        if (event.target.classList.contains('copy-btn')) {
          const text = event.target.getAttribute('data-copy');
          if (text) {
            copyToClipboard(text, event.target);
          }
        }
      });
    });
    
    // 显示toast消息
    function showToast(message, duration = 3000) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
    }
    
    // 复制到剪贴板
    function copyToClipboard(text, element) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = element.textContent;
        element.classList.add('copied');
        element.textContent = '已复制 ✓';
        showToast('复制成功！');
        
        setTimeout(() => {
          element.classList.remove('copied');
          element.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
      });
    }
    
    // 创建复制按钮
    function createCopyButton(text) {
      return \`<span class="copy-btn" data-copy="\${text}">\${text}</span>\`;
    }
    
    // 检查是否为IP地址
    function isIPAddress(input) {
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
      const ipv6WithPortRegex = /^\\[[0-9a-fA-F:]+\\]:\\d+$/;
      const ipv4WithPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\\d+$/;
      
      return ipv4Regex.test(input) || ipv6Regex.test(input) || ipv6WithPortRegex.test(input) || ipv4WithPortRegex.test(input);
    }
    
    // 添加输入预处理函数
    function preprocessInput(input) {
      if (!input) return input;
      
      // 去除首尾空格
      let processed = input.trim();
      
      // 检查是否还有空格
      if (processed.includes(' ')) {
        // 只保留第一个空格前的内容
        processed = processed.split(' ')[0];
      }
      
      return processed;
    }
    
    // 主检测函数
    async function checkProxyIP() {
      if (isChecking) return;
      
      const proxyipInput = document.getElementById('proxyip');
      const resultDiv = document.getElementById('result');
      const checkBtn = document.getElementById('checkBtn');
      const btnText = checkBtn.querySelector('.btn-text');
      const spinner = checkBtn.querySelector('.loading-spinner');
      
      const rawInput = proxyipInput.value;
      const proxyip = preprocessInput(rawInput);
      
      // 如果预处理后的值与原值不同，更新输入框
      if (proxyip !== rawInput) {
        proxyipInput.value = proxyip;
        showToast('已自动清理输入内容');
      }
      
      if (!proxyip) {
        showToast('请输入代理IP地址');
        proxyipInput.focus();
        return;
      }
      
      // 检查时间戳是否过期
      const currentTimestamp = calculateTimestamp();
      console.log('点击检测时的时间戳:', currentTimestamp);
      console.log('页面加载时的时间戳:', pageLoadTimestamp);
      console.log('时间戳是否一致:', currentTimestamp === pageLoadTimestamp);
      
      if (currentTimestamp !== pageLoadTimestamp) {
        // 时间戳已过期，需要重新加载页面获取最新TOKEN
        const currentHost = window.location.host;
        const currentProtocol = window.location.protocol;
        const redirectUrl = \`\${currentProtocol}//\${currentHost}/\${encodeURIComponent(proxyip)}\`;
        
        console.log('时间戳过期，即将跳转到:', redirectUrl);
        showToast('TOKEN已过期，正在刷新页面...');
        
        // 延迟跳转，让用户看到提示
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
        
        return;
      }
      
      console.log('时间戳验证通过，继续执行检测逻辑');
      
      // 保存到localStorage
      try {
        localStorage.setItem('lastProxyIP', proxyip);
      } catch (error) {
        console.log('保存历史记录失败:', error);
      }
      
      // 设置加载状态
      isChecking = true;
      checkBtn.classList.add('btn-loading');
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
            <h3>❌ 检测失败</h3>
            <p><strong>错误信息:</strong> \${err.message}</p>
            <p><strong>检测时间:</strong> \${new Date().toLocaleString()}</p>
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
    
    // 检查单个IP
    async function checkSingleIP(proxyip, resultDiv) {
      const response = await fetch(\`./check?proxyip=\${encodeURIComponent(proxyip)}\`);
      const data = await response.json();
      
      if (data.success) {
        const ipInfo = await getIPInfo(data.proxyIP);
        const ipInfoHTML = formatIPInfo(ipInfo);
        
        resultDiv.innerHTML = \`
          <div class="result-card result-success">
            <h3>✅ ProxyIP 有效</h3>
            <div style="margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <strong>🌐 ProxyIP 地址:</strong>
                \${createCopyButton(data.proxyIP)}
                \${ipInfoHTML}
                <span style="color: var(--success-color); font-weight: 600; font-size: 18px;">✅</span>
              </div>
              <p><strong>🔌 端口:</strong> \${createCopyButton(data.portRemote.toString())}</p>
              <p><strong>🕒 检测时间:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
        \`;
      } else {
        resultDiv.innerHTML = \`
          <div class="result-card result-error">
            <h3>❌ ProxyIP 失效</h3>
            <div style="margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <strong>🌐 IP地址:</strong>
                \${createCopyButton(proxyip)}
                <span style="color: var(--error-color); font-weight: 600; font-size: 18px;">❌</span>
              </div>
              \${data.error ? \`<p><strong>错误信息:</strong> \${data.error}</p>\` : ''}
              <p><strong>🕒 检测时间:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
        \`;
      }
      resultDiv.classList.add('show');
    }
    
    // 检查域名
    async function checkDomain(domain, resultDiv) {
      let portRemote = 443;
      let cleanDomain = domain;
      
      // 解析端口
      if (domain.includes('.tp')) {
        portRemote = domain.split('.tp')[1].split('.')[0] || 443;
      } else if (domain.includes('[') && domain.includes(']:')) {
        portRemote = parseInt(domain.split(']:')[1]) || 443;
        cleanDomain = domain.split(']:')[0] + ']';
      } else if (domain.includes(':')) {
        portRemote = parseInt(domain.split(':')[1]) || 443;
        cleanDomain = domain.split(':')[0];
      }
      
      // 解析域名
      const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=${临时TOKEN}\`);
      const resolveData = await resolveResponse.json();
      
      if (!resolveData.success) {
        throw new Error(resolveData.error || '域名解析失败');
      }
      
      const ips = resolveData.ips;
      if (!ips || ips.length === 0) {
        throw new Error('未找到域名对应的IP地址');
      }
      
      // 清空缓存
      ipCheckResults.clear();
      
      // 显示初始结果
      resultDiv.innerHTML = \`
        <div class="result-card result-warning">
          <h3>🔍 域名解析结果</h3>
          <div style="margin-top: 20px;">
            <p><strong>🌐 ProxyIP 域名:</strong> \${createCopyButton(cleanDomain)}</p>
            <p><strong>🔌 端口:</strong> \${createCopyButton(portRemote.toString())}</p>
            <p><strong>📋 发现IP:</strong> \${ips.length} 个</p>
            <p><strong>🕒 解析时间:</strong> \${new Date().toLocaleString()}</p>
          </div>
          <div class="ip-grid" id="ip-grid">
            \${ips.map((ip, index) => \`
              <div class="ip-item" id="ip-item-\${index}">
                <div class="ip-status-line" id="ip-status-line-\${index}">
                  <strong>IP:</strong>
                  \${createCopyButton(ip)}
                  <span id="ip-info-\${index}" style="color: var(--text-secondary);">获取信息中...</span>
                  <span class="status-icon" id="status-icon-\${index}">🔄</span>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
      resultDiv.classList.add('show');
      
      // 并发检查所有IP和获取IP信息
      const checkPromises = ips.map((ip, index) => checkIPWithIndex(ip, portRemote, index));
      const ipInfoPromises = ips.map((ip, index) => getIPInfoWithIndex(ip, index));
      
      await Promise.all([...checkPromises, ...ipInfoPromises]);
      
      // 使用缓存的结果更新整体状态
      const validCount = Array.from(ipCheckResults.values()).filter(r => r.success).length;
      const totalCount = ips.length;
      const resultCard = resultDiv.querySelector('.result-card');
      
      if (validCount === totalCount) {
        resultCard.className = 'result-card result-success';
        resultCard.querySelector('h3').innerHTML = '✅ 所有IP均有效';
      } else if (validCount === 0) {
        resultCard.className = 'result-card result-error';
        resultCard.querySelector('h3').innerHTML = '❌ 所有IP均失效';
      } else {
        resultCard.className = 'result-card result-warning';
        resultCard.querySelector('h3').innerHTML = \`⚠️ 部分IP有效 (\${validCount}/\${totalCount})\`;
      }
    }
    
    // 检查单个IP（带索引）
    async function checkIPWithIndex(ip, port, index) {
      try {
        const cacheKey = \`\${ip}:\${port}\`;
        let result;
        
        // 检查是否已有缓存结果
        if (ipCheckResults.has(cacheKey)) {
          result = ipCheckResults.get(cacheKey);
        } else {
          // 调用API检查IP状态
          result = await checkIPStatus(cacheKey);
          // 缓存结果
          ipCheckResults.set(cacheKey, result);
        }
        
        const itemElement = document.getElementById(\`ip-item-\${index}\`);
        const statusIcon = document.getElementById(\`status-icon-\${index}\`);
        
        if (result.success) {
          itemElement.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
          itemElement.style.borderColor = 'var(--success-color)';
          statusIcon.textContent = '✅';
          statusIcon.className = 'status-icon status-success';
          statusIcon.style.color = 'var(--success-color)';
          statusIcon.style.fontSize = '18px';
        } else {
          itemElement.style.background = 'linear-gradient(135deg, #f8d7da, #f5c6cb)';
          itemElement.style.borderColor = 'var(--error-color)';
          statusIcon.textContent = '❌';
          statusIcon.className = 'status-icon status-error';
          statusIcon.style.color = 'var(--error-color)';
          statusIcon.style.fontSize = '18px';
        }
      } catch (error) {
        console.error('检查IP失败:', error);
        const statusIcon = document.getElementById(\`status-icon-\${index}\`);
        if (statusIcon) {
          statusIcon.textContent = '❌';
          statusIcon.className = 'status-icon status-error';
          statusIcon.style.color = 'var(--error-color)';
          statusIcon.style.fontSize = '18px';
        }
        // 将失败结果也缓存起来
        const cacheKey = \`\${ip}:\${port}\`;
        ipCheckResults.set(cacheKey, { success: false, error: error.message });
      }
    }
    
    // 获取IP信息（带索引）
    async function getIPInfoWithIndex(ip, index) {
      try {
        const ipInfo = await getIPInfo(ip);
        const infoElement = document.getElementById(\`ip-info-\${index}\`);
        if (infoElement) {
          infoElement.innerHTML = formatIPInfo(ipInfo);
        }
      } catch (error) {
        console.error('获取IP信息失败:', error);
        const infoElement = document.getElementById(\`ip-info-\${index}\`);
        if (infoElement) {
          infoElement.innerHTML = '<span style="color: var(--text-light);">信息获取失败</span>';
        }
      }
    }
    
    // 获取IP信息
    async function getIPInfo(ip) {
      try {
        const cleanIP = ip.replace(/[\\[\\]]/g, '');
        const response = await fetch(\`./ip-info?ip=\${encodeURIComponent(cleanIP)}&token=${临时TOKEN}\`);
        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    }
    
    // 格式化IP信息
    function formatIPInfo(ipInfo) {
      if (!ipInfo || ipInfo.status !== 'success') {
        return '<span style="color: var(--text-light);">信息获取失败</span>';
      }
      
      const country = ipInfo.country || '未知';
      const as = ipInfo.as || '未知';
      
      return \`
        <span class="tag tag-country">\${country}</span>
        <span class="tag tag-as">\${as}</span>
      \`;
    }
    
    // 检查IP状态
    async function checkIPStatus(ip) {
      try {
        const response = await fetch(\`./check?proxyip=\${encodeURIComponent(ip)}\`);
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
