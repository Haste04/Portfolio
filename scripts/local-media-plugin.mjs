import { readFile } from 'node:fs/promises';
import { posix } from 'node:path';

const loopback = (address) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);

/** Original libraries are never development assets. Restricted preview is loopback-only. */
export function localMediaPlugin() {
  return {
    name: 'portfolio-local-client-preview',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!loopback(request.socket.localAddress) || !loopback(request.socket.remoteAddress)) {
          response.writeHead(403).end('Local development only');
          return;
        }
        try {
          let pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
          for (let pass = 0; pass < 3 && pathname.includes('%'); pass++) pathname = decodeURIComponent(pathname);
          pathname = posix.normalize(pathname.replaceAll('\\', '/'));
          const directSource = /^\/(project-assets|mr-fresh|\.cache)(\/|$)/i.test(pathname);
          const filesystemSource = pathname.startsWith('/@fs/') && /\/(project-assets|mr-fresh|\.cache)(\/|$)/i.test(pathname);
          const sourceResume = pathname === '/Estavilla Resume.pdf' || (pathname.startsWith('/@fs/') && pathname.endsWith('/Estavilla Resume.pdf'));
          if (directSource || filesystemSource || sourceResume || pathname.includes('%') || pathname.includes('\0')) {
            response.writeHead(403).end('Source library is not served');
            return;
          }
        } catch {
          response.writeHead(403).end('Invalid resource path');
          return;
        }
        next();
      });
      server.middlewares.use('/__local-media/philchan-cebu.webp', async (request, response) => {
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.writeHead(405, { Allow: 'GET, HEAD' }).end();
          return;
        }
        try {
          const bytes = await readFile(new URL('../.cache/local-media/philchan-cebu.webp', import.meta.url));
          response.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
          response.end(request.method === 'HEAD' ? undefined : bytes);
        } catch {
          response.writeHead(404).end('Local preview not prepared');
        }
      });
    },
  };
}
