import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { User, SystemStats } from './types';

export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';
export const ADMIN_PHONE = '0536894854';

const STORAGE_KEY_USER = 'watheeq_current_user';
const STORAGE_KEY_USERS = 'watheeq_all_users';

// Helper to sanitize doc ID for Firestore
const getDocId = (email: string) => {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
};

export const getStoredUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let users: User[] = raw ? JSON.parse(raw) : [];
    
    // Ensure admin always exists
    const adminExists = users.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!adminExists) {
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
      users.unshift(initialAdmin);
      syncUserToFirestore(initialAdmin);
    }

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

    // Filter out any demo / sample users
    const filteredUsers = users.filter(u => {
      const email = u.email?.toLowerCase() || '';
      const name = u.name || '';
      return !email.includes('sample') && !email.includes('demo') && !name.includes('تجرب');
    });

    if (filteredUsers.length !== users.length || changed) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filteredUsers));
    }
    return filteredUsers;
  } catch {
    return [];
  }
};

export const getAllUsers = getStoredUsers;

export const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
};

// Firestore Sync: Write user to Cloud Firestore
export const syncUserToFirestore = async (user: User) => {
  try {
    if (!db || !user.email) return;
    const docId = getDocId(user.email);
    const userRef = doc(db, 'users', docId);
    
    // Clean user object for Firestore (ensure no undefined fields)
    const cleanUser: any = {
      id: user.id || 'usr_' + docId,
      email: user.email.toLowerCase(),
      name: user.name || user.email.split('@')[0],
      role: user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : (user.role || 'user'),
      status: user.status || 'active',
      authProvider: user.authProvider || 'google',
      avatar: user.avatar || '',
      phone: user.phone || '',
      dob: user.dob || '',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt || new Date().toISOString(),
      theme: user.theme || 'default-light',
      savedAssets: user.savedAssets || { template: null, stamp: null, signature: null }
    };

    await setDoc(userRef, cleanUser, { merge: true });
  } catch (err) {
    console.warn('Firestore Sync User Warning:', err);
  }
};

export const saveUserAsset = async (
  type: 'template' | 'stamp' | 'signature',
  dataUrl: string | null,
  user: User
): Promise<User> => {
  const updatedUser: User = {
    ...user,
    savedAssets: {
      ...(user.savedAssets || { template: null, stamp: null, signature: null }),
      [type]: dataUrl
    }
  };
  setCurrentUser(updatedUser);
  try {
    await syncUserToFirestore(updatedUser);
  } catch (err) {
    console.warn('Firestore direct sync error:', err);
  }
  return updatedUser;
};

export const getUserAsset = (
  type: 'template' | 'stamp' | 'signature',
  user: User | null
): string | null => {
  if (!user || !user.savedAssets) return null;
  return user.savedAssets[type] || null;
};

// Firestore Fetch: Load all users from Cloud Firestore & merge
export const fetchUsersFromFirestore = async (): Promise<User[]> => {
  try {
    if (!db) return getStoredUsers();
    const querySnapshot = await getDocs(collection(db, 'users'));
    const firestoreUsers: User[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (data && data.email) {
        firestoreUsers.push({
          id: data.id || docSnap.id,
          email: data.email,
          name: data.name || data.email.split('@')[0],
          phone: data.phone || '',
          dob: data.dob || '',
          avatar: data.avatar || '',
          role: data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : (data.role || 'user'),
          status: data.status === 'suspended' ? 'suspended' : 'active',
          authProvider: data.authProvider || 'google',
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt || new Date().toISOString(),
          theme: data.theme || 'default-light',
          savedAssets: data.savedAssets || { template: null, stamp: null, signature: null }
        });
      }
    });

    if (firestoreUsers.length > 0) {
      // Merge with local users
      const localUsers = getStoredUsers();
      const mergedMap = new Map<string, User>();
      
      localUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
      firestoreUsers.forEach(u => {
        const existing = mergedMap.get(u.email.toLowerCase());
        mergedMap.set(u.email.toLowerCase(), {
          ...u,
          savedAssets: existing?.savedAssets || u.savedAssets
        });
      });

      const mergedList = Array.from(mergedMap.values());
      saveStoredUsers(mergedList);
      return mergedList;
    }
  } catch (err) {
    console.warn('Firestore Fetch Users Warning:', err);
  }
  return getStoredUsers();
};

