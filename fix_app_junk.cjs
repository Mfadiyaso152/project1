const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const junkRegex = /<\/div> font-black text-lg transition-all shadow-xl \$\{\n                  canProceed \? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 hover:scale-\[1.02\] cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'\n                \}`\}>\n                المتابعة للدمج\n                <ArrowLeft size=\{20\} \/>\n              <\/button>\n            <\/div>/g;

code = code.replace(junkRegex, '</div>\n            </div>');

fs.writeFileSync('App.tsx', code);
