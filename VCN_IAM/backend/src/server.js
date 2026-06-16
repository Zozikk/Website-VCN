import { env } from './config/env.js';
import { createApp } from './app.js';

const { app, store } = await createApp();

const server = app.listen(env.port, () => {
  console.log(`Auth server listening on http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);

  server.close(async () => {
    try {
      store.close();
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));