const fs = require('fs');
let code = fs.readFileSync('components/AccountView.tsx', 'utf-8');

// Add states
code = code.replace(
  "const [saveMessage, setSaveMessage] = useState('');",
  "const [saveMessage, setSaveMessage] = useState('');\n  const [showCloudAssets, setShowCloudAssets] = useState(false);\n  const [isDrawingCloudSignature, setIsDrawingCloudSignature] = useState(false);"
);

// Add SignaturePad import
code = code.replace(
  "import { FileUpload } from './FileUpload';",
  "import FileUpload from './FileUpload';\nimport SignaturePad from './SignaturePad';"
);

// Add dataUrl handler
const dataUrlHandler = `
  const handleSaveDataUrlAsset = (type: 'template' | 'stamp' | 'signature', dataUrl: string) => {
    if (!currentUser.savedAssets) currentUser.savedAssets = { template: null, stamp: null, signature: null };
    currentUser.savedAssets[type] = dataUrl;
    updateUserInDb(currentUser);
    setCurrentUser(currentUser);
    setSaveMessage('تم الحفظ في السحابة بنجاح!');
    setTimeout(() => setSaveMessage(''), 3000);
    onUpdate();
  };
`;
code = code.replace(
  "const handleSaveAsset = (type: 'template' | 'stamp' | 'signature', file: File) => {",
  dataUrlHandler + "\n  const handleSaveAsset = (type: 'template' | 'stamp' | 'signature', file: File) => {"
);
code = code.replace(
  "if (!currentUser.savedAssets) currentUser.savedAssets = { template: null, stamp: null, signature: null };\n      currentUser.savedAssets[type] = dataUrl;\n      updateUserInDb(currentUser);\n      setCurrentUser(currentUser);\n      setSaveMessage('تم الحفظ في السحابة بنجاح!');\n      setTimeout(() => setSaveMessage(''), 3000);\n      onUpdate();",
  "handleSaveDataUrlAsset(type, dataUrl);"
);

// Update Cloud Assets view
const cloudAssetsRegex = /\{\/\* Cloud Assets \(Pro & Admin\) \*\/\}.*?\{\/\* Settings \(Themes\) \*\/\}/s;
const cloudAssetsReplacement = `{/* Cloud Assets (Pro & Admin) */}
      {(currentUser.plan === 'pro' || isAdmin) && (
        <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
          <button 
            onClick={() => setShowCloudAssets(!showCloudAssets)}
            className={\`flex items-center justify-between w-full font-black text-lg \${textPrimary}\`}
          >
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-teal-500" />
              أصولي السحابية (تخزين الختم والتوقيع)
            </div>
            <div className={\`transform transition-transform \${showCloudAssets ? 'rotate-180' : ''}\`}>▼</div>
          </button>
          
          {showCloudAssets && (
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
              <p className={\`text-sm \${textSecondary}\`}>ارفع أختامك وتوقيعك وترويستك لتكون محفوظة في حسابك وجاهزة للاستخدام في أي وقت.</p>
              
              <FileUpload
                label="الترويسة المحفوظة"
                subLabel="ورقة المؤسسة الرسمية"
                accept="image/*,application/pdf"
                value={currentUser.savedAssets?.template}
                onChange={(f) => handleSaveAsset('template', f as File)}
                onClear={() => handleSaveDataUrlAsset('template', null as any)}
                icon={<FileText size={24} className="text-teal-500" />}
              />
              <FileUpload
                label="الختم المحفوظ"
                subLabel="صورة شفافة PNG"
                accept="image/png, image/jpeg, application/pdf"
                value={currentUser.savedAssets?.stamp}
                onChange={(f) => handleSaveAsset('stamp', f as File)}
                onClear={() => handleSaveDataUrlAsset('stamp', null as any)}
                icon={<Stamp size={24} className="text-teal-500" />}
              />
              <div>
                <FileUpload
                  label="التوقيع المحفوظ"
                  subLabel="صورة شفافة PNG"
                  accept="image/png, image/jpeg, application/pdf"
                  value={currentUser.savedAssets?.signature}
                  onChange={(f) => handleSaveAsset('signature', f as File)}
                  onClear={() => handleSaveDataUrlAsset('signature', null as any)}
                  icon={<PenTool size={24} className="text-teal-500" />}
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => setIsDrawingCloudSignature(true)}
                    className="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    توقيع إلكتروني وحفظ ✍️
                  </button>
                </div>
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2 text-center">
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {isDrawingCloudSignature && (
        <SignaturePad
          onSave={(dataUrl) => {
            handleSaveDataUrlAsset('signature', dataUrl);
            setIsDrawingCloudSignature(false);
          }}
          onClose={() => setIsDrawingCloudSignature(false)}
        />
      )}

      {/* Settings (Themes) */}`;

code = code.replace(cloudAssetsRegex, cloudAssetsReplacement);

// Remove Settings (Themes) completely
const settingsRegex = /\{\/\* Settings \(Themes\) \*\/\}.*?\{\/\* Logout Action \*\/\}/s;
const settingsReplacement = `{/* Logout Action */}`;
code = code.replace(settingsRegex, settingsReplacement);

fs.writeFileSync('components/AccountView.tsx', code);
