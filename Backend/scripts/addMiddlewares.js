const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../server.js');
let code = fs.readFileSync(targetPath, 'utf8');

const importLines = `
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");
const { logger } = require("./utils/logger");
`;

if (!code.includes("helmet")) {
  code = code.replace(/const express = require\("express"\);/, `const express = require("express");${importLines}`);
}

const middlewareLines = `
// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs in production
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Pino Request Logger
app.use(pinoHttp({ logger }));
`;

if (!code.includes("helmet()")) {
  code = code.replace(/app\.use\(express\.json\(\)\);/, `app.use(express.json());\n${middlewareLines}`);
}

// Convert console.log to logger.info in server.js
code = code.replace(/console\.log\(/g, "logger.info(");
code = code.replace(/console\.error\(/g, "logger.error(");

fs.writeFileSync(targetPath, code);
console.log("Middlewares injected successfully");
