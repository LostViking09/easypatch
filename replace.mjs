import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
        .replace(/text-\[10px\]/g, 'text-xxs')
        .replace(/text-\[9px\]/g, 'text-tiny')
        .replace(/text-\[7px\]/g, 'text-micro')
        .replace(/max-w-\[280px\]/g, 'max-w-[17.5rem]')
        .replace(/max-w-\[480px\]/g, 'max-w-[30rem]')
        .replace(/max-w-\[800px\]/g, 'max-w-[50rem]')
        .replace(/max-w-\[200px\]/g, 'max-w-[12.5rem]')
        .replace(/w-\[250px\]/g, 'w-[15.625rem]');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
