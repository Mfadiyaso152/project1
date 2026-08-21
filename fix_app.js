const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix 1: The broken p tag and missing closing tag
code = code.replace(/<p className=\{isLight \?             <div className="grid/g, `<p className={isLight ? 'text-slate-500' : 'text-slate-400'}>\n                قم برفع المستندات المطلوبة للبدء في الدمج والتوثيق\n              </p>\n            </div>\n\n            <div className="grid`);

// Fix 2: The duplicate button at the end of the upload section
const buttonRegex = /<\/button>\n            <\/div> font-black text-lg transition-all shadow-xl \$\{\n                  canProceed \? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:scale-\[1.02\] cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'\n                \}`\}>\n                المتابعة للدمج\n                <ArrowLeft size=\{20\} \/>\n              <\/button>\n            <\/div>/g;
code = code.replace(buttonRegex, '</button>\n            </div>');

fs.writeFileSync('App.tsx', code);
