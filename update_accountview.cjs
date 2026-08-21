const fs = require('fs');
let code = fs.readFileSync('components/AccountView.tsx', 'utf-8');

// Imports
code = code.replace(
  "import { User as UserIcon, Mail, Phone, Crown, LogOut, CheckCircle2, AlertCircle, Clock, Settings, Key, Zap } from 'lucide-react';",
  "import { User as UserIcon, Mail, Phone, Crown, LogOut, CheckCircle2, AlertCircle, Clock, Settings, Key, Zap, Headphones, Image as ImageIcon, FileText, Stamp, PenTool } from 'lucide-react';\nimport { FileUpload } from './FileUpload';"
);

// State for assets
code = code.replace(
  "const [redeemMessage, setRedeemMessage] = useState<{text: string, isError: boolean} | null>(null);",
  "const [redeemMessage, setRedeemMessage] = useState<{text: string, isError: boolean} | null>(null);\n  const [saveMessage, setSaveMessage] = useState('');"
);

// File handler function
const handleSaveAsset = `
  const handleSaveAsset = (type: 'template' | 'stamp' | 'signature', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!currentUser.savedAssets) currentUser.savedAssets = { template: null, stamp: null, signature: null };
      currentUser.savedAssets[type] = dataUrl;
      updateUserInDb(currentUser);
      setCurrentUser(currentUser);
      setSaveMessage('تم الحفظ في السحابة بنجاح!');
      setTimeout(() => setSaveMessage(''), 3000);
      onUpdate();
    };
    reader.readAsDataURL(file);
  };
`;
code = code.replace(
  "const handleThemeChange",
  handleSaveAsset + "\n  const handleThemeChange"
);

// Change button text to icon
code = code.replace(
  `            <button 
              onClick={handleRedeem}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 rounded-xl transition-colors"
            >
              تفعيل
            </button>`,
  `            <button 
              onClick={handleRedeem}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 rounded-xl transition-colors flex items-center justify-center"
              title="تأكيد"
            >
              <CheckCircle2 size={20} />
            </button>`
);

// Tech Support section & Pro Assets Upload section
const techSupportHTML = `
      {/* Tech Support */}
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
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center transition-colors shadow-lg"
        >
          تواصل مع الدعم الفني
        </a>
      </div>
`;

const proAssetsHTML = `
      {/* Cloud Assets (Pro & Admin) */}
      {(currentUser.plan === 'pro' || isAdmin) && (
        <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
          <h3 className={\`font-black text-lg flex items-center gap-2 \${textPrimary}\`}>
            <Crown size={18} className="text-teal-500" />
            أصولي السحابية (جاهزة للدمج)
          </h3>
          <p className={\`text-sm \${textSecondary}\`}>ارفع أختامك وتوقيعك وترويستك لتكون محفوظة في حسابك وجاهزة للاستخدام في أي وقت.</p>
          
          <div className="flex flex-col gap-4">
            <FileUpload
              label="الترويسة المحفوظة"
              subLabel="ورقة المؤسسة الرسمية"
              accept="image/*,application/pdf"
              value={currentUser.savedAssets?.template}
              onChange={(f) => handleSaveAsset('template', f as File)}
              onClear={() => {
                if (currentUser.savedAssets) currentUser.savedAssets.template = null;
                updateUserInDb(currentUser);
                setCurrentUser(currentUser);
                onUpdate();
              }}
              icon={<FileText size={24} className="text-teal-500" />}
            />
            <FileUpload
              label="الختم المحفوظ"
              subLabel="صورة شفافة PNG"
              accept="image/png, image/jpeg, application/pdf"
              value={currentUser.savedAssets?.stamp}
              onChange={(f) => handleSaveAsset('stamp', f as File)}
              onClear={() => {
                if (currentUser.savedAssets) currentUser.savedAssets.stamp = null;
                updateUserInDb(currentUser);
                setCurrentUser(currentUser);
                onUpdate();
              }}
              icon={<Stamp size={24} className="text-teal-500" />}
            />
            <FileUpload
              label="التوقيع المحفوظ"
              subLabel="صورة شفافة PNG"
              accept="image/png, image/jpeg, application/pdf"
              value={currentUser.savedAssets?.signature}
              onChange={(f) => handleSaveAsset('signature', f as File)}
              onClear={() => {
                if (currentUser.savedAssets) currentUser.savedAssets.signature = null;
                updateUserInDb(currentUser);
                setCurrentUser(currentUser);
                onUpdate();
              }}
              icon={<PenTool size={24} className="text-teal-500" />}
            />
          </div>
          {saveMessage && (
            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2 text-center">
              {saveMessage}
            </div>
          )}
        </div>
      )}
`;

code = code.replace(
  `{/* Settings (Themes) */}`,
  techSupportHTML + "\n" + proAssetsHTML + "\n      {/* Settings (Themes) */}"
);

fs.writeFileSync('components/AccountView.tsx', code);
