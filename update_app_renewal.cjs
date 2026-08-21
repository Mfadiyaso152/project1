const fs = require('fs');

// 1. Update App.tsx
let appCode = fs.readFileSync('App.tsx', 'utf-8');

appCode = appCode.replace(
  "import { getCurrentUser, setCurrentUser, canUserProcessFile, updateUserInDb } from './authService';",
  "import { getCurrentUser, setCurrentUser, canUserProcessFile, updateUserInDb, createSubscriptionRequest } from './authService';"
);

const oldPending = `{isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-white/30 dark:bg-slate-950/30 rounded-3xl"> 
                   <div className="bg-white dark:bg-slate-800 shadow-2xl px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 animate-scale-in">
                     <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                     <span className="font-bold text-slate-800 dark:text-slate-200">بانتظار كود التفعيل</span>
                   </div>
                </div>
              )}`;

const newPending = `{isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[3px] bg-white/40 dark:bg-slate-950/40 rounded-3xl p-4"> 
                   <div className="bg-white dark:bg-slate-800 shadow-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4 max-w-md w-full animate-scale-in text-center">
                     <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center text-teal-600">
                       <Clock size={24} />
                     </div>
                     <div>
                       <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">انتهى أو لم يتم تفعيل اشتراكك</h3>
                       <p className="text-xs text-slate-500">اختر الباقة للتجديد وإرسال طلب التفعيل الفوري للإدارة:</p>
                     </div>
                     <div className="flex gap-2 w-full">
                       <button 
                         onClick={() => {
                           if (currentUser) {
                             createSubscriptionRequest(currentUser, 'basic');
                             window.location.reload();
                           }
                         }}
                         className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
                       >
                         باقة Basic (25 ر.س)
                       </button>
                       <button 
                         onClick={() => {
                           if (currentUser) {
                             createSubscriptionRequest(currentUser, 'pro');
                             window.location.reload();
                           }
                         }}
                         className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
                       >
                         باقة Pro (35 ر.س)
                       </button>
                     </div>
                     <span className="text-[11px] text-slate-400">سيتم مراجعة طلبك وتفعيله من قبل الإدارة فوراً</span>
                   </div>
                </div>
              )}`;

appCode = appCode.replace(oldPending, newPending);
fs.writeFileSync('App.tsx', appCode);

// 2. Update AdminUsersView in components/AdminViews.tsx
let adminCode = fs.readFileSync('components/AdminViews.tsx', 'utf-8');
const oldUserCard = `            <div className={\`p-3 rounded-xl text-sm \${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}\`}>
              الباقة: <span className="font-bold">{(user.plan || 'بدون').toUpperCase()}</span>
              {user.subscriptionExpiresAt && \` | ينتهي في: \${new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-SA')}\`}
            </div>`;

const newUserCard = `            <div className={\`p-3 rounded-xl text-sm flex flex-col gap-1 \${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}\`}>
              <div>الباقة: <span className="font-bold">{(user.plan || 'بدون').toUpperCase()}</span></div>
              <div className="text-xs opacity-80">
                تاريخ انتهاء الاشتراك: <span className="font-mono font-bold">{user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-SA') : 'غير متوفر'}</span>
              </div>
            </div>`;

adminCode = adminCode.replace(oldUserCard, newUserCard);
fs.writeFileSync('components/AdminViews.tsx', adminCode);

