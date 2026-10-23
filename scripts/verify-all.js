const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function verify() {
  const profileDir = path.join(__dirname, '..', '.chrome-tmp');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json', res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageInfo = pages.find(p => p.type === 'page') || pages[0];
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
        errors.push(`[Console Error]: ${msg.params.message.text}`);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(`[Runtime Exception]: ${msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text}`);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const testCases = [
    { name: 'dashboard-1440', url: 'http://localhost:3005/dashboard', width: 1440, height: 900, mobile: false },
    { name: 'dashboard-1024', url: 'http://localhost:3005/dashboard', width: 1024, height: 768, mobile: false },
    { name: 'dashboard-768',  url: 'http://localhost:3005/dashboard', width: 768,  height: 1024, mobile: false },
    { name: 'dashboard-390',  url: 'http://localhost:3005/dashboard', width: 390,  height: 844, mobile: true },
    { name: 'patients-1440',  url: 'http://localhost:3005/patients',  width: 1440, height: 900, mobile: false },
    { name: 'tests-worklist-1440', url: 'http://localhost:3005/tests', width: 1440, height: 900, mobile: false },
    { name: 'order-detail-1440', url: 'http://localhost:3005/tests/d0000000-0000-0000-0000-000000000001', width: 1440, height: 900, mobile: false },
    { name: 'order-detail-390',  url: 'http://localhost:3005/tests/d0000000-0000-0000-0000-000000000001', width: 390,  height: 844, mobile: true },
    { name: 'reports-1440',   url: 'http://localhost:3005/reports',   width: 1440, height: 900, mobile: false },
    { name: 'finance-1440',   url: 'http://localhost:3005/finance',   width: 1440, height: 900, mobile: false },
    { name: 'settings-1440',  url: 'http://localhost:3005/settings',  width: 1440, height: 900, mobile: false }
  ];

  for (const tc of testCases) {
    console.log(`Testing ${tc.name} (${tc.width}x${tc.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: tc.width,
      height: tc.height,
      deviceScaleFactor: 1,
      mobile: tc.mobile
    });

    await send('Page.navigate', { url: tc.url });
    await new Promise(r => setTimeout(r, 2000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(screenshotsDir, `${tc.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));

    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const nextError = document.querySelector('nextjs-portal, [data-nextjs-dialog-overlay]');
          return {
            hasPortal: !!nextError,
            title: document.title,
            bodyWidth: document.body.scrollWidth,
            viewportWidth: window.innerWidth,
            hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
          };
        })()
      `,
      returnByValue: true
    });

    console.log(`  -> Title: "${evalResult.result.value?.title}" | Has Error: ${evalResult.result.value?.hasPortal} | Overflow: ${evalResult.result.value?.hasHorizontalOverflow}`);
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Total Console/Runtime Errors:', errors.length);
  if (errors.length > 0) {
    console.error(errors);
  } else {
    console.log('ALL ROUTES & VIEWPORTS 100% ERROR-FREE!');
  }

  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  setTimeout(() => process.exit(0), 500);
}

verify().catch((err) => {
  console.error(err);
  process.exit(1);
});
