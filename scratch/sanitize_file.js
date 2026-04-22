const fs = require('fs');
const path = 'c:/Users/vbxn6/.gemini/antigravity/scratch/admitflow-ai/src/app/dashboard/students/[id]/page.tsx';

try {
    const buffer = fs.readFileSync(path);
    console.log('File read successfully. Buffer length:', buffer.length);
    
    // Convert to string and back to clean up invalid UTF-8
    const content = buffer.toString('utf8');
    fs.writeFileSync(path, content, 'utf8');
    
    console.log('File sanitized and rewritten.');
} catch (err) {
    console.error('Error during sanitization:', err);
}
