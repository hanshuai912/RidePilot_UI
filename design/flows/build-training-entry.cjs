// Create a linked copy of T01 for the new course flow without changing T01 itself.
const fs=require('fs');
const path=require('path');
const source=path.join(__dirname,'../screens/T01-training.html');
const destination=path.join(__dirname,'training-flow-entry.html');
const html=fs.readFileSync(source,'utf8');
if(!html.includes('</body>'))throw new Error('T01 body closing tag missing');
fs.writeFileSync(destination,html.replace('</body>','  <script src="training-flow-entry.js"></script>\n</body>'));
console.log('Built linked training entry from preserved T01 design');
