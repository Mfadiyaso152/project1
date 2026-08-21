const fs = require('fs');
let code = fs.readFileSync('components/AccountView.tsx', 'utf-8');

const historyBlock = `

          {currentUser.redeemedCodesHistory && currentUser.redeemedCodesHistory.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-bold">سجل الأكواد المفعلة</span>
              <div className="flex flex-col gap-2">
                {currentUser.redeemedCodesHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-teal-500">{item.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 font-bold">{item.plan.toUpperCase()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>من: {new Date(item.startDate).toLocaleDateString('en-GB')}</span>
                      <span>إلى: {new Date(item.expiryDate).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
`;

if (code.includes('subscriptionStatus') && !code.includes('redeemedCodesHistory')) {
  // Insert before the closing div of subscription card
  code = code.replace(
    '          <div className="flex flex-col gap-2">\n            <span className="text-xs text-slate-400 font-bold">الحالة</span>',
    historyBlock + '\n          <div className="flex flex-col gap-2">\n            <span className="text-xs text-slate-400 font-bold">الحالة</span>'
  );
  fs.writeFileSync('components/AccountView.tsx', code);
  console.log("AccountView updated successfully.");
}
