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

  await new Promise(r => setTimeout(r, 1500));

  const pages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json', res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageInfo = pages.find(p => p.type === 'page' && !p.url.startsWith('chrome-extension://')) || pages.find(p => p.type === 'page') || pages[0];
  console.log('Connecting to page:', pageInfo.url, pageInfo.id);
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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const cb = pending.get(msg.id);
      pending.delete(msg.id);
      cb(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const screenshotsDir = path.join(__dirname, '..', 'screenshots');

  // Navigate to dashboard first and set localStorage active staff to Padma Reddy (Admin)
  await send('Page.navigate', { url: 'http://localhost:3005/dashboard' });
  await new Promise(r => setTimeout(r, 2000));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('rishi_active_staff_id', '22222222-2222-2222-2222-222222222222');
      })()
    `
  });

  // Navigate to settings with tab=catalogue
  console.log('Navigating to settings catalogue tab as Admin...');
  await send('Page.navigate', { url: 'http://localhost:3005/settings?tab=catalogue' });
  await new Promise(r => setTimeout(r, 2000));

  // Capture Catalogue tab
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'settings-tab-catalogue.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved settings-tab-catalogue.png');

  // Open "Add Lab Test" modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent && b.textContent.includes('Add Lab Test'));
        if (addBtn) addBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'modal-add-lab-test.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved modal-add-lab-test.png');

  // Close modal and navigate to components tab
  await send('Page.navigate', { url: 'http://localhost:3005/settings?tab=components' });
  await new Promise(r => setTimeout(r, 1500));

  // Open "Add Component" modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(b => b.textContent && b.textContent.includes('Add Component'));
        if (addBtn) addBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'modal-add-component.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved modal-add-component.png');

  // Navigate to templates tab
  await send('Page.navigate', { url: 'http://localhost:3005/settings?tab=templates' });
  await new Promise(r => setTimeout(r, 1500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'settings-tab-templates.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved settings-tab-templates.png');

  // Navigate to signatories tab
  await send('Page.navigate', { url: 'http://localhost:3005/settings?tab=signatories' });
  await new Promise(r => setTimeout(r, 1500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'settings-tab-signatories.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved settings-tab-signatories.png');

  // Navigate to Finance as Admin
  await send('Page.navigate', { url: 'http://localhost:3005/finance' });
  await new Promise(r => setTimeout(r, 1500));
  shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'finance-admin-1440.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved finance-admin-1440.png');

  // Reset back to Staff in localStorage for normal staff workflows
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        localStorage.setItem('rishi_active_staff_id', '33333333-3333-3333-3333-333333333333');
      })()
    `
  });

  try { ws.close(); } catch {}
  try { chrome.kill(); } catch {}
  setTimeout(() => process.exit(0), 500);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
