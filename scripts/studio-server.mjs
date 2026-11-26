#!/usr/bin/env node
/**
 * @file scripts/studio-server.mjs
 * @description Zero-Dependency Live Preview & Render Harness Server for Agent Motion Studio.
 * Binds to 0.0.0.0 with permissive CORS / Host acceptance so it works seamlessly on
 * local machines, Claude Code terminals, Docker containers, and cloud live previews.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export function createStudioHttpServer({ specPath = null } = {}) {
  return http.createServer((req, res) => {
    // Allow embedding & cross-origin preview without host blocking
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    const parsed = new URL(req.url || '/', 'http://localhost');
    let pathname = decodeURIComponent(parsed.pathname);

    // Endpoint to serve custom JSON SceneSpec passed via CLI or default example
    if (pathname === '/api/spec') {
      const target = specPath
        ? path.resolve(ROOT, specPath)
        : path.join(ROOT, 'examples/sample-agent-spec.json');
      if (fs.existsSync(target)) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(target, 'utf-8'));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Spec not found' }));
      }
      return;
    }

    if (pathname === '/') {
      pathname = '/studio/index.html';
    }

    const safePath = path.normalize(path.join(ROOT, pathname));
    if (!safePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
}

// Run directly if invoked as main script
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4321);
  const host = process.env.HOST || '0.0.0.0';
  const server = createStudioHttpServer();
  server.listen(port, host, () => {
    console.log(`🎬 Agent Motion Studio Live Preview: http://${host}:${port}`);
  });
}
