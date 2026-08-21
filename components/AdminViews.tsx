import React, { useState, useEffect } from 'react';
import { ListOrdered, DollarSign, Key, Users, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, SubscriptionRequest, RedemptionCode } from '../types';
import { getStoredRequests, getStats, getStoredCodes, generateCode, getAllUsers, deleteUnusedCodes, confirmRequestAndAddRevenue, cancelRequest } from '../authService';

const StatCard = ({ title, value, icon, isLight }: { title: string, value: string, icon: React.ReactNode, isLight: boolean }) => (
  <div className={`p-6 rounded-3xl border flex flex-col gap-2 shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
    <div className={`flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
      {icon}
      <span className="text-sm font-bold">{title}</span>
    </div>
    <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</div>
  </div>
);

// --- Requests View ---
export const AdminRequestsView = ({ currentUser }: { currentUser: User }) => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const isLight = currentUser.theme !== 'space-dark';

  const handleConfirm = (id: string) => {
    confirmRequestAndAddRevenue(id);
    setRequests(getStoredRequests());
  };

  const handleCancel = (id: string) => {
    cancelRequest(id);
    setRequests(getStoredRequests());
  };

  useEffect(() => {
    setRequests(getStoredRequests());
  }, []);

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-safe" dir="rtl">
      <h2 className={`text-2xl font-black mb-2 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <ListOrdered size={24} className="text-teal-500" />
        طلبات العملاء
      </h2>
      
      {requests.length === 0 ? (
        <div className={`p-8 text-center rounded-3xl border border-dashed ${isLight ? 'border-slate-300 text-slate-500' : 'border-slate-700 text-slate-400'}`}>
          لا توجد طلبات حالياً
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map(req => (
            <div key={req.id} className={`p-5 rounded-3xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{req.userName || req.userEmail}</h4>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{req.userPhone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  req.status === 'completed' 
                    ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                    : (isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-teal-500/20 text-teal-400 border-teal-500/30')
                }`}>
                  {req.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                </span>
              </div>
              <div className={`p-3 rounded-xl text-sm font-mono flex flex-col gap-2 ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
                <span>الباقة المطلوبة: {(req.plan || 'basic').toUpperCase()}</span>
                {req.amountTransferred && <span>المبلغ المحول: {req.amountTransferred} ريال</span>}
              </div>
              
              {req.status === 'pending' && (
                <div className="flex flex-col gap-2 border-t pt-3 mt-3 border-slate-100">
                  <div className="flex gap-2">
                    <button onClick={() => handleConfirm(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                      تأكيد الطلب
                    </button>
                    <button onClick={() => handleCancel(req.id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                      إلغاء الطلب
                    </button>
                  </div>
                  <a 
                    href={`https://wa.me/${req.userPhone?.replace(/\+/g, '').replace(/^0/, '966')}?text=مرحباً%20عزيزي%20${req.userName}،%20بخصوص%20طلب%20تفعيل%20اشتراكك%20في%20منصة%20وثيق`} 
                    target="_blank" rel="noopener noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-sm font-bold text-center transition-colors"
                  >
                    تواصل واتساب
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Revenue View ---
export const AdminRevenueView = ({ currentUser }: { currentUser: User }) => {
  const [revenue, setRevenue] = useState(0);
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const isLight = currentUser.theme !== 'space-dark';

  useEffect(() => {
    setRevenue(getStats().totalRevenue);
    setCodes(getStoredCodes());
  }, []);

  const totalUsed = codes.filter(c => c.isUsed).length;

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-safe" dir="rtl">
      <h2 className={`text-2xl font-black mb-2 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <DollarSign size={24} className="text-emerald-500" />
        ملخص الأرباح
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="إجمالي الأرباح" value={`${revenue} ريال`} icon={<DollarSign size={18} />} isLight={isLight} />
        <StatCard title="الرموز المفعلة" value={totalUsed.toString()} icon={<CheckCircle2 size={18} />} isLight={isLight} />
      </div>
    </div>
  );
};

// --- Codes View ---
export const AdminCodesView = ({ currentUser }: { currentUser: User }) => {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [plan, setPlan] = useState<'basic' | 'pro'>('pro');
  const [duration, setDuration] = useState<number>(30); // days
  const isLight = currentUser.theme !== 'space-dark';

  useEffect(() => {
    setCodes(getStoredCodes());
  }, []);

  const handleGenerate = () => {
    const finalPlan = duration === 7 ? 'basic' : plan;
    generateCode(finalPlan, duration);
    setCodes(getStoredCodes());
  };

  const handleDeleteUnused = () => {
    deleteUnusedCodes();
    setCodes(getStoredCodes());
    alert('تم حذف جميع الأكواد غير المستخدمة');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('تم نسخ الرمز');
  };

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-safe" dir="rtl">
      <h2 className={`text-2xl font-black mb-2 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <Key size={24} className="text-teal-500" />
        توليد رموز الاشتراك
      </h2>
      <button onClick={handleDeleteUnused} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 px-4 rounded-xl text-sm font-bold transition-colors self-start">
        حذف الأكواد غير المستخدمة
      </button>
      
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-5 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>الباقة</label>
          <div className="flex gap-2">
            <button onClick={() => { if (duration !== 7) setPlan('pro'); }} className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${duration === 7 ? 'opacity-50 cursor-not-allowed ' : ''}${plan === 'pro' ? 'bg-teal-500 text-white border-teal-500' : (isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-800')}`}>
              Pro (احترافي)
            </button>
            <button onClick={() => setPlan('basic')} className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${plan === 'basic' ? 'bg-teal-500 text-white border-teal-500' : (isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-800')}`}>
              Basic (أساسي)
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>المدة</label>
          <div className="grid grid-cols-3 gap-2">
            {[7, 30, 90].map(days => (
              <button 
                key={days} 
                onClick={() => { setDuration(days); if (days === 7) setPlan('basic'); }} 
                className={`py-2 rounded-xl text-sm font-bold border transition-colors ${duration === days ? 'bg-teal-500 text-white border-teal-500' : (isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-800')}`}
              >
                {days === 7 ? 'تجربة 7 أيام' : days === 30 ? 'شهر' : '3 شهور'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} className="w-full py-4 mt-2 rounded-xl font-black text-white bg-teal-500 shadow-lg hover:scale-[1.02] transition-transform active:scale-95">
          توليد كود جديد
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-4">
        {codes.slice().reverse().map(code => (
          <div key={code.code} className={`p-4 rounded-3xl border flex items-center justify-between shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div>
              <div className={`font-mono font-bold text-lg ${isLight ? 'text-slate-900' : 'text-teal-400'}`}>{code.code}</div>
              <div className={`text-xs mt-1 flex gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>{(code.plan || 'pro').toUpperCase()}</span>
                <span>•</span>
                <span>{code.durationDays || 30} يوم</span>
                <span>•</span>
                <span>{code.isUsed ? 'مستخدم' : 'متاح'}</span>
              </div>
            </div>
            <button onClick={() => handleCopy(code.code)} className={`p-2 rounded-xl transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
              <Copy size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Users View ---
export const AdminUsersView = ({ currentUser }: { currentUser: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const isLight = currentUser.theme !== 'space-dark';

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 animate-fade-in-up pb-safe" dir="rtl">
      <h2 className={`text-2xl font-black mb-2 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
        <Users size={24} className="text-teal-500" />
        العملاء المسجلين
      </h2>
      
      <div className="flex flex-col gap-4">
        {users.filter(u => u.role !== 'admin').map(user => (
          <div key={user.email} className={`p-5 rounded-3xl border shadow-sm ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h4>
                <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</p>
                <p className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{user.phone}</p>
              </div>
              
            </div>
            <div className={`p-3 rounded-xl text-sm flex flex-col gap-1 ${isLight ? 'bg-slate-50 text-slate-700' : 'bg-slate-950 text-slate-300'}`}>
              <div>الباقة: <span className="font-bold">{(user.plan || 'بدون').toUpperCase()}</span></div>
              <div className="text-xs opacity-80">
                تاريخ انتهاء الاشتراك: <span className="font-mono font-bold">{user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('en-GB') : 'غير متوفر'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
