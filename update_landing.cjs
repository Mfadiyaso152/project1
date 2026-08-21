const fs = require('fs');
let code = fs.readFileSync('components/LandingView.tsx', 'utf-8');

code = code.replace(
  `<span className="font-black text-2xl text-slate-800 tracking-tight">وثيق للتوثيق الالكتروني</span>`,
  `<span className="font-black text-xl text-slate-800 tracking-tight">وثيق للتوثيق الالكتروني</span>\n            <span className="text-xs font-medium text-slate-500 mt-1">جميع الحقوق محفوظة</span>`
);

fs.writeFileSync('components/LandingView.tsx', code);
