const fs = require('fs');
let code = fs.readFileSync('components/AdminViews.tsx', 'utf-8');

// Import the new functions
code = code.replace(
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers } from '../authService';",
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers, deleteUnusedCodes, confirmRequestAndAddRevenue } from '../authService';"
);

// AdminRequestsView changes
const reqViewRegex = /export const AdminRequestsView = \(\{ currentUser \}: \{ currentUser: User \}\) => \{[\s\S]*?\};\n\/\/ --- Revenue View ---/;
let reqViewMatch = code.match(reqViewRegex)[0];
// Need to add confirm request logic
reqViewMatch = reqViewMatch.replace(
  "const [requests, setRequests] = useState<SubscriptionRequest[]>([]);\n  const isLight = currentUser.theme !== 'space-dark';",
  "const [requests, setRequests] = useState<SubscriptionRequest[]>([]);\n  const isLight = currentUser.theme !== 'space-dark';\n  \n  const handleConfirm = (id: string) => {\n    confirmRequestAndAddRevenue(id);\n    setRequests(getStoredRequests());\n  };"
);

reqViewMatch = reqViewMatch.replace(
  `              <div className="flex justify-between items-start mb-3">`,
  `              <div className="flex justify-between items-start mb-3">`
);

// Fix the request UI to show whatsapp and approve button
// Replace mapping content
reqViewMatch = reqViewMatch.replace(
  /\{requests\.map\(req => \([\s\S]*?\}\)/,
  `{requests.map(req => (
            <div key={req.id} className={\`p-5 rounded-3xl border shadow-sm \${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}\`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={\`font-bold \${isLight ? 'text-slate-900' : 'text-white'}\`}>{req.userName}</h4>
                  <p className={\`text-xs font-mono \${isLight ? 'text-slate-500' : 'text-slate-400'}\`}>{req.userPhone}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={\`px-3 py-1 rounded-full text-xs font-bold border \${
                    req.status === 'completed' 
                      ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                      : (isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-500/20 text-teal-400 border-teal-500/30')
                  }\`}>
                    {req.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                  </span>
                  
                </div>
              </div>
              <div className={\`p-3 rounded-xl text-sm font-mono flex items-center justify-between mb-3 \${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}\`}>
                <span>الباقة: {req.plan?.toUpperCase() || 'BASIC'}</span>
              </div>
              
              {req.status === 'pending' && (
                <div className="flex gap-2 border-t pt-3 mt-3 border-slate-100">
                  <button onClick={() => handleConfirm(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                    تأكيد الطلب
                  </button>
                  <a 
                    href={\`https://wa.me/\${req.userPhone?.replace(/\\+/g, '').replace(/^0/, '966')}?text=مرحباً%20عزيزي%20\${req.userName}،%20بخصوص%20طلب%20تفعيل%20اشتراكك%20في%20منصة%20وثيق\`} 
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-sm font-bold text-center transition-colors"
                  >
                    واتساب
                  </a>
                </div>
              )}
            </div>
          ))}`
);

code = code.replace(reqViewRegex, reqViewMatch);

// AdminCodesView logic
const codesViewRegex = /export const AdminCodesView = \(\{ currentUser \}: \{ currentUser: User \}\) => \{[\s\S]*?\};\n\/\/ --- Users View ---/;
let codesViewMatch = code.match(codesViewRegex)[0];

codesViewMatch = codesViewMatch.replace(
  "generateCode(plan, duration);\n    setCodes(getStoredCodes());",
  "// Force trial to basic\n    const finalPlan = duration === 7 ? 'basic' : plan;\n    generateCode(finalPlan, duration);\n    setCodes(getStoredCodes());"
);

codesViewMatch = codesViewMatch.replace(
  "const handleCopy = (code: string) => {",
  "const handleDeleteUnused = () => {\n    deleteUnusedCodes();\n    setCodes(getStoredCodes());\n    alert('تم حذف جميع الأكواد غير المستخدمة');\n  };\n\n  const handleCopy = (code: string) => {"
);

codesViewMatch = codesViewMatch.replace(
  "توليد رموز الاشتراك\n      </h2>",
  "توليد رموز الاشتراك\n      </h2>\n      \n      <button onClick={handleDeleteUnused} className=\"bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 px-4 rounded-xl text-sm font-bold transition-colors self-start\">\n        حذف الأكواد غير المستخدمة\n      </button>"
);

// Restrict 7 days button to 'basic' only if needed visually, but we already force it on generate.
// Actually, let's also disable the 'pro' button if duration is 7, or if duration is 7 auto switch plan.
codesViewMatch = codesViewMatch.replace(
  "onClick={() => setDuration(days)}",
  "onClick={() => { setDuration(days); if (days === 7) setPlan('basic'); }}"
);
codesViewMatch = codesViewMatch.replace(
  "onClick={() => setPlan('pro')}",
  "onClick={() => { if (duration !== 7) setPlan('pro'); }}"
);
codesViewMatch = codesViewMatch.replace(
  `Pro (احترافي)\n            </button>`,
  `Pro (احترافي)\n            </button>`
).replace(
  `className={\`flex-1 py-3 rounded-xl font-bold border transition-colors \${plan === 'pro'`,
  `className={\`flex-1 py-3 rounded-xl font-bold border transition-colors \${duration === 7 ? 'opacity-50 cursor-not-allowed ' : ''}\${plan === 'pro'`
);

code = code.replace(codesViewRegex, codesViewMatch);

fs.writeFileSync('components/AdminViews.tsx', code);
