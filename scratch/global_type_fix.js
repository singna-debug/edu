const fs = require('fs');
const path = 'c:/Users/vbxn6/.gemini/antigravity/scratch/admitflow-ai/src/app/dashboard/students/[id]/page.tsx';

try {
    let c = fs.readFileSync(path, 'utf8');
    const unionType = "'memo' | 'file' | 'grade' | 'resource'";
    
    // Replace explicit string type with union type
    c = c.replace(/type\?:\s*string/g, `type?: ${unionType}`);
    
    // Also handle cases where the type might be defined differently but causing same error
    // For example line 1402: url?: string; type?: string; id?: string
    
    fs.writeFileSync(path, c, 'utf8');
    console.log('All sources type definitions updated to union type.');
} catch (err) {
    console.error('Global fix failed:', err);
    process.exit(1);
}
