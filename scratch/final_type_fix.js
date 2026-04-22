const fs = require('fs');
const path = 'c:/Users/vbxn6/.gemini/antigravity/scratch/admitflow-ai/src/app/dashboard/students/[id]/page.tsx';

try {
    let c = fs.readFileSync(path, 'utf8');
    c = c.replace(/'memo' \| 'file' \| 'grade'/g, "'memo' | 'file' | 'grade' | 'resource'");
    fs.writeFileSync(path, c, 'utf8');
    console.log('Final type union fixed successfully.');
} catch (err) {
    console.error('Final fix failed:', err);
    process.exit(1);
}
