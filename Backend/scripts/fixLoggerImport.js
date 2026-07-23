const fs = require('fs');
const path = require('path');

function fixLogger(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixLogger(fullPath);
    } else if (fullPath.endsWith('.js') && !fullPath.includes('node_modules')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      if (code.includes('require(./logger)')) {
        code = code.replace(/require\("logger"\)/g, 'require("./logger")');
        fs.writeFileSync(fullPath, code);
      }
    }
  }
}

fixLogger(path.join(__dirname, '../utils'));
console.log("Fixed require('logger') globally in utils");
