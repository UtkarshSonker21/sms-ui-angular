const fs = require('fs');
let html = fs.readFileSync('D:/BackendCodersWork/SMS/SmsAngular/sms-ui/src/app/features/university/university-student-detail/university-student-detail.html', 'utf8');

// Strip comments
html = html.replace(/<!--[\s\S]*?-->/g, '');

let divOpen = 0;
let sectionOpen = 0;

const divOpenRe = /<\s*div[^>]*>/g;
const divCloseRe = /<\s*\/\s*div\s*>/g;
const sectionOpenRe = /<\s*section[^>]*>/g;
const sectionCloseRe = /<\s*\/\s*section\s*>/g;

const divOpens = (html.match(divOpenRe) || []).length;
const divCloses = (html.match(divCloseRe) || []).length;
const sectionOpens = (html.match(sectionOpenRe) || []).length;
const sectionCloses = (html.match(sectionCloseRe) || []).length;

console.log('Div Opens:', divOpens);
console.log('Div Closes:', divCloses);
console.log('Section Opens:', sectionOpens);
console.log('Section Closes:', sectionCloses);
console.log('Diff Div:', divOpens - divCloses);
console.log('Diff Section:', sectionOpens - sectionCloses);
