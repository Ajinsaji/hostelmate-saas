const fs = require('fs');
const path = require('path');

function search(dir, patterns) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') search(full, patterns);
    } else if (/\.(jsx|js|html)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      patterns.forEach(p => {
        const re = new RegExp(p, 'i');
        content.split('\n').forEach((line, i) => {
          if (re.test(line)) {
            console.log(`${full}:${i+1}: ${line.trim().substring(0, 120)}`);
          }
        });
      });
    }
  }
}

const dir = path.resolve(__dirname, '../../Frontend/src');
search(dir, [
  'All Caught Up',
  'Rent Reminders',
  'Payment Receipts',
  'Failed Deliveries',
  'TODAY\'S TASKS',
  'DocumentPreviewCard',
  'aadhaar',
  'license'
]);
