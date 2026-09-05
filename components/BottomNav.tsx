import React from 'react';
import { Home, User as UserIcon, Users } from 'lucide-react';
import { User, Step } from '../types';
import { ADMIN_EMAIL } from '../authService';

interface BottomNavProps {
  currentUser: User | null;
  currentStep: Step;
  onOpenHome?: () => void;
  onOpenAccount: () => void;
  onOpenAdminUsers?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  currentStep,
  onOpenHome,
  onOpenAccount,
  onOpenAdminUsers
}) => {
  const isLight = currentUser?.theme === 'default-light' || !currentUser;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const bgClass = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]';
  const textClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const activeClass = isLight ? 'text-teal-600' : 'text-teal-400';

  return (
    <div className={`fixed bottom-6 left-6 right-6 z-40 ${bgClass} rounded-full shadow-2xl max-w-md mx-auto overflow-hidden`} dir="rtl">
      <nav className="flex items-center justify-around w-full h-16 px-2">
        <NavButton 
          icon={<Home size={22} />} 
          label="الرئيسية" 
          onClick={onOpenHome} 
          isActive={currentStep === Step.UPLOAD || currentStep === Step.LANDING}
          activeClass={activeClass}
          textClass={textClass}
        />

        {isAdmin && onOpenAdminUsers && (
          <NavButton 
            icon={<Users size={22} />} 
            label="إدارة المستخدمين" 
            onClick={onOpenAdminUsers} 
            isActive={currentStep === Step.ADMIN_USERS}
            activeClass={activeClass}
            textClass={textClass}
          />
        )}
        
        <NavButton 
          icon={
            <div className="relative">
              <UserIcon size={22} />
              <span className={`absolute -top-1 -left-1 w-2.5 h-2.5 bg-teal-500 rounded-full border-2 ${isLight ? 'border-white' : 'border-slate-900'}`} />
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

const NavButton = ({ 
  icon, 
  label, 
  onClick, 
  isActive, 
  activeClass, 
  textClass 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void; 
  isActive: boolean; 
  activeClass: string; 
  textClass: string; 
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all duration-300 cursor-pointer ${
      isActive ? activeClass : textClass
    }`}
  >
    <div className={`transition-transform duration-200 ${isActive ? 'scale-110 font-bold' : ''}`}>
      {icon}
    </div>
    <span className={`text-[11px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
  </button>
);
