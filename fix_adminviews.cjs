const fs = require('fs');
let code = fs.readFileSync('components/AdminViews.tsx', 'utf-8');

// 1. imports
code = code.replace(
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers } from '../authService';",
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers, deleteUnusedCodes, confirmRequestAndAddRevenue } from '../authService';"
);

// 2. Add handleConfirm to AdminRequestsView
code = code.replace(
  "const [requests, setRequests] = useState<SubscriptionRequest[]>([]);\n  const isLight = currentUser.theme !== 'space-dark';",
  "const [requests, setRequests] = useState<SubscriptionRequest[]>([]);\n  const isLight = currentUser.theme !== 'space-dark';\n\n  const handleConfirm = (id: string) => {\n    confirmRequestAndAddRevenue(id);\n    setRequests(getStoredRequests());\n  };"
);

// 3. Update the mapping in AdminRequestsView to include the WhatsApp button and Confirm button
const originalMap = `{requests.map(req => (
            <div key={req.id} className={\`p-5 rounded-3xl border shadow-sm \${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}\`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={\`font-bold \${isLight ? 'text-slate-900' : 'text-white'}\`}>{req.userEmail}</h4>
                  <p className={\`text-xs \${isLight ? 'text-slate-500' : 'text-slate-400'}\`}>{new Date(req.createdAt).toLocaleString('ar-SA')}</p>
                </div>
                <span className={\`px-3 py-1 rounded-full text-xs font-bold border \${
                  req.status === 'completed' 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                    : (isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-500/20 text-teal-400 border-teal-500/30')
                }\`}>
                  {req.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                </span>
              </div>
              <div className={\`p-3 rounded-xl text-sm font-mono \${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}\`}>
                المبلغ المحول: {req.amountTransferred} ريال
              </div>
            </div>
          ))}`;

const updatedMap = `{requests.map(req => (
            <div key={req.id} className={\`p-5 rounded-3xl border shadow-sm \${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}\`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={\`font-bold \${isLight ? 'text-slate-900' : 'text-white'}\`}>{req.userName || req.userEmail}</h4>
                  <p className={\`text-xs \${isLight ? 'text-slate-500' : 'text-slate-400'}\`}>{req.userPhone}</p>
                </div>
                <span className={\`px-3 py-1 rounded-full text-xs font-bold border \${
                  req.status === 'completed' 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                    : (isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-500/20 text-teal-400 border-teal-500/30')
                }\`}>
                  {req.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                </span>
              </div>
              <div className={\`p-3 rounded-xl text-sm font-mono flex flex-col gap-2 \${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}\`}>
                <span>الباقة المطلوبة: {(req.plan || 'basic').toUpperCase()}</span>
                {req.amountTransferred && <span>المبلغ المحول: {req.amountTransferred} ريال</span>}
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
                    واتس اب
                  </a>
                </div>
              )}
            </div>
          ))}`;

code = code.replace(originalMap, updatedMap);

// 4. Update AdminCodesView logic
code = code.replace(
  "generateCode(plan, duration);\n    setCodes(getStoredCodes());",
  "const finalPlan = duration === 7 ? 'basic' : plan;\n    generateCode(finalPlan, duration);\n    setCodes(getStoredCodes());"
);

code = code.replace(
  "const handleCopy = (code: string) => {",
  "const handleDeleteUnused = () => {\n    deleteUnusedCodes();\n    setCodes(getStoredCodes());\n    alert('تم حذف جميع الأكواد غير المستخدمة');\n  };\n\n  const handleCopy = (code: string) => {"
);

code = code.replace(
  "توليد رموز الاشتراك\n      </h2>",
  "توليد رموز الاشتراك\n      </h2>\n      <button onClick={handleDeleteUnused} className=\"bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 px-4 rounded-xl text-sm font-bold transition-colors self-start\">\n        حذف الأكواد غير المستخدمة\n      </button>"
);

code = code.replace(
  "onClick={() => setDuration(days)}",
  "onClick={() => { setDuration(days); if (days === 7) setPlan('basic'); }}"
);

code = code.replace(
  "onClick={() => setPlan('pro')}",
  "onClick={() => { if (duration !== 7) setPlan('pro'); }}"
);

code = code.replace(
  `className={\`flex-1 py-3 rounded-xl font-bold border transition-colors \${plan === 'pro'`,
  `className={\`flex-1 py-3 rounded-xl font-bold border transition-colors \${duration === 7 ? 'opacity-50 cursor-not-allowed ' : ''}\${plan === 'pro'`
);

fs.writeFileSync('components/AdminViews.tsx', code);
