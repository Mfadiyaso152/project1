import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { 
  getAllUsers, 
  deleteUserByAdmin, 
  toggleUserStatus, 
  ADMIN_EMAIL
} from '../authService';

export const AdminUsersView = ({ currentUser }: { currentUser: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const isLight = currentUser.theme !== 'space-dark';

  const loadData = () => {
    setUsers(getAllUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = (user: User) => {
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showToast('لا يمكن إيقاف حساب المدير الرئيسي', true);
      return;
    }
    const res = toggleUserStatus(user.id);
    if (res.success) {
      showToast(res.newStatus === 'active' ? `تم تفعيل حساب ${user.name}` : `تم إيقاف حساب ${user.name}`);
      loadData();
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      showToast('لا يمكن حذف حساب المدير الرئيسي', true);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف حساب "${user.name}" (${user.email})؟`)) {
      const ok = deleteUserByAdmin(user.id);
      if (ok) {
        showToast('تم حذف المستخدم بنجاح');
        loadData();
      } else {
        showToast('حدث خطأ أثناء محاولة الحذف', true);
      }
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) || 
      u.phone?.includes(q);

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const cardBg = isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-5 animate-fade-in-up pb-safe px-2 sm:px-0" dir="rtl">
      
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 border animate-fade-in ${
          toastMessage.isError 
            ? 'bg-red-500 text-white border-red-600' 
            : 'bg-emerald-500 text-white border-emerald-600'
        }`}>
          {toastMessage.isError ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-black flex items-center gap-3 ${textPrimary}`}>
          <div className="p-2.5 bg-teal-500 text-white rounded-2xl shadow-md shadow-teal-500/20">
            <Users size={22} />
          </div>
          إدارة المستخدمين
        </h2>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-3 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-2.5 ${cardBg}`}>
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="بحث باسم المستخدم، البريد، أو رقم الجوال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 px-4 pr-10 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 outline-none transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
            }`}
          />
          <Search size={18} className="absolute right-3 top-3 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`py-2 px-3 rounded-xl text-xs font-bold border outline-none w-full sm:w-auto ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <option value="all">جميع الحسابات ({users.length})</option>
            <option value="active">الحسابات النشطة</option>
            <option value="suspended">الحسابات الموقوفة</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-3">
        {filteredUsers.length === 0 ? (
          <div className={`p-10 text-center rounded-3xl border border-dashed ${isLight ? 'border-slate-300 text-slate-500' : 'border-slate-800 text-slate-500'}`}>
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <h4 className="font-bold text-sm">لم يتم العثور على أي حسابات</h4>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isUserAdmin = user.role === 'admin' || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const isPrimaryAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const isActive = user.status === 'active';

            return (
              <div
                key={user.id}
                className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg} ${
                  !isActive ? 'opacity-70 border-red-200' : ''
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white font-black text-base flex items-center justify-center shadow-md">
                        {user.name ? user.name.charAt(0) : 'U'}
                      </div>
                    )}
                    {isUserAdmin && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-1 rounded-full shadow-sm" title="مدير">
                        <Shield size={10} />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-black text-sm sm:text-base ${textPrimary}`}>{user.name || 'مستخدم'}</h4>
                      {isUserAdmin && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          مشرف
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {isActive ? 'نشط' : 'موقوف'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail size={12} className="text-slate-400" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          {user.phone}
                        </span>
                      )}
                      {user.dob && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {user.dob}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
                  {/* WhatsApp Quick Link */}
                  {user.phone && (
                    <a
                      href={`https://wa.me/${user.phone.replace(/\+/g, '').replace(/^0/, '966')}?text=مرحباً%20${encodeURIComponent(user.name)}،%20معك%20إدارة%20منصة%20وثيق`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="مراسلة واتساب"
                    >
                      <Phone size={14} />
                      <span className="hidden md:inline">واتساب</span>
                    </a>
                  )}

                  {/* Toggle Active / Suspended */}
                  {!isPrimaryAdmin && (
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                        isActive 
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}
                      title={isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                    >
                      {isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      <span className="hidden md:inline">{isActive ? 'إيقاف' : 'تفعيل'}</span>
                    </button>
                  )}

                  {/* Delete User */}
                  {!isPrimaryAdmin && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                      title="حذف الحساب نهائياً"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
