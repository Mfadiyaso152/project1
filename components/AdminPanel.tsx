import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Users, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  ShieldCheck, 
  MessageCircle, 
  Phone, 
  Search, 
  Sparkles, 
  UserCheck, 
  UserX, 
  Clock, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  ADMIN_EMAIL, 
  ADMIN_PHONE, 
  getStoredCodes, 
  saveStoredCodes, 
  getStoredUsers, 
  saveStoredUsers, 
  generateCodeString 
} from '../authService';
import { RedemptionCode, User } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'codes' | 'customers' | 'overview'>('codes');
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState<'all' | 'available' | 'used'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = () => {
    const loadedCodes = getStoredCodes();
    const loadedUsers = getStoredUsers();
    setCodes(loadedCodes);
    setUsers(loadedUsers);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  if (!isOpen) return null;

  // Auto Generate Single Code
  const handleGenerateSingle = (notes: string = 'تم التوليد تلقائياً من لوحة المدير') => {
    const newCode: RedemptionCode = {
      code: generateCodeString(),
      createdAt: new Date().toISOString(),
      isUsed: false,
      usedByEmail: null,
      usedByName: null,
      usedAt: null,
      expiresAt: null,
      durationDays: 30,
      notes
    };

    const updated = [newCode, ...codes];
    setCodes(updated);
    saveStoredCodes(updated);
    showToast(`تم توليد الرمز تلقائياً: ${newCode.code} 🔑`);
    if (onRefreshData) onRefreshData();
  };

  // Auto Generate Batch Codes (e.g. 5 codes)
  const handleGenerateBatch = (count: number) => {
    const newBatch: RedemptionCode[] = [];
    for (let i = 0; i < count; i++) {
      newBatch.push({
        code: generateCodeString(),
        createdAt: new Date().toISOString(),
        isUsed: false,
        usedByEmail: null,
        usedByName: null,
        usedAt: null,
        expiresAt: null,
        durationDays: 30,
        notes: `حزمة دفعة ${count} رموز`
      });
    }

    const updated = [...newBatch, ...codes];
    setCodes(updated);
    saveStoredCodes(updated);
    showToast(`تم توليد ${count} رموز تفعيل جديدة بنجاح! 🚀`);
    if (onRefreshData) onRefreshData();
  };

  // Copy Code
  const handleCopy = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(codeStr);
    showToast('تم نسخ رمز الاسترداد إلى الحافظة! 📋');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Share Code via WhatsApp
  const handleShareWhatsApp = (codeItem: RedemptionCode) => {
    const msg = `مرحباً بك، تفضل رمز تفعيل اشتراكك في منصة وثيق (صالح لمدة شهر كامل 30 يوماً):\n\n🔑 رمز الاسترداد: ${codeItem.code}\n\nخطوات التفعيل:\n1. الدخول لموقع وثيق\n2. تسجيل الدخول بحساب Google\n3. إدخال رمز الاسترداد لتفعيل كافة ميزات الدمج والتوثيق.\n\nمع تحيات المدير العام: ${ADMIN_PHONE}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Delete Code
  const handleDeleteCode = (codeStr: string) => {
    const updated = codes.filter(c => c.code !== codeStr);
    setCodes(updated);
    saveStoredCodes(updated);
    showToast('تم حذف الرمز بنجاح.');
    if (onRefreshData) onRefreshData();
  };

  // Customer Management actions
  const handleActivateUserMonth = (userEmail: string) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === userEmail.toLowerCase()) {
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...u,
          isSubscribed: true,
          subscriptionExpiresAt: expiry
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    showToast(`تم تفعيل اشتراك المستخدم (${userEmail}) لمدة شهر! ✅`);
    if (onRefreshData) onRefreshData();
  };

  const handleExtendUserMonth = (userEmail: string) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === userEmail.toLowerCase()) {
        const base = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now()
          ? new Date(u.subscriptionExpiresAt).getTime()
          : Date.now();
        const expiry = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();
        return {
          ...u,
          isSubscribed: true,
          subscriptionExpiresAt: expiry
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    showToast(`تم تمديد 30 يوماً إضافية للمستخدم (${userEmail})! ⏳`);
    if (onRefreshData) onRefreshData();
  };

  const handleDeactivateUser = (userEmail: string) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === userEmail.toLowerCase()) {
        return {
          ...u,
          isSubscribed: false,
          subscriptionExpiresAt: new Date(Date.now() - 1000).toISOString()
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    showToast(`تم إيقاف اشتراك المستخدم (${userEmail}).`);
    if (onRefreshData) onRefreshData();
  };

  // Stats calculation
  const totalCodesCount = codes.length;
  const availableCodesCount = codes.filter(c => !c.isUsed).length;
  const usedCodesCount = codes.filter(c => c.isUsed).length;
  const activeSubscribersCount = users.filter(u => u.isSubscribed && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now()).length;

  // Filtered Codes
  const filteredCodes = codes.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.usedByEmail && c.usedByEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (codeFilter === 'available') return !c.isUsed;
    if (codeFilter === 'used') return c.isUsed;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] max-h-[800px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-scale-in">
        
        {/* Toast */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 animate-scale-in">
            <Sparkles size={14} className="text-teal-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">لوحة تحكم المدير العام</h3>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                  {ADMIN_EMAIL}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                إدارة وتوليد رموز الاسترداد، متابعة العملاء، والتحكم بالاشتراكات الشهرية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-white px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'codes'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key size={16} />
            <span>رموز الاسترداد ({totalCodesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={16} />
            <span>إدارة العملاء ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers size={16} />
            <span>نظرة عامة وإحصائيات</span>
          </button>
        </div>

        {/* Tab 1: Codes Management */}
        {activeTab === 'codes' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            
            {/* Quick Generator Toolbar */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-teal-600" size={20} />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">توليد رموز اشتراك شهرية جديدة</h4>
                  <p className="text-[11px] text-slate-600">كل رمز يفعل الخدمة لمدة 30 يوماً ويوقف تلقائياً</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateSingle()}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} />
                  <span>توليد رمز جديد تلقائي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateBatch(5)}
                  className="bg-white hover:bg-slate-100 text-teal-800 border border-teal-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                >
                  + حزمة 5 رموز
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateBatch(10)}
                  className="bg-white hover:bg-slate-100 text-teal-800 border border-teal-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
                >
                  + حزمة 10 رموز
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="بحث برمز، بريد عميل، أو ملاحظات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCodeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    codeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  الكل ({totalCodesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFilter('available')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    codeFilter === 'available' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  متاح للبيع ({availableCodesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCodeFilter('used')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    codeFilter === 'used' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  مُستخدَم ({usedCodesCount})
                </button>
              </div>
            </div>

            {/* Codes List */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">رمز الاسترداد</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">المدة</th>
                    <th className="p-3.5">المستخدِم</th>
                    <th className="p-3.5">تاريخ الانتهاء</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        لا توجد رموز استرداد مطابقة. اضغط على زر "توليد رمز جديد تلقائي" أعلاه.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900 tracking-wider">
                          <div className="flex items-center gap-2">
                            <span>{item.code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.code)}
                              title="نسخ الرمز"
                              className="text-slate-400 hover:text-teal-600 p-1 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              {copiedCode === item.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {item.isUsed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Check size={12} />
                              مُستخدَم
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              متاح للبيع
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {item.durationDays} يوم (شهر)
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {item.usedByEmail ? (
                            <div>
                              <div className="font-bold text-slate-900">{item.usedByName || item.usedByEmail}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.usedByEmail}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {item.expiresAt ? (
                            <span>{new Date(item.expiresAt).toLocaleDateString('en-GB')}</span>
                          ) : (
                            <span className="text-slate-400">عند التفعيل</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(item)}
                              title="إرسال للعميل عبر واتساب"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCode(item.code)}
                              title="حذف الرمز"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Customer Management */}
        {activeTab === 'customers' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">إدارة حسابات واشتراكات العملاء</h4>
                <p className="text-[11px] text-slate-500">يمكنك تفعيل أو تمديد أو إيقاف اشتراك أي عميل بضغطة زر</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">حالة الاشتراك</th>
                    <th className="p-3.5">الأيام المتبقية</th>
                    <th className="p-3.5 text-center">التحكم بالإشتراك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        لم يسجل أي عميل حتى الآن. عند تسجيل الدخول بقوقل سيظهر هنا تلقائياً.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isActive = u.isSubscribed && u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now();
                      const days = u.subscriptionExpiresAt ? Math.max(0, Math.ceil((new Date(u.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                      const isManager = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={u.id || u.email} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                              {u.name ? u.name.charAt(0) : 'U'}
                            </div>
                            <span>{u.name}</span>
                            {isManager && (
                              <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">المدير</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">
                            {u.email}
                          </td>
                          <td className="p-3.5">
                            {isManager ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                دائم VIP
                              </span>
                            ) : isActive ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                نشط ومفعل
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                غير مفعل / منتهي
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-700 font-bold">
                            {isManager ? 'غير محدود' : isActive ? `${days} يوم` : '0 يوم'}
                          </td>
                          <td className="p-3.5">
                            {!isManager ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleActivateUserMonth(u.email)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  تفعيل شهر
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExtendUserMonth(u.email)}
                                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  تمديد +30 يوم
                                </button>
                                {isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeactivateUser(u.email)}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-center block text-[11px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Overview & System Settings */}
        {activeTab === 'overview' && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col">
                <span className="text-xs text-slate-500 font-bold">إجمالي العملاء المسجلين</span>
                <span className="text-2xl font-black text-slate-900 mt-2">{users.length}</span>
                <span className="text-[10px] text-slate-400 mt-1">حسابات Google مسجلة</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col">
                <span className="text-xs text-emerald-800 font-bold">المشتركون النشطون حالياً</span>
                <span className="text-2xl font-black text-emerald-900 mt-2">{activeSubscribersCount}</span>
                <span className="text-[10px] text-emerald-700 mt-1">اشتراك شهري فعال</span>
              </div>

              <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex flex-col">
                <span className="text-xs text-teal-800 font-bold">رموز الاسترداد المتاحة</span>
                <span className="text-2xl font-black text-teal-900 mt-2">{availableCodesCount}</span>
                <span className="text-[10px] text-teal-700 mt-1">جاهزة للإرسال للعملاء</span>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col">
                <span className="text-xs text-amber-800 font-bold">الرموز المستردة والمستخدمة</span>
                <span className="text-2xl font-black text-amber-900 mt-2">{usedCodesCount}</span>
                <span className="text-[10px] text-amber-700 mt-1">تم تفعيلها بنجاح</span>
              </div>
            </div>

            {/* Manager Contact & Channel info */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Phone size={18} className="text-teal-600" />
                <span>قنوات التواصل لبيع الرموز والاستفسار</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] text-slate-500 font-bold block">رقم جوال / واتساب المدير:</span>
                  <span className="text-base font-extrabold text-teal-700 font-mono tracking-wider">{ADMIN_PHONE}</span>
                  <p className="text-[11px] text-slate-400 mt-1">يظهر للعملاء في نافذة طلب وشراء الرموز</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] text-slate-500 font-bold block">البريد الإلكتروني للإدارة:</span>
                  <span className="text-base font-extrabold text-slate-800 font-mono">{ADMIN_EMAIL}</span>
                  <p className="text-[11px] text-slate-400 mt-1">صلاحية المدير العام الكاملة مرتبطة بهذا البريد</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
