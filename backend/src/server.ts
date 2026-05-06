import { config } from './config';
import app from './app';

const server = app.listen(config.port, () => {
  if (config.nodeEnv !== 'test') {
    console.info(`Grosery API listening on port ${config.port}`);
  }
});

const shutdown = (signal: string) => {
  console.info(`${signal} received, closing server.`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
