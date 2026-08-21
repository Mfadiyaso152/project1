const fs = require('fs');
let code = fs.readFileSync('components/BottomNav.tsx', 'utf-8');

code = code.replace(
  "const bgClass = 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-800/30 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]';",
  "const bgClass = 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-3xl border-t border-white/20 dark:border-slate-800/20 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]';"
);

fs.writeFileSync('components/BottomNav.tsx', code);
