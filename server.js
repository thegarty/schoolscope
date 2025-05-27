const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { runStartup } = require('./src/lib/startup');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  try {
    // Run startup tasks first
    await runStartup();
    
    // Prepare Next.js app
    await app.prepare();
    
    // Create server
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });
    
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`🚀 Ready on http://${hostname}:${port}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 