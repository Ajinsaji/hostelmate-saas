const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(searchFiles(fullPath));
    } else if (fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // match {variable} not {variable.prop}
        const matches = line.match(/\{([a-zA-Z_]\w*)\}/g);
        if (matches) {
          for (const match of matches) {
            const varName = match.replace(/[{}]/g, '');
            // check if it might be an object
            if (['resident', 'drawerData', 'item', 'data', 'details', 'profile', 'owner', 'request', 'selectedItem'].includes(varName)) {
              results.push(`Found in ${fullPath}:${i+1} -> ${line.trim()}`);
            }
          }
        }
      }
    }
  }
  return results;
}

const res = searchFiles('C:\\Users\\my pc\\Desktop\\Hostelmate\\hostelmate-saas\\Frontend\\src\\superadmin');
res.forEach(r => console.log(r));
