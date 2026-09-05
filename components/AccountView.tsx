import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  LogOut, 
  CheckCircle2, 
  Calendar, 
  Headphones, 
  FileText, 
  Stamp, 
  PenTool, 
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import FileUpload from './FileUpload';
import SignaturePad from './SignaturePad';
import { User } from '../types';
import { updateUserInDb, setCurrentUser, ADMIN_EMAIL } from '../authService';

interface AccountViewProps {
  currentUser: User;
  onLogout: () => void;
  onUpdate: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ currentUser, onLogout, onUpdate }) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isLight = currentUser.theme !== 'space-dark';
  
  const [saveMessage, setSaveMessage] = useState('');
  const [showCloudAssets, setShowCloudAssets] = useState(false); // Closed initially to save space
  const [isDrawingCloudSignature, setIsDrawingCloudSignature] = useState(false);

  const handleSaveDataUrlAsset = (type: 'template' | 'stamp' | 'signature', dataUrl: string | null) => {
    if (!currentUser.savedAssets) {
      currentUser.savedAssets = { template: null, stamp: null, signature: null };
    }
    currentUser.savedAssets[type] = dataUrl;
    updateUserInDb(currentUser);
    setCurrentUser(currentUser);
    setSaveMessage('تم حفظ أصولك السحابية بنجاح!');
    setTimeout(() => setSaveMessage(''), 3000);
    onUpdate();
  };

  const handleSaveAsset = (type: 'template' | 'stamp' | 'signature', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleSaveDataUrlAsset(type, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const cardClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-5 animate-fade-in-up pb-safe px-2 sm:px-0" dir="rtl">
      
      {/* Profile Header */}
      <div className={`p-7 rounded-3xl border flex flex-col items-center text-center gap-3 shadow-xl ${cardClass}`}>
        <div className="relative">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-3xl object-cover shadow-lg border-2 border-teal-500" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg">
              <UserIcon size={40} />
            </div>
          )}
        </div>

        <div>
          <h2 className={`text-2xl font-black ${textPrimary}`}>{currentUser.name || 'مستخدم وثيق'}</h2>
          
          <div className="flex items-center justify-center gap-3 mt-1.5 flex-wrap text-sm">
            <span className={`font-mono flex items-center gap-1.5 ${textSecondary}`}>
              <Mail size={14} className="text-teal-500" /> {currentUser.email}
            </span>
            {currentUser.phone && (
              <span className={`font-mono flex items-center gap-1.5 ${textSecondary}`}>
                <Phone size={14} className="text-teal-500" /> {currentUser.phone}
              </span>
            )}
            {currentUser.dob && (
              <span className={`flex items-center gap-1.5 ${textSecondary}`}>
                <Calendar size={14} className="text-teal-500" /> ميلاد: {currentUser.dob}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 px-3.5 py-1 rounded-full text-xs font-bold mt-2.5">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>حساب موثّق ومعتمد</span>
          </div>
        </div>
      </div>

      {/* Cloud Assets Vault (Collapsible for space efficiency) */}
      <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col gap-4 shadow-xl transition-all ${cardClass}`}>
        <div 
          onClick={() => setShowCloudAssets(!showCloudAssets)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl transition-transform group-hover:scale-105">
              <Layers size={20} />
            </div>
            <div>
              <h3 className={`font-black text-base sm:text-lg ${textPrimary}`}>أصولي المحفوظة (السحابة)</h3>
              <p className={`text-xs ${textSecondary}`}>أختامك وتوقيعك وورقتك الرسمية الجاهزة</p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCloudAssets(!showCloudAssets);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showCloudAssets
                ? (isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-950 text-teal-300 border-teal-800')
                : (isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700')
            }`}
          >
            <span>{showCloudAssets ? 'إخفاء' : 'عرض المزيد'}</span>
            {showCloudAssets ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
        
        {showCloudAssets && (
          <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <FileUpload
              label="الورقة الرسمية المحفوظة"
              subLabel="ورقة المؤسسة الرسمية الخاصة بك"
              accept="image/*,application/pdf"
              value={currentUser.savedAssets?.template}
              onChange={(f) => handleSaveAsset('template', f as File)}
              onClear={() => handleSaveDataUrlAsset('template', null)}
              icon={<FileText size={24} className="text-teal-500" />}
            />
            
            <FileUpload
              label="الختم الرسمي المحفوظ"
              subLabel="صورة شفافة PNG أو JPEG"
              accept="image/png, image/jpeg, application/pdf"
              value={currentUser.savedAssets?.stamp}
              onChange={(f) => handleSaveAsset('stamp', f as File)}
              onClear={() => handleSaveDataUrlAsset('stamp', null)}
              icon={<Stamp size={24} className="text-teal-500" />}
            />
            
            <div>
              <FileUpload
                label="التوقيع المحفوظ"
                subLabel="صورة توقيعك المعتمد"
                accept="image/png, image/jpeg, application/pdf"
                value={currentUser.savedAssets?.signature}
                onChange={(f) => handleSaveAsset('signature', f as File)}
                onClear={() => handleSaveDataUrlAsset('signature', null)}
                icon={<PenTool size={24} className="text-teal-500" />}
              />
              <div className="mt-2.5 flex justify-end">
                <button 
                  onClick={() => setIsDrawingCloudSignature(true)}
                  className={`text-xs px-4 py-2 font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <PenTool size={14} />
                  <span>رسم توقيع جديد وحفظه ✍️</span>
                </button>
              </div>
            </div>

            {saveMessage && (
              <div className="text-sm font-bold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{saveMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawing Signature Modal */}
      {isDrawingCloudSignature && (
        <SignaturePad
          onSave={(dataUrl) => {
            handleSaveDataUrlAsset('signature', dataUrl);
            setIsDrawingCloudSignature(false);
          }}
          onClose={() => setIsDrawingCloudSignature(false)}
        />
      )}

      {/* Tech Support - Only for regular users, hidden for Admin */}
      {!isAdmin && (
        <div className={`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl ${cardClass}`}>
          <h3 className={`font-black text-lg flex items-center gap-2 ${textPrimary}`}>
            <Headphones size={18} className="text-teal-500" />
            الدعم والمساعدة
          </h3>
          <p className={`text-sm ${textSecondary}`}>
            هل لديك استفسار أو اقتراح؟ يمكنك التواصل مع الإدارة مباشرة عبر واتساب.
          </p>
          <a 
            href="https://wa.me/966536894854?text=مرحباً،%20أحتاج%20مساعدة%20في%20منصة%20وثيق" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-center transition-all hover:scale-[1.01] shadow-lg flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            <span>تواصل مع الإدارة عبر واتساب</span>
          </a>
        </div>
      )}

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className={`w-full py-4 px-4 font-bold rounded-2xl text-sm transition-all hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
          isLight ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200' : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700'
        }`}
      >
        <LogOut size={18} />
        <span>تسجيل الخروج من الحساب</span>
      </button>

    </div>
  );
};
