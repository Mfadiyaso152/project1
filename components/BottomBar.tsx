import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

export const BottomBar: React.FC = () => {
  return (
    <footer className="w-full bg-[#2855e9] text-white py-4 px-6 rounded-t-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
      {/* Developed by */}
      <div className="text-xs font-bold text-white/95">
        تم تطويره و برمجته بواسطة منصة وثيق
      </div>

      {/* Centered Brand / Logo badge */}
      <div className="flex items-center justify-center">
        <div className="bg-white/15 px-5 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-inner">
          <span className="text-xs font-black tracking-wider text-white">وثيق</span>
        </div>
      </div>

      {/* Contact & Phone */}
      <div className="flex items-center gap-3">
        <a 
          href="https://wa.me/966536894854" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white/15 hover:bg-white/25 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          title="التواصل مع الدعم عبر الواتساب"
        >
          <MessageCircle size={15} className="text-emerald-300" />
          <span>0536894854</span>
        </a>

        <a 
          href="tel:0536894854" 
          className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-full text-xs font-bold flex items-center justify-center transition-colors shadow-xs"
          title="اتصال مباشر"
        >
          <Phone size={15} className="text-amber-300" />
        </a>
      </div>
    </footer>
  );
};
