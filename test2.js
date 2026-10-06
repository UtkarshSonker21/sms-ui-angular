const fs = require('fs');
let html = fs.readFileSync('D:/BackendCodersWork/SMS/SmsAngular/sms-ui/src/app/features/university/university-student-detail/university-student-detail.html', 'utf8');

// Strip comments but keep newlines so line numbers match (roughly)
html = html.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ''));

const lines = html.split('\n');
let depth = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all tags on this line
    const tagRegex = /<\s*(\/?)\s*(div|section)[^>]*>/ig;
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();
        
        if (isClosing) {
            depth--;
        } else {
            depth++;
        }
    }
    
    if (line.includes('class="form-section-title"')) {
        console.log('Line ' + (i+1) + ' Section Title: ' + line.trim() + ' | Depth: ' + depth);
    }
    if (line.includes('sticky-footer')) {
        console.log('Line ' + (i+1) + ' Footer | Depth: ' + depth);
    }
}
console.log('Final depth:', depth);
