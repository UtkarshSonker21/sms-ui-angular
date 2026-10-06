const fs = require('fs');
let html = fs.readFileSync('D:/BackendCodersWork/SMS/SmsAngular/sms-ui/src/app/features/university/university-student-detail/university-student-detail.html', 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, match => match.replace(/[^\n]/g, ''));
const lines = html.split('\n');

let openDivs = 0;
let openSections = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let dO = (line.match(/<\s*div(?=\s|>)/ig) || []).length;
    let dC = (line.match(/<\s*\/\s*div\s*>/ig) || []).length;
    let sO = (line.match(/<\s*section(?=\s|>)/ig) || []).length;
    let sC = (line.match(/<\s*\/\s*section\s*>/ig) || []).length;
    
    openDivs += dO - dC;
    openSections += sO - sC;
    
    if (i >= 795 && i <= 905) {
        if (dO > 0 || dC > 0 || sO > 0 || sC > 0) {
            console.log('Line ' + (i+1) + ': ' + line.trim() + ' | Divs: ' + openDivs + ' | Sections: ' + openSections);
        }
    }
}
