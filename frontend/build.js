const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Create www directory if it doesn't exist
if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
}

// Function to copy a folder recursively
function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
    }
}

// Copy HTML files
const files = fs.readdirSync(srcDir);
for (const file of files) {
    if (file.endsWith('.html')) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
}

// Copy necessary folders
['css', 'js'].forEach(folder => {
    copyDir(path.join(srcDir, folder), path.join(destDir, folder));
});

console.log('Build completed: files copied to www/');
