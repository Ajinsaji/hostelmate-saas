const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

const transport = !isProduction
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
});

const auditLogger = logger.child({ type: 'audit' });

module.exports = { logger, auditLogger };
