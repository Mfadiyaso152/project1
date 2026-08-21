const fs = require('fs');
const content = `import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Crown, LogOut, CheckCircle2, AlertCircle, Clock, Settings, Key, Zap } from 'lucide-react';
import { User } from '../types';
import { redeemCodeForUser, updateUserInDb, setCurrentUser } from '../authService';

interface AccountViewProps {
  currentUser: User;
  onLogout: () => void;
  onUpdate: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ currentUser, onLogout, onUpdate }) => {
  const isAdmin = currentUser.role === 'admin';
  const isActive = currentUser.subscriptionStatus === 'active' || isAdmin;
  const isLight = currentUser.theme !== 'space-dark';
  
  const [showSettings, setShowSettings] = useState(false);
  const [codeValue, setCodeValue] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{text: string, isError: boolean} | null>(null);

  const handleThemeChange = (newTheme: 'default-light' | 'space-dark' | 'snap-yellow') => {
    currentUser.theme = newTheme;
    updateUserInDb(currentUser);
    setCurrentUser(currentUser);
    onUpdate();
  };

  const handleRedeem = () => {
    if (!codeValue.trim()) return;
    const res = redeemCodeForUser(currentUser, codeValue);
    setRedeemMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setCodeValue('');
      onUpdate();
    }
    setTimeout(() => setRedeemMessage(null), 5000);
  };

  const cardClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-safe" dir="rtl">
      
      {/* Profile Header */}
      <div className={\`p-8 rounded-3xl border flex flex-col items-center text-center gap-4 shadow-xl \${cardClass}\`}>
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-bold shadow-lg">
          <UserIcon size={40} />
        </div>
        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className={\`text-2xl font-black \${textPrimary}\`}>{currentUser.name || 'حسابي'}</h2>
            {isAdmin && (
              <span className="text-[10px] bg-teal-500 text-white font-bold px-2 py-0.5 rounded-full">
                المدير
              </span>
            )}
          </div>
          <p className={\`text-sm font-mono flex items-center justify-center gap-1 \${textSecondary}\`}>
            <Mail size={14} /> {currentUser.email}
          </p>
          {currentUser.phone && (
            <p className={\`text-sm font-mono flex items-center justify-center gap-1 mt-1 \${textSecondary}\`}>
              <Phone size={14} /> {currentUser.phone}
            </p>
          )}
        </div>
      </div>

      {/* Subscription Info (Hidden for Admin) */}
      {!isAdmin && (
        <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${
          currentUser.plan === 'pro' 
            ? (isLight ? 'bg-teal-50 border-teal-200' : 'bg-teal-900/20 border-teal-500/30')
            : cardClass
        }\`}>
          <h3 className={\`font-black text-lg \${textPrimary}\`}>حالة الاشتراك</h3>
          
          <div className="flex items-center justify-between">
            <span className={\`text-sm font-bold \${textSecondary}\`}>الباقة الحالية:</span>
            {currentUser.plan ? (
               <span className={\`text-xs font-black px-3 py-1 rounded-lg border flex items-center gap-1 \${
                 currentUser.plan === 'pro'
                   ? (isLight ? 'text-teal-700 bg-teal-100 border-teal-200' : 'text-teal-400 bg-teal-500/20 border-teal-500/30')
                  : (isLight ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-slate-300 bg-slate-700 border-slate-600')
               }\`}>
                 {currentUser.plan === 'pro' ? <Crown size={14} /> : null}
                 {currentUser.plan.toUpperCase()}
               </span>
            ) : (
               <span className="text-xs text-slate-500">لا توجد باقة</span>
            )}
          </div>
          <div className="flex items-center justify-between">
             <span className={\`text-sm font-bold \${textSecondary}\`}>الحالة:</span>
             {isActive ? (
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 size={14} /> مفعل
                </span>
             ) : (
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} /> غير مفعل
                </span>
             )}
          </div>
          {currentUser.subscriptionExpiresAt && (
            <div className={\`border-t pt-3 mt-1 flex justify-between items-center text-sm \${isLight ? 'border-teal-200/50' : 'border-teal-500/20'}\`}>
              <span className={\`flex items-center gap-1 \${textSecondary}\`}><Clock size={14} /> تاريخ الانتهاء:</span>
              <span className={\`font-bold \${textPrimary}\`}>
                {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ar-SA')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Redeem Code */}
      {!isAdmin && (
        <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
          <h3 className={\`font-black text-lg flex items-center gap-2 \${textPrimary}\`}>
            <Key size={18} className="text-teal-500" />
            استرداد الرمز
          </h3>
          <p className={\`text-sm \${textSecondary}\`}>أدخل رمز التفعيل الذي حصلت عليه لتفعيل باقتك.</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="WTQ-XXXX..."
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              className={\`flex-1 rounded-xl px-4 py-2 font-mono text-left border focus:ring-2 focus:ring-teal-500 outline-none transition-colors \${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800 border-slate-700 text-white'
              }\`}
            />
            <button 
              onClick={handleRedeem}
              className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 rounded-xl transition-colors"
            >
              تفعيل
            </button>
          </div>
          {redeemMessage && (
            <div className={\`text-sm font-bold p-3 rounded-lg flex items-center gap-2 \${
              redeemMessage.isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }\`}>
              {redeemMessage.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {redeemMessage.text}
            </div>
          )}
        </div>
      )}

      {/* Settings (Themes) */}
      <div className={\`p-6 rounded-3xl border flex flex-col gap-4 shadow-xl \${cardClass}\`}>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={\`flex items-center justify-between w-full font-black text-lg \${textPrimary}\`}
        >
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-slate-400" />
            الإعدادات
          </div>
          <div className={\`transform transition-transform \${showSettings ? 'rotate-180' : ''}\`}>▼</div>
        </button>

        {showSettings && (
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <span className={\`text-sm font-bold block mb-2 \${textSecondary}\`}>مظهر التطبيق:</span>
              {currentUser.plan === 'pro' || isAdmin ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleThemeChange('default-light')}
                    className={\`flex-1 py-2 rounded-xl border text-sm font-bold transition-all \${
                      currentUser.theme === 'default-light' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }\`}
                  >
                    العادي (فاتح)
                  </button>
                  <button 
                    onClick={() => handleThemeChange('space-dark')}
                    className={\`flex-1 py-2 rounded-xl border text-sm font-bold transition-all \${
                      currentUser.theme === 'space-dark' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800 bg-slate-900'
                    }\`}
                  >
                    فضاء (داكن)
                  </button>
                  <button 
                    onClick={() => handleThemeChange('snap-yellow')}
                    className={\`flex-1 py-2 rounded-xl border text-sm font-bold transition-all \${
                      currentUser.theme === 'snap-yellow' ? 'border-[#e6e300] bg-[#FFFC00] text-black shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }\`}
                  >
                    سناب شات
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  <Crown size={16} className="text-amber-500" />
                  <span className={\`text-sm \${textSecondary}\`}>تغيير المظهر متاح في باقة PRO فقط.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className={\`w-full py-4 px-4 font-bold rounded-2xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm \${
          isLight ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100' : 'bg-slate-800 hover:bg-slate-700 text-red-400'
        }\`}
      >
        <LogOut size={18} />
        تسجيل الخروج
      </button>

    </div>
  );
};
`
fs.writeFileSync('components/AccountView.tsx', content);
