import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  try {
    // Prevent directory traversal attacks
    let safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
    let fileLoc = path.join(PUBLIC_DIR, safeSuffix);

    // If the URL is a directory, serve index.html
    if (fs.existsSync(fileLoc) && fs.statSync(fileLoc).isDirectory()) {
      fileLoc = path.join(fileLoc, 'index.html');
    }

    // Check file existence
    if (!fs.existsSync(fileLoc)) {
      res.statusCode = 404;
      res.end('404 Not Found');
      return;
    }

    // Get file extension and content type
    const ext = path.extname(fileLoc).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });

    const stream = fs.createReadStream(fileLoc);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('File stream error:', err);
      res.statusCode = 500;
      res.end('500 Internal Server Error');
    });

  } catch (err) {
    console.error('Server error:', err);
    res.statusCode = 500;
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/`);
});
