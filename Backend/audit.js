const fs = require('fs');
const path = require('path');

const BACKEND_DIR = __dirname;
let issues = [];
let authMiddlewareUsages = [];

function checkExactCaseExists(targetPath) {
    try {
        const dir = path.dirname(targetPath);
        const base = path.basename(targetPath);
        if (!fs.existsSync(dir)) return false;
        const files = fs.readdirSync(dir);
        return files.includes(base);
    } catch (e) {
        return false;
    }
}

function walkSync(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (file !== 'node_modules') {
                walkSync(filepath, callback);
            }
        } else if (file.endsWith('.js')) {
            callback(filepath);
        }
    }
}

walkSync(BACKEND_DIR, (filepath) => {
    if (filepath === __filename) return;
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Check authMiddleware usage
    if (content.includes('authMiddleware')) {
        authMiddlewareUsages.push(filepath.replace(BACKEND_DIR, ''));
    }

    // Check requires
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
        const reqPath = match[1];
        if (reqPath.startsWith('.')) {
            // Local file
            let resolved = path.resolve(path.dirname(filepath), reqPath);
            let exists = false;
            let actualPath = resolved;
            
            if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
                 exists = checkExactCaseExists(resolved);
            } else if (fs.existsSync(resolved + '.js')) {
                 exists = checkExactCaseExists(resolved + '.js');
                 actualPath = resolved + '.js';
            } else if (fs.existsSync(resolved + '/index.js')) {
                 exists = checkExactCaseExists(resolved + '/index.js');
                 actualPath = resolved + '/index.js';
            }
            
            if (!exists) {
                issues.push(`File: ${filepath.replace(BACKEND_DIR, '')}\n  Requires: ${reqPath}\n  Resolved (not found/case issue): ${actualPath}`);
            }
        }
    }
});

console.log("=== authMiddleware Usages ===");
console.log(authMiddlewareUsages.join('\n'));
console.log("\n=== Require Issues ===");
console.log(issues.join('\n\n'));
