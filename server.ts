import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './src/lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0'; // Listen on all interfaces
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.io
    initSocketServer(server);

    // Listen on all network interfaces
    server.listen(port, '0.0.0.0', () => {
        console.log(`> Ready on http://0.0.0.0:${port}`);
        console.log(`> Access from local network: http://<YOUR_IP>:${port}`);
        console.log(`> Socket.io server initialized`);
    });
});
