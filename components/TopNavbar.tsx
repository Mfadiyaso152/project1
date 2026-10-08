import React, { useState } from 'react';
import { 
  FileText, 
  Menu, 
  X, 
  User as UserIcon, 
  Layers, 
  Home, 
  LogOut, 
  ChevronLeft,
  ShieldCheck,
  Headphones,
  Info,
  FolderOpen
} from 'lucide-react';
import { User, Step } from '../types';

interface TopNavbarProps {
  currentUser: User | null;
  currentStep: Step;
  onNavigate: (step: Step) => void;
  onLogout: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentUser,
  currentStep,
  onNavigate,
  onLogout
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = (step: Step) => {
    onNavigate(step);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Top Floating Glass Bar */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none" dir="rtl">
        <div className="w-full max-w-5xl h-14 sm:h-15 rounded-full px-4 sm:px-6 flex items-center justify-between pointer-events-auto bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-xl transition-all">
          
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-6 sm:gap-8">
            <div 
              onClick={() => handleLinkClick(currentUser ? Step.UPLOAD : Step.LANDING)}
              className="flex items-center gap-2 cursor-pointer select-none group"
            >
              <div className="p-1.5 bg-teal-500 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                <FileText size={18} className="stroke-[2.5]" />
              </div>
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                وثيق | Wathiq
              </span>
            </div>

            {/* Desktop Nav Items */}
            <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-bold text-slate-600">
              <button
                type="button"
                onClick={() => handleLinkClick(currentUser ? Step.UPLOAD : Step.LANDING)}
                className={`transition-colors cursor-pointer ${
                  currentStep === Step.LANDING || currentStep === Step.UPLOAD
                    ? 'text-teal-600'
                    : 'hover:text-slate-900'
                }`}
              >
                الرئيسية
              </button>

              <button
                type="button"
                onClick={() => handleLinkClick(Step.ABOUT)}
                className={`transition-colors cursor-pointer ${
                  currentStep === Step.ABOUT
                    ? 'text-teal-600'
                    : 'hover:text-slate-900'
                }`}
              >
                عن وثيق
              </button>

              {currentUser && (
                <>
                  <button
                    type="button"
                    onClick={() => handleLinkClick(Step.ASSETS)}
                    className={`transition-colors cursor-pointer ${
                      currentStep === Step.ASSETS
                        ? 'text-teal-600'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    إدارة الأصول
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick(Step.ACCOUNT)}
                    className={`transition-colors cursor-pointer ${
                      currentStep === Step.ACCOUNT
                        ? 'text-teal-600'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    حسابي
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* User Profile or Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Desktop Auth State */}
            <div className="hidden sm:flex items-center gap-2">
              {currentUser ? (
                <div 
                  onClick={() => handleLinkClick(Step.ACCOUNT)}
                  className="flex items-center gap-2.5 p-1 pr-3 pl-1.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">{currentUser.name || 'مستخدم وثيق'}</span>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-teal-500" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-xs">
                      <UserIcon size={14} />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLinkClick(Step.AUTH)}
                  className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-2 rounded-full transition-all cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>

            {/* Mobile Menu Icon */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="القائمة الجانبية"
              className="p-2 rounded-full text-slate-800 hover:bg-slate-100 transition-all cursor-pointer md:hidden active:scale-95"
            >
              <Menu size={22} className="stroke-[2.5]" />
            </button>
          </div>

        </div>
      </header>

      {/* iOS-Inspired Modern Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity animate-fade-in"
          />

          {/* Drawer Sheet */}
          <div 
            className="fixed top-0 bottom-0 left-0 w-80 sm:w-88 z-50 flex flex-col justify-between shadow-2xl p-6 overflow-y-auto bg-white/95 text-slate-900 border-r border-slate-200/80 backdrop-blur-2xl animate-fade-in pt-safe pb-safe"
          >
            {/* Top section */}
            <div className="flex flex-col gap-5">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-500 text-white rounded-xl">
                    <FileText size={18} className="stroke-[2.5]" />
                  </div>
                  <span className="font-black text-base tracking-tight text-slate-900">وثيق | Wathiq</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User snippet if logged in */}
              {currentUser ? (
                <div 
                  onClick={() => handleLinkClick(Step.ACCOUNT)}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3 cursor-pointer transition-all hover:bg-slate-100"
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-11 h-11 rounded-xl object-cover border border-teal-500 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-base shrink-0">
                      <UserIcon size={20} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm text-slate-900 truncate">{currentUser.name || 'مستخدم وثيق'}</h4>
                    <p className="text-xs text-slate-500 truncate font-mono">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 mt-0.5">
                      <ShieldCheck size={11} />
                      <span>حساب معتمد</span>
                    </span>
                  </div>

                  <ChevronLeft size={16} className="text-slate-400 shrink-0" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLinkClick(Step.AUTH)}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-3 px-4 rounded-2xl shadow-xs transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>تسجيل الدخول</span>
                  <ChevronLeft size={16} />
                </button>
              )}

              {/* Menu Navigation Items */}
              <div className="flex flex-col gap-1.5">
                
                <button
                  type="button"
                  onClick={() => handleLinkClick(currentUser ? Step.UPLOAD : Step.LANDING)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                    currentStep === Step.UPLOAD || currentStep === Step.LANDING
                      ? 'bg-teal-50 text-teal-800 font-black'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home size={17} className="text-teal-600" />
                    <span>الرئيسية ومساحة العمل</span>
                  </div>
                  <ChevronLeft size={15} className="opacity-60" />
                </button>

                <button
                  type="button"
                  onClick={() => handleLinkClick(Step.ABOUT)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                    currentStep === Step.ABOUT
                      ? 'bg-teal-50 text-teal-800 font-black'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Info size={17} className="text-teal-600" />
                    <span>عن وثيق</span>
                  </div>
                  <ChevronLeft size={15} className="opacity-60" />
                </button>

                {currentUser && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleLinkClick(Step.ASSETS)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                        currentStep === Step.ASSETS
                          ? 'bg-teal-50 text-teal-800 font-black'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers size={17} className="text-teal-600" />
                        <span>إدارة الأصول الحسابية</span>
                      </div>
                      <ChevronLeft size={15} className="opacity-60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLinkClick(Step.ACCOUNT)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                        currentStep === Step.ACCOUNT
                          ? 'bg-teal-50 text-teal-800 font-black'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <UserIcon size={17} className="text-teal-600" />
                        <span>إدارة الحساب</span>
                      </div>
                      <ChevronLeft size={15} className="opacity-60" />
                    </button>
                  </>
                )}

              </div>

            </div>

            {/* Bottom Support & Logout */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                href="https://wa.me/966536894854?text=مرحباً،%20أحتاج%20مساعدة%20في%20منصة%20وثيق"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
              >
                <Headphones size={15} className="text-teal-500" />
                <span>الدعم الفني المباشر</span>
              </a>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>تسجيل الخروج</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
