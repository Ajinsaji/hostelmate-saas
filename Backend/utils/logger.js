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

const redactOptions = {
  paths: [
    'req.headers.authorization',
    'req.headers.Authorization',
    'req.headers.cookie',
    'req.headers.Cookie',
    'req.headers["x-api-key"]',
    'req.headers["x-auth-token"]',
    'req.headers["X-Api-Key"]',
    'req.headers["X-Auth-Token"]',
    'headers.authorization',
    'headers.Authorization',
    'headers.cookie',
    'headers.Cookie',
    'headers["x-api-key"]',
    'headers["x-auth-token"]',
    'headers["X-Api-Key"]',
    'headers["X-Auth-Token"]',
    '*.authorization',
    '*.Authorization',
    '*.cookie',
    '*.Cookie',
    '*.password',
    '*.passwordHash',
    '*.tempPassword',
    '*.idNumber',
    '*.aadhaar',
    '*.aadhaarNumber',
    '*.aadhaarFile',
    '*.aadhaarBack',
    '*.passportNumber',
    '*.hostelLicense',
    '*.licensePhoto',
    '*.ownerPhoto',
    '*.selfie',
    '*.photoFile',
    '*.idProof',
    '*.idProofFile',
    '*.signatureFile',
    '*.signatureImage',
    '*.token',
    '*.accessToken',
    '*.access_token',
    '*.refreshToken',
    '*.refresh_token',
    '*.resetPasswordToken',
    '*.whatsappToken',
    '*.apiKey',
    '*.apiSecret',
    '*.jwtSecret',
    '*.secretKey',
    '*.webhookSecret',
  ],
  censor: '[REDACTED]',
};

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport,
  redact: redactOptions,
});

const auditLogger = logger.child({ type: 'audit' });

module.exports = { logger, auditLogger, redactOptions };

