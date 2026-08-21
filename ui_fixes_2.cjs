const fs = require('fs');

let cssPath = 'style.css';
if (!fs.existsSync(cssPath)) {
  const files = fs.readdirSync('.');
  const cssFile = files.find(f => f.endsWith('.css'));
  if (cssFile) cssPath = cssFile;
}

if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf-8');
  if (!css.includes('* { transition:')) {
    css += `\n\n@layer base {\n  html {\n    scroll-behavior: smooth;\n  }\n  button, input, a, div {\n    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n    transition-duration: 250ms;\n  }\n}\n`;
    fs.writeFileSync(cssPath, css);
  }
}

