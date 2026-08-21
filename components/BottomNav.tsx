import React from 'react';
import { Home, User as UserIcon } from 'lucide-react';
import { User, Step } from '../types';

interface BottomNavProps {
  currentUser: User | null;
  currentStep: Step;
  onOpenHome?: () => void;
  onOpenAccount: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  currentStep,
  onOpenHome,
  onOpenAccount,
}) => {
  const isLight = currentUser?.theme === 'default-light' || !currentUser; 
  // We'll stick to a clean theme. The user requested WhatsApp style.

  const bgClass = 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-3xl border-t border-white/20 dark:border-slate-800/20 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]';
  const textClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const activeClass = isLight ? 'text-teal-600' : 'text-teal-400';

  return (
    <div className={`fixed bottom-6 left-6 right-6 z-40 ${bgClass} rounded-full shadow-2xl max-w-lg mx-auto overflow-hidden`} dir="rtl">
      <nav className="flex items-center justify-around w-full h-16">
        <NavButton 
          icon={<Home size={24} />} 
          label="الرئيسية" 
          onClick={onOpenHome} 
          isActive={currentStep === Step.UPLOAD || currentStep === Step.LANDING}
          activeClass={activeClass}
          textClass={textClass}
        />
        
        <NavButton 
          icon={
            <div className="relative">
              <UserIcon size={24} />
              {currentUser?.subscriptionStatus === 'active' && (
                <span className={`absolute -top-1 -left-1 w-3 h-3 bg-teal-500 rounded-full border-2 ${isLight ? 'border-white' : 'border-slate-900'}`} />
              )}
            </div>
          } 
          label="حسابي" 
          onClick={onOpenAccount} 
          isActive={currentStep === Step.ACCOUNT}
          activeClass={activeClass}
          textClass={textClass}
        />
      </nav>
    </div>
  );
};

const NavButton = ({ icon, label, onClick, isActive, activeClass, textClass }: { icon: React.ReactNode, label: string, onClick?: () => void, isActive: boolean, activeClass: string, textClass: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 cursor-pointer ${
      isActive ? activeClass : textClass
    }`}
  >
    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
  </button>
);
