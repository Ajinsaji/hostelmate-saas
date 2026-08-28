const fs = require('fs');
const path = require('path');

function searchNotifApi(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchNotifApi(full);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      if (code.includes('/api/notifications')) {
        console.log(full);
        const lines = code.split('\n');
        lines.forEach(l => {
          if (l.includes('/api/notifications')) {
            console.log('  ', l.trim());
          }
        });
      }
    }
  }
}
searchNotifApi('./src');
