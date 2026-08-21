const fs = require('fs');
let code = fs.readFileSync('components/AccountView.tsx', 'utf-8');

code = code.replace(
  "أصولي السحابية (تخزين الختم والتوقيع)",
  "أصولي السحابية"
);

fs.writeFileSync('components/AccountView.tsx', code);
