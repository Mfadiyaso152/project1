const fs = require('fs');

// 1. BottomNav transparency
let bottomNav = fs.readFileSync('components/BottomNav.tsx', 'utf-8');
bottomNav = bottomNav.replace(
  "const bgClass = isLight ? 'bg-white border-t border-slate-200' : 'bg-slate-900 border-t border-slate-800';",
  "const bgClass = 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-800/30 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]';"
);
bottomNav = bottomNav.replace(
  "textClass: string }) => (\n  <button\n    type=\"button\"\n    onClick={onClick}\n    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${",
  "textClass: string }) => (\n  <button\n    type=\"button\"\n    onClick={onClick}\n    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 cursor-pointer ${"
);
fs.writeFileSync('components/BottomNav.tsx', bottomNav);

// 2. Landing page bottom spacing and text
let landing = fs.readFileSync('components/LandingView.tsx', 'utf-8');
landing = landing.replace(
  "          </div>\n        </main>\n      </div>\n    </div>",
  "          </div>\n          \n          <div className=\"mt-16 mb-24 flex flex-col items-center justify-center opacity-50\">\n            <span className=\"font-black text-2xl text-slate-800 tracking-tight\">وثيق للتوثيق الالكتروني</span>\n          </div>\n        </main>\n      </div>\n    </div>"
);
fs.writeFileSync('components/LandingView.tsx', landing);

// 3. AuthFlow back button
let authFlow = fs.readFileSync('components/AuthFlow.tsx', 'utf-8');
authFlow = authFlow.replace(
  "export const AuthFlow: React.FC<AuthFlowProps> = ({ onSuccess }) => {",
  "export const AuthFlow: React.FC<AuthFlowProps & { onCancel?: () => void }> = ({ onSuccess, onCancel }) => {"
);
authFlow = authFlow.replace(
  "<div className=\"w-full max-w-md\">",
  "<div className=\"w-full max-w-md\">\n        {onCancel && (\n          <button \n            onClick={onCancel}\n            className=\"mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm\"\n          >\n            <span>→</span> رجوع\n          </button>\n        )}"
);
fs.writeFileSync('components/AuthFlow.tsx', authFlow);

// 4. Smooth transitions in global CSS
let css = fs.readFileSync('index.css', 'utf-8');
if (!css.includes('* { transition:')) {
  css += `\n\n@layer base {\n  html {\n    scroll-behavior: smooth;\n  }\n  button, input, a, div {\n    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n    transition-duration: 200ms;\n  }\n}\n`;
  fs.writeFileSync('index.css', css);
}

