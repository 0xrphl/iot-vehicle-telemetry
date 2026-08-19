const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3334;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let fp = '.' + decodeURIComponent(req.url.split('?')[0]);
  if (fp === './') fp = './index.html';

  fs.readFile(fp, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + fp);
      return;
    }
    const ext = path.extname(fp);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  ⚡ IoT Telemetry Architecture`);
  console.log(`  🌐 http://localhost:${PORT}\n`);
  // Auto-open browser on Windows
  require('child_process').exec(`start http://localhost:${PORT}`);
});
