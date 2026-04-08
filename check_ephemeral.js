const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.js')) results.push(file);
    });
    return results;
}

const files = walk(path.join(__dirname, 'commands'));
let issues = 0;

files.forEach(file => {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes('ephemeral:') && lines[i-1].includes('ephemeral:')) {
            console.log(`DUPLICATE in ${file} at line ${i+1}:`);
            console.log(`  ${i}: ${lines[i-1].trim()}`);
            console.log(`  ${i+1}: ${lines[i].trim()}`);
            issues++;
        }
    }
});

console.log(`\nTotal duplicate ephemeral issues: ${issues}`);
