import { User, SystemStats } from './types';

export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';
export const ADMIN_PHONE = '0536894854';

const STORAGE_KEY_USER = 'watheeq_current_user';
const STORAGE_KEY_USERS = 'watheeq_all_users';

export const getStoredUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      // Seed initial admin user if empty
      const initialAdmin: User = {
        id: 'usr_admin_default',
        email: ADMIN_EMAIL,
        name: 'محمد',
        dob: '1995-01-01',
        phone: ADMIN_PHONE,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=محمد`,
        authProvider: 'google',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        theme: 'default-light',
        savedAssets: { template: null, stamp: null, signature: null }
      };
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([initialAdmin]));
      return [initialAdmin];
    }
    let users: User[] = JSON.parse(raw);
    // Cleanup any legacy 'المدير' suffix and ensure active status
    let changed = false;
    users = users.map(u => {
      let updated = { ...u };
      if (updated.name && updated.name.includes('(المدير)')) {
        updated.name = updated.name.replace('(المدير)', '').trim();
        changed = true;
      }
      if (updated.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        updated.status = 'active';
        updated.role = 'admin';
      }
      return updated;
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
    return users;
  } catch {
    return [];
  }
};

export const getAllUsers = getStoredUsers;

export const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    let user: User = JSON.parse(raw);

    // Clean name if needed
    if (user.name && user.name.includes('(المدير)')) {
      user.name = user.name.replace('(المدير)', '').trim();
    }
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.status = 'active';
      user.role = 'admin';
    }

    // Refresh from DB to get latest role and status
    const allUsers = getStoredUsers();
    const freshUser = allUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
    
    if (freshUser) {
      if (freshUser.status === 'suspended') {
        localStorage.removeItem(STORAGE_KEY_USER);
        return null;
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
    // Ensure active status and clean name
    if (user.name && user.name.includes('(المدير)')) {
      user.name = user.name.replace('(المدير)', '').trim();
    }
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.status = 'active';
      user.role = 'admin';
    }
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

export const loginWithGoogle = (googleProfile: {
  email: string;
  name: string;
  avatar?: string;
  sub?: string;
}): { success: boolean; user?: User; message: string } => {
  const cleanEmail = googleProfile.email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === ADMIN_EMAIL.toLowerCase();
  const users = getStoredUsers();

  let user = users.find(u => u.email.toLowerCase() === cleanEmail);

  let cleanName = (googleProfile.name || cleanEmail.split('@')[0]).replace('(المدير)', '').trim();

  if (user) {
    if (user.status === 'suspended' && !isAdminEmail) {
      return { success: false, message: 'تم إيقاف هذا الحساب من قبل الإدارة.' };
    }
    // Update profile info
    if (cleanName && (!user.name || user.name === 'User' || user.name.includes('(المدير)'))) {
      user.name = cleanName;
    }
    if (googleProfile.avatar) user.avatar = googleProfile.avatar;
    if (isAdminEmail) {
      user.role = 'admin';
      user.status = 'active';
    }
    user.authProvider = 'google';
    user.lastLoginAt = new Date().toISOString();
    updateUserInDb(user);
    setCurrentUser(user);
    return { success: true, user, message: `مرحباً بعودتك ${user.name}` };
  }

  // Create new user with Google
  const newUser: User = {
    id: 'usr_g_' + Math.random().toString(36).substring(2, 10),
    email: cleanEmail,
    name: cleanName,
    avatar: googleProfile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName || 'User')}`,
    dob: '',
    phone: '',
    authProvider: 'google',
    role: isAdminEmail ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    theme: 'default-light',
    savedAssets: { template: null, stamp: null, signature: null }
  };

  updateUserInDb(newUser);
  setCurrentUser(newUser);
  return { success: true, user: newUser, message: `تم تسجيل الدخول بنجاح! مرحباً ${newUser.name}` };
};

export const addUserByAdmin = (userData: {
  email: string;
  name: string;
  phone?: string;
  dob?: string;
  role?: 'admin' | 'user';
}): { success: boolean; user?: User; message: string } => {
  const cleanEmail = userData.email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === ADMIN_EMAIL.toLowerCase();

  const users = getStoredUsers();
  if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'هذا البريد الإلكتروني مسجل مسبقاً في النظام' };
  }

  const cleanName = userData.name.trim().replace('(المدير)', '').trim();

  const newUser: User = {
    id: 'usr_g_' + Math.random().toString(36).substring(2, 10),
    email: cleanEmail,
    name: cleanName,
    phone: userData.phone?.trim() || '',
    dob: userData.dob || '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    authProvider: 'google',
    role: isAdminEmail ? 'admin' : (userData.role || 'user'),
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    theme: 'default-light',
    savedAssets: { template: null, stamp: null, signature: null }
  };

  users.push(newUser);
  saveStoredUsers(users);
  return { success: true, user: newUser, message: 'تم إضافة المستخدم بنجاح' };
};

export const deleteUserByAdmin = (userId: string): boolean => {
  const users = getStoredUsers();
  const userToDelete = users.find(u => u.id === userId);
  if (!userToDelete || userToDelete.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return false;
  }
  const filtered = users.filter(u => u.id !== userId);
  saveStoredUsers(filtered);
  return true;
};

export const toggleUserStatus = (userId: string): { success: boolean; newStatus?: 'active' | 'suspended' } => {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { success: false };
  }
  user.status = user.status === 'active' ? 'suspended' : 'active';
  saveStoredUsers(users);
  return { success: true, newStatus: user.status };
};

export const canUserProcessFile = (user: User | null): { allowed: boolean; reason?: string } => {
  if (!user) return { allowed: false, reason: 'يجب تسجيل الدخول لمتابعة المعالجة' };
  if (user.status === 'suspended') return { allowed: false, reason: 'حسابك موقوف، تواصل مع الإدارة' };
  return { allowed: true };
};

export const getSystemStats = (): SystemStats => {
  const users = getStoredUsers();
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    googleUsers: users.filter(u => u.authProvider === 'google').length
  };
};
