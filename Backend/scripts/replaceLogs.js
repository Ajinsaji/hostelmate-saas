const fs = require('fs');
const path = require('path');

function replaceConsole(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceConsole(fullPath);
    } else if (fullPath.endsWith('.js') && !fullPath.includes('node_modules') && !fullPath.includes('scripts')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('console.log') || code.includes('console.error')) {
        // Simple replace for common cases
        code = code.replace(/console\.log/g, 'logger.info');
        code = code.replace(/console\.error/g, 'logger.error');
        
        // Add logger import if missing
        if (!code.includes('const { logger } = require(') && !code.includes('const logger = require(')) {
          // calculate relative path to utils/logger.js
          const relativePath = path.relative(path.dirname(fullPath), path.join(__dirname, '../utils/logger'));
          // convert \ to / for windows
          const importPath = relativePath.replace(/\\/g, '/');
          code = `const { logger } = require("${importPath}");\n` + code;
        }
        
        fs.writeFileSync(fullPath, code);
      }
    }
  }
}

replaceConsole(path.join(__dirname, '../controllers'));
replaceConsole(path.join(__dirname, '../services'));
replaceConsole(path.join(__dirname, '../utils'));
replaceConsole(path.join(__dirname, '../config'));
console.log("Replaced console.log with logger successfully");
