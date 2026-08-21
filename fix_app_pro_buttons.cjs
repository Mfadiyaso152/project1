const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(
  "if (currentUser?.plan !== 'pro' && currentUser?.role !== 'admin') {\n      alert('هذه الميزة متاحة فقط في الباقة الاحترافية Pro');",
  "if (currentUser?.plan !== 'pro' && currentUser?.role !== 'admin') {\n      alert('ميزة السحابة متاحة فقط في باقة Pro. رقي باقتك بـ 10 ريال فقط!');"
);

// Show buttons for everyone, but if not pro, they trigger loadSavedAsset which will alert.
code = code.replace(
  "{(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (\n                      <button onClick={() => loadSavedAsset('template')} className=\"mt-2 text-xs text-teal-500 font-bold hover:underline\">استخدام الترويسة المحفوظة في حسابي</button>\n                    )}",
  "<button onClick={() => loadSavedAsset('template')} className=\"mt-2 text-xs text-teal-500 font-bold hover:underline\">\n                      {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام الترويسة المحفوظة في حسابي' : 'استخدم الترويسة من السحابة 👑'}\n                    </button>"
);

code = code.replace(
  "{(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (\n                      <button onClick={() => loadSavedAsset('stamp')} className=\"mt-2 text-xs text-teal-500 font-bold hover:underline\">استخدام الختم المحفوظ في حسابي</button>\n                    )}",
  "<button onClick={() => loadSavedAsset('stamp')} className=\"mt-2 text-xs text-teal-500 font-bold hover:underline\">\n                      {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام الختم المحفوظ في حسابي' : 'استخدم الختم من السحابة 👑'}\n                    </button>"
);

code = code.replace(
  "{(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (\n                        <button onClick={() => loadSavedAsset('signature')} className=\"text-xs text-teal-500 font-bold hover:underline\">استخدام التوقيع المحفوظ</button>\n                      )}",
  "<button onClick={() => loadSavedAsset('signature')} className=\"text-xs text-teal-500 font-bold hover:underline\">\n                        {currentUser?.plan === 'pro' || currentUser?.role === 'admin' ? 'استخدام التوقيع المحفوظ' : 'التوقيع من السحابة 👑'}\n                      </button>"
);

fs.writeFileSync('App.tsx', code);
