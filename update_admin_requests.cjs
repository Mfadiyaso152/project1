const fs = require('fs');
let code = fs.readFileSync('components/AdminViews.tsx', 'utf-8');

// Add cancelRequest import
code = code.replace(
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers, deleteUnusedCodes, confirmRequestAndAddRevenue } from '../authService';",
  "import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers, deleteUnusedCodes, confirmRequestAndAddRevenue, cancelRequest } from '../authService';"
);

// Add handleCancel function and update the request card UI to have both "تأكيد الطلب" and "إلغاء الطلب"
const oldRequestsViewCode = `  const handleConfirm = (id: string) => {
    confirmRequestAndAddRevenue(id);
    setRequests(getStoredRequests());
  };`;

const newRequestsViewCode = `  const handleConfirm = (id: string) => {
    confirmRequestAndAddRevenue(id);
    setRequests(getStoredRequests());
  };

  const handleCancel = (id: string) => {
    cancelRequest(id);
    setRequests(getStoredRequests());
  };`;

code = code.replace(oldRequestsViewCode, newRequestsViewCode);

// Update request buttons in map
const oldButtons = `{req.status === 'pending' && (
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
              )}`;

const newButtons = `{req.status === 'pending' && (
                <div className="flex flex-col gap-2 border-t pt-3 mt-3 border-slate-100">
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirm(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                      تأكيد الطلب
                    </button>
                    <button onClick={() => handleCancel(req.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                      إلغاء الطلب
                    </button>
                  </div>
                  <a 
                    href={\`https://wa.me/\${req.userPhone?.replace(/\\+/g, '').replace(/^0/, '966')}?text=مرحباً%20عزيزي%20\${req.userName}،%20بخصوص%20طلب%20تفعيل%20اشتراكك%20في%20منصة%20وثيق\`} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-sm font-bold text-center transition-colors"
                  >
                    تواصل واتساب
                  </a>
                </div>
              )}`;

code = code.replace(oldButtons, newButtons);
fs.writeFileSync('components/AdminViews.tsx', code);
console.log("Admin requests view updated.");
