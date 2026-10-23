const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function run() {
  const profileDir = path.join(__dirname, '..', '.chrome-tmp');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  // Wait 1.5s for Chrome to bind port
  await new Promise(r => setTimeout(r, 1500));

  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json', res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageInfo = pages.find(p => p.type === 'page') || pages[0];
  console.log('Target page found:', pageInfo.id, pageInfo.url);
  const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const errors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      cb(msg.result);
      return;
    }
    if (msg.method === 'Console.messageAdded') {
      if (msg.params.message.level === 'error') {
        errors.push(msg.params.message.text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  // Set desktop viewport 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:3005/dashboard' });
  await new Promise(r => setTimeout(r, 2500));

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(__dirname, '..', 'screenshot-1440.png');
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to:', outPath);

  // Evaluate any Next.js error overlays in the DOM
  const evalResult = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const nextError = document.querySelector('nextjs-portal, [data-nextjs-dialog-overlay]');
        const errorNodes = Array.from(document.querySelectorAll('*')).filter(el => (el.textContent || '').includes('1 error'));
        return {
          hasPortal: !!nextError,
          portalText: nextError ? nextError.innerText : null,
          title: document.title,
          bodyHtmlSlice: document.body.innerHTML.substring(0, 300)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('DOM Evaluation:', evalResult.result.value);
  console.log('Collected Console/Runtime Errors:', errors);

  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  setTimeout(() => process.exit(0), 500);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
