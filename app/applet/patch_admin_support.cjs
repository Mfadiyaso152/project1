const fs = require("fs");

// 1. AccountView.tsx: Hide Tech Support for admin
let acc = fs.readFileSync("components/AccountView.tsx", "utf-8");
const targetTech = `      {/* Tech Support */}
      <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
        <h3 className={\`font-black text-lg flex items-center gap-2 \${textPrimary}\`}>
          <Headphones size={18} className="text-teal-500" />
          الدعم الفني
        </h3>
        <p className={\`text-sm \${textSecondary}\`}>تواصل مع الإدارة مباشرة عبر واتساب للحصول على المساعدة الفورية.</p>
        <a 
          href="https://wa.me/966536894854?text=مرحباً،%20أحتاج%20مساعدة%20في%20منصة%20وثيق" 
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg text-sm"
        >
          <Headphones size={16} />
          تواصل مع الدعم الفني
        </a>
      </div>`;

const wrappedTech = `      {currentUser.role !== 'admin' && (
      <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
        <h3 className={\`font-black text-lg flex items-center gap-2 \${textPrimary}\`}>
          <Headphones size={18} className="text-teal-500" />
          الدعم الفني
        </h3>
        <p className={\`text-sm \${textSecondary}\`}>تواصل مع الإدارة مباشرة عبر واتساب للحصول على المساعدة الفورية.</p>
        <a 
          href="https://wa.me/966536894854?text=مرحباً،%20أحتاج%20مساعدة%20في%20منصة%20وثيق" 
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg text-sm"
        >
          <Headphones size={16} />
          تواصل مع الدعم الفني
        </a>
      </div>
      )}`;

if (acc.includes("الدعم الفني")) {
  acc = acc.replace(targetTech, wrappedTech);
  fs.writeFileSync("components/AccountView.tsx", acc);
  console.log("AccountView updated.");
} else {
  console.log("targetTech not found in AccountView.");
}

// 2. AdminViews.tsx: Remove subscription status badge from AdminUsersView
let admin = fs.readFileSync("components/AdminViews.tsx", "utf-8");
const idxUser = admin.indexOf("AdminUsersView");
if (idxUser !== -1) {
  const spanStart = admin.indexOf("<span className={`px-3 py-1 rounded-full text-xs font-bold border", idxUser);
  if (spanStart !== -1) {
    const spanEnd = admin.indexOf("</span>", spanStart) + 7;
    admin = admin.substring(0, spanStart) + admin.substring(spanEnd);
    fs.writeFileSync("components/AdminViews.tsx", admin);
    console.log("AdminViews subscription badge removed successfully.");
  } else {
    console.log("Subscription badge span not found in AdminUsersView.");
  }
} else {
  console.log("AdminUsersView not found.");
}
