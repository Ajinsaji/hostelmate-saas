const fs = require('fs');
const path = require('path');

function searchFiles(dir, patterns, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }
      searchFiles(fullPath, patterns, results);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      patterns.forEach(pattern => {
        let regex = typeof pattern === 'string' ? new RegExp(pattern, 'gi') : pattern;
        let match;
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            results.push({
              file: fullPath,
              lineNum: idx + 1,
              pattern: pattern.toString(),
              line: line.trim()
            });
          }
        });
      });
    }
  }
  return results;
}

const baseDir = path.resolve(__dirname, '..', '..');
console.log('Searching in:', baseDir);

const patterns = [
  'OWNER_ACCOUNT_ACTIVATED',
  'Controlled Activation Credential',
  'sendOwnerOnboarding',
  'finalizeHostelActivation',
  'expiryDate',
  'Pro Plan',
  'Base Plan',
  'Enterprise Plan',
  'resolveOwnerDocuments',
  'DocumentPreviewCard',
  'getTodayTasks'
];

const results = searchFiles(baseDir, patterns);
console.log(`Found ${results.length} occurrences:`);
results.forEach(r => {
  const rel = path.relative(baseDir, r.file);
  console.log(`${rel}:${r.lineNum} [${r.pattern}] ${r.line.substring(0, 100)}`);
});
