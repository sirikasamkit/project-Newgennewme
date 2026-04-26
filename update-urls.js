const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'Frontend');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.html'));
const NEW_URL = "fetch('https://newgen-backend-pyw7.onrender.com/api/";

let updatedCount = 0;

files.forEach(f => {
    const p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes("fetch('/api/") || c.includes('fetch("/api/')) {
        // Replace all fetch('/api/ or fetch("/api/ with the new URL
        c = c.replace(/fetch\(\s*['"]\/api\//g, NEW_URL);
        fs.writeFileSync(p, c);
        console.log('Updated ' + f);
        updatedCount++;
    }
});

console.log(`Successfully updated URLs in ${updatedCount} files.`);
