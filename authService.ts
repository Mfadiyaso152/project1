import { User, RedemptionCode, SubscriptionRequest, SystemStats, PlanType } from './types';

export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';
export const ADMIN_PASSWORD = 'Mfadiyaso15';
export const ADMIN_PHONE = '0536894854';

const STORAGE_KEY_USER = 'watheeq_current_user';
const STORAGE_KEY_USERS = 'watheeq_all_users';
const STORAGE_KEY_CODES = 'watheeq_redemption_codes';
const STORAGE_KEY_REQUESTS = 'watheeq_subscription_requests';
const STORAGE_KEY_STATS = 'watheeq_system_stats';

// Helper to generate a unique readable code
export const generateCodeString = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  let part3 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    part3 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WTQ-${part1}-${part2}-${part3}`;
};

export const getStoredUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const user: User = JSON.parse(raw);

    // Refresh from DB to get latest status
    const allUsers = getStoredUsers();
    const freshUser = allUsers.find(u => u.email === user.email);
    
    if (freshUser) {
      if (freshUser.subscriptionExpiresAt) {
        if (Date.now() > new Date(freshUser.subscriptionExpiresAt).getTime() && freshUser.role !== 'admin') {
          freshUser.subscriptionStatus = 'none';
          updateUserInDb(freshUser);
        }
      }
      return freshUser;
    }
    
    return user;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null) => {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY_USER);
  } else {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    updateUserInDb(user);
  }
};

export const updateUserInDb = (user: User) => {
    const users = getStoredUsers();
    const existingIdx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIdx >= 0) {
      users[existingIdx] = user;
    } else {
      users.push(user);
    }
    saveStoredUsers(users);
};

export const loginUser = (email: string, passwordHash: string): { success: boolean; user?: User; message: string } => {
  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
  const users = getStoredUsers();

  if (isAdmin) {
    if (passwordHash === ADMIN_PASSWORD) {
      let user = users.find(u => u.email === cleanEmail);
      if (user) {
        user.passwordHash = passwordHash;
        user.role = 'admin';
        user.plan = 'pro';
        user.name = 'محمد';
        updateUserInDb(user);
        setCurrentUser(user);
        return { success: true, user, message: 'تم تسجيل الدخول بنجاح كمدير' };
      } else {
        return registerUser(email, passwordHash, 'محمد', '0536894854', '', 'pro');
      }
    } else {
      return { success: false, message: 'كلمة المرور الخاصة بالمدير غير صحيحة' };
    }
  }

  const user = users.find(u => u.email === cleanEmail && u.passwordHash === passwordHash);
  if (user) {
    setCurrentUser(user);
    return { success: true, user, message: 'تم تسجيل الدخول بنجاح' };
  }
  return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
};

export const registerUser = (email: string, passwordHash: string, name?: string, phone?: string, dob?: string, plan?: "basic" | "pro"):  { success: boolean; user?: User; message: string } => {
  const cleanEmail = email.trim().toLowerCase();
  const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
  if (isAdmin && passwordHash !== ADMIN_PASSWORD) {
    return { success: false, message: 'كلمة المرور الخاصة بالمدير غير صحيحة' };
  }
  const users = getStoredUsers();
  
  if (users.find(u => u.email === cleanEmail)) {
    return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' };
  }

  const today = new Date().toISOString().split('T')[0];
  
  const newUser: User = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    passwordHash,
    name: isAdmin ? 'محمد' : (name || ''),
    dob: dob || '',
    phone: phone || '',
    role: isAdmin ? 'admin' : 'user',
    plan: isAdmin ? 'pro' : (plan || null),
    subscriptionStatus: isAdmin ? 'active' : 'none',
    subscriptionExpiresAt: isAdmin ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
    createdAt: new Date().toISOString(),
    theme: 'default-light',
    savedAssets: { template: null, stamp: null, signature: null }
  };

  setCurrentUser(newUser);
  if (!isAdmin && plan) { createSubscriptionRequest(newUser, plan); }
  return { success: true, user: newUser, message: 'تم إنشاء الحساب بنجاح' };
};

export const getStoredRequests = (): SubscriptionRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredRequests = (requests: SubscriptionRequest[]) => {
  localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
};

export const createSubscriptionRequest = (user: User, plan: 'basic' | 'pro'): SubscriptionRequest => {
  const requests = getStoredRequests();
  const newReq: SubscriptionRequest = {
    id: 'req_' + Math.random().toString(36).substring(2, 9),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    plan,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  requests.push(newReq);
  saveStoredRequests(requests);
  
  user.plan = plan;
  user.subscriptionStatus = 'pending';
  setCurrentUser(user);
  
  return newReq;
};

export const getStoredCodes = (): RedemptionCode[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CODES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredCodes = (codes: RedemptionCode[]) => {
  localStorage.setItem(STORAGE_KEY_CODES, JSON.stringify(codes));
};

export const generateCode = (plan: 'basic' | 'pro', durationDays: number): RedemptionCode => {
  const codes = getStoredCodes();
  const newCode: RedemptionCode = {
    code: generateCodeString(),
    plan,
    durationDays,
    createdAt: new Date().toISOString(),
    isUsed: false,
    usedByEmail: null,
    usedAt: null
  };
  codes.push(newCode);
  saveStoredCodes(codes);
  return newCode;
};

export const getStats = (): SystemStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return { totalRevenue: 0 };
    return JSON.parse(raw);
  } catch {
    return { totalRevenue: 0 };
  }
};

export const addRevenue = (amount: number) => {
  const stats = getStats();
  stats.totalRevenue += amount;
  localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
};

export const redeemCodeForUser = (user: User, codeText: string): { success: boolean; message: string; updatedUser?: User } => {
  const normalizedCode = codeText.trim().toUpperCase();
  const codes = getStoredCodes();
  const targetCodeIdx = codes.findIndex(c => c.code.toUpperCase() === normalizedCode);

  if (targetCodeIdx === -1) {
    return { success: false, message: 'رمز الاسترداد غير صحيح.' };
  }

  const targetCode = codes[targetCodeIdx];

  if (targetCode.isUsed) {
    return { success: false, message: 'هذا الرمز تم استخدامه مسبقاً.' };
  }

  // Calculate new expiry
  const now = new Date();
  const durationDays = targetCode.durationDays || 30; // Fallback for older codes
  const plan = targetCode.plan || 'pro'; // Fallback for older codes

  const durationMs = durationDays * 24 * 60 * 60 * 1000;
  let baseTime = now.getTime();
  if (user.subscriptionExpiresAt) {
    const existingExpiry = new Date(user.subscriptionExpiresAt).getTime();
    if (existingExpiry > baseTime) {
      baseTime = existingExpiry;
    }
  }
  const expiryDate = new Date(baseTime + durationMs);

  // Mark used
  targetCode.isUsed = true;
  targetCode.usedByEmail = user.email;
  targetCode.usedAt = now.toISOString();
  saveStoredCodes(codes);

  // Add revenue (assuming standard prices for now, or could depend on days)
  addRevenue(plan === 'pro' ? 55 : 35);

  // Update request status if exists
  const requests = getStoredRequests();
  const reqIdx = requests.findIndex(r => r.userId === user.id && r.status === 'pending');
  if (reqIdx >= 0) {
    requests[reqIdx].status = 'completed';
    saveStoredRequests(requests);
  }

  // Update user
  if (!user.redeemedCodesHistory) user.redeemedCodesHistory = [];
  user.redeemedCodesHistory.push({
    code: targetCode.code,
    plan,
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString()
  });
  user.subscriptionStatus = 'active';
  user.plan = plan;
  user.subscriptionExpiresAt = expiryDate.toISOString();
  setCurrentUser(user);

  return {
    success: true,
    message: `تم تفعيل باقة ${plan === 'pro' ? 'Pro' : 'Basic'} بنجاح! صالحة حتى ${expiryDate.toLocaleDateString('en-GB')}`,
    updatedUser: user
  };
};

export const canUserProcessFile = (user: User | null): { allowed: boolean; reason?: string } => {
  if (!user) return { allowed: false, reason: 'يرجى تسجيل الدخول' };
  if (user.role === 'admin') return { allowed: true };
  if (user.subscriptionStatus !== 'active') return { allowed: false, reason: 'اشتراكك غير مفعل أو موقوف' };
  
  if (user.subscriptionExpiresAt && Date.now() > new Date(user.subscriptionExpiresAt).getTime()) {
    return { allowed: false, reason: 'انتهت صلاحية اشتراكك' };
  }

  return { allowed: true };
};

export const getAllUsers = (): User[] => getStoredUsers();

export const deleteUnusedCodes = () => {
  const codes = getStoredCodes();
  const filtered = codes.filter(c => c.isUsed);
  saveStoredCodes(filtered);
};

export const confirmRequestAndAddRevenue = (reqId: string) => {
  const requests = getStoredRequests();
  const reqIdx = requests.findIndex(r => r.id === reqId);
  if (reqIdx === -1) return false;
  
  const req = requests[reqIdx];
  if (req.status === 'completed') return false;
  
  req.status = 'completed';
  saveStoredRequests(requests);
  
  // Add revenue when admin accepts
  addRevenue(req.plan === 'pro' ? 35 : 25);
  return true;
};

export const cancelRequest = (reqId: string) => {
  let requests = getStoredRequests();
  requests = requests.filter(r => r.id !== reqId);
  saveStoredRequests(requests);
  return true;
};;