// Real-time Firestore subscription for Admin
export const subscribeToUsers = (onUpdate: (users: User[]) => void) => {
  try {
    if (!db) {
      onUpdate(getStoredUsers());
      return () => {};
    }
    
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const firestoreUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data && data.email) {
            firestoreUsers.push({
              id: data.id || docSnap.id,
              email: data.email,
              name: data.name || data.email.split('@')[0],
              phone: data.phone || '',
              dob: data.dob || '',
              avatar: data.avatar || '',
              role: data.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : (data.role || 'user'),
              status: data.status === 'suspended' ? 'suspended' : 'active',
              authProvider: data.authProvider || 'google',
              createdAt: data.createdAt || new Date().toISOString(),
              lastLoginAt: data.lastLoginAt || new Date().toISOString(),
              theme: data.theme || 'default-light',
              savedAssets: data.savedAssets || { template: null, stamp: null, signature: null }
            });
          }
        });

        if (firestoreUsers.length > 0) {
          const localUsers = getStoredUsers();
          const mergedMap = new Map<string, User>();
          localUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
          firestoreUsers.forEach(u => {
            const existing = mergedMap.get(u.email.toLowerCase());
            mergedMap.set(u.email.toLowerCase(), {
              ...u,
              savedAssets: existing?.savedAssets || u.savedAssets
            });
          });
          const mergedList = Array.from(mergedMap.values());
          saveStoredUsers(mergedList);
          onUpdate(mergedList);
        } else {
          onUpdate(getStoredUsers());
        }
      },
      (error) => {
        console.warn('Firestore Subscription Error:', error);
        onUpdate(getStoredUsers());
      }
    );

    return unsubscribe;
  } catch {
    onUpdate(getStoredUsers());
    return () => {};
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    let user: User = JSON.parse(raw);

    if (user.name && user.name.includes('(المدير)')) {
      user.name = user.name.replace('(المدير)', '').trim();
    }
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      user.status = 'active';
      user.role = 'admin';
    }

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
  syncUserToFirestore(user);
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
      return { 
        success: false, 
        message: 'تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة. يرجى التواصل مع الإدارة لإعادة التفعيل.' 
      };
    }
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

export const deleteUserByAdmin = async (userId: string): Promise<boolean> => {
  const users = getStoredUsers();
  const target = userId.trim().toLowerCase();
  const userToDelete = users.find(u => 
    u.id === userId || 
    u.email.toLowerCase() === target || 
    getDocId(u.email) === target ||
    u.id.toLowerCase() === target
  );
  
  if (!userToDelete || userToDelete.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return false;
  }
  
  const filtered = users.filter(u => u.id !== userToDelete.id && u.email.toLowerCase() !== userToDelete.email.toLowerCase());
  saveStoredUsers(filtered);

  try {
    if (db && userToDelete.email) {
      const docId = getDocId(userToDelete.email);
      await deleteDoc(doc(db, 'users', docId));
    }
  } catch (err) {
    console.warn('Delete user from Firestore warning:', err);
  }
  return true;
};

// Toggle user suspension (Temporary Account Suspension / Re-activation)
export const toggleUserStatus = async (userId: string): Promise<{ success: boolean; newStatus?: 'active' | 'suspended' }> => {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return { success: false };
  }
  
  user.status = user.status === 'active' ? 'suspended' : 'active';
  saveStoredUsers(users);

  try {
    if (db && user.email) {
      const docId = getDocId(user.email);
      await updateDoc(doc(db, 'users', docId), { status: user.status });
    }
  } catch (err) {
    console.warn('Update user status in Firestore warning:', err);
  }

  return { success: true, newStatus: user.status };
};

export const canUserProcessFile = (user: User | null): { allowed: boolean; reason?: string } => {
  if (!user) return { allowed: false, reason: 'يجب تسجيل الدخول لمتابعة المعالجة' };
  if (user.status === 'suspended') return { allowed: false, reason: 'تم إيقاف حسابك مؤقتاً من قِبل الإدارة، يرجى التواصل مع الإدارة لإعادة التفعيل' };
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
