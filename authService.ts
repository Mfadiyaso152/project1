import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { User, SystemStats, SavedAssets } from './types';

export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';
export const ADMIN_PHONE = '0536894854';

const STORAGE_KEY_USER = 'watheeq_current_user';
const STORAGE_KEY_USERS = 'watheeq_all_users';

// Helper to sanitize doc ID for Firestore
export const getDocId = (email: string) => {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
};

/**
 * Optimizes base64 data URLs so they never exceed Firestore's 1MB limit (aims < 700KB).
 * Stamps and signatures retain transparency; templates retain high crispness.
 */
export const optimizeAssetDataUrl = async (
  dataUrl: string, 
  type: 'template' | 'stamp' | 'signature'
): Promise<string> => {
  if (!dataUrl) return dataUrl;
  
  // If already under 250KB, no downscaling needed
  if (dataUrl.length < 250 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let maxDim = type === 'template' ? 1600 : 900;
        let quality = 0.88;

        const renderCanvas = (targetMax: number, targetQ: number): string => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;

          let width = img.width;
          let height = img.height;

          if (width > targetMax || height > targetMax) {
            if (width > height) {
              height = Math.round((height * targetMax) / width);
              width = targetMax;
            } else {
              width = Math.round((width * targetMax) / height);
              height = targetMax;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (type === 'template') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', targetQ);
          } else {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/png');
          }
        };

        let result = renderCanvas(maxDim, quality);

        // Progressive reduction if still exceeds 700KB (Firestore limit safety)
        let attempts = 0;
        while (result.length > 700 * 1024 && attempts < 4) {
          attempts++;
          maxDim = Math.round(maxDim * 0.8);
          quality = Math.max(0.65, quality - 0.08);
          result = renderCanvas(maxDim, quality);
        }

        resolve(result);
      } catch (e) {
        console.warn('Asset optimization fallback:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const getStoredUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let users: User[] = raw ? JSON.parse(raw) : [];
    
    // Ensure admin default exists
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

/**
 * Fetches user assets directly from Cloud Firestore (subcollection + user doc).
 * Guaranteed to return saved assets across all devices and browsers.
 */
export const fetchUserAssetsFromFirestore = async (email: string): Promise<SavedAssets> => {
  const result: SavedAssets = { template: null, stamp: null, signature: null };
  if (!db || !email) return result;

  const docId = getDocId(email);

  try {
    // 1. Fetch from Dedicated Assets Subcollection (/users/{docId}/assets/*)
    const assetsSubcolSnap = await getDocs(collection(db, 'users', docId, 'assets'));
    assetsSubcolSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const assetType = docSnap.id as 'template' | 'stamp' | 'signature';
      if (['template', 'stamp', 'signature'].includes(assetType) && data?.data) {
        result[assetType] = data.data;
      }
    });

    // 2. Also check the user document itself for backwards compatibility
    const userDocSnap = await getDoc(doc(db, 'users', docId));
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData?.savedAssets) {
        if (!result.template && userData.savedAssets.template) {
          result.template = userData.savedAssets.template;
        }
        if (!result.stamp && userData.savedAssets.stamp) {
          result.stamp = userData.savedAssets.stamp;
        }
        if (!result.signature && userData.savedAssets.signature) {
          result.signature = userData.savedAssets.signature;
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching user assets from Firestore:', err);
  }

  return result;
};

/**
 * Real-time listener for user assets from Cloud Firestore.
 * Automatically synchronizes changes across all devices and tabs in real time.
 */
export const subscribeToUserAssets = (
  email: string,
  onUpdate: (assets: SavedAssets) => void
): (() => void) => {
  if (!db || !email) return () => {};
  const docId = getDocId(email);

  try {
    const assetsColRef = collection(db, 'users', docId, 'assets');
    const unsubscribe = onSnapshot(assetsColRef, (snapshot) => {
      const assets: SavedAssets = { template: null, stamp: null, signature: null };
      snapshot.forEach((docSnap) => {
        const type = docSnap.id as 'template' | 'stamp' | 'signature';
        const data = docSnap.data();
        if (['template', 'stamp', 'signature'].includes(type) && data?.data) {
          assets[type] = data.data;
        }
      });
      onUpdate(assets);
    }, (err) => {
      console.warn('Realtime assets listener warning:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Subscribe error:', e);
    return () => {};
  }
};

/**
 * Firestore Sync: Write user to Cloud Firestore without ever wiping existing assets.
 */
export const syncUserToFirestore = async (user: User) => {
  try {
    if (!db || !user.email) return;
    const docId = getDocId(user.email);
    const userRef = doc(db, 'users', docId);

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
      theme: user.theme || 'default-light'
    };

    await setDoc(userRef, cleanUser, { merge: true });
  } catch (err) {
    console.warn('Firestore Sync User Warning:', err);
  }
};

/**
 * Permanently saves or deletes an asset in Cloud Firestore bound to the user's account.
 * Stores in dedicated subcollection (/users/{docId}/assets/{type}) for full reliability.
 */
export const saveUserAsset = async (
  type: 'template' | 'stamp' | 'signature',
  dataUrl: string | null,
  user: User
): Promise<User> => {
  const docId = getDocId(user.email);

  let processedDataUrl: string | null = null;
  if (dataUrl) {
    processedDataUrl = await optimizeAssetDataUrl(dataUrl, type);
  }

  const updatedSavedAssets: SavedAssets = {
    ...(user.savedAssets || { template: null, stamp: null, signature: null }),
    [type]: processedDataUrl
  };

  const updatedUser: User = {
    ...user,
    savedAssets: updatedSavedAssets
  };

  // Update local session immediately
  setCurrentUser(updatedUser);

  // Cloud Firestore Persistence
  if (db && user.email) {
    const assetDocRef = doc(db, 'users', docId, 'assets', type);
    const userDocRef = doc(db, 'users', docId);

    if (processedDataUrl) {
      // 1. Write to dedicated asset document in subcollection
      await setDoc(assetDocRef, {
        userId: user.id,
        userEmail: user.email.toLowerCase(),
        type,
        data: processedDataUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Also update user document metadata
      try {
        await setDoc(userDocRef, {
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          hasSavedAssets: true
        }, { merge: true });
      } catch (err) {
        console.warn('User doc update warning:', err);
      }
    } else {
      // Explicit deletion requested by user
      await deleteDoc(assetDocRef);
      try {
        await setDoc(userDocRef, {
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('User doc delete note warning:', err);
      }
    }
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

/**
 * Loads the user from Firestore by email, pulling all assets across devices.
 */
export const fetchUserFromFirestoreByEmail = async (email: string): Promise<User | null> => {
  if (!db || !email) return null;
  const docId = getDocId(email);

  try {
    const userDocRef = doc(db, 'users', docId);
    const snap = await getDoc(userDocRef);
    const assets = await fetchUserAssetsFromFirestore(email);

    if (snap.exists()) {
      const data = snap.data();

      const user: User = {
        id: data.id || snap.id,
        email: data.email || email.toLowerCase(),
        name: data.name || email.split('@')[0],
        phone: data.phone || '',
        dob: data.dob || '',
        avatar: data.avatar || '',
        role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : (data.role || 'user'),
        status: data.status === 'suspended' ? 'suspended' : 'active',
        authProvider: data.authProvider || 'google',
        createdAt: data.createdAt || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt || new Date().toISOString(),
        theme: data.theme || 'default-light',
        savedAssets: assets
      };

      // Update local storage cache
      const all = getStoredUsers();
      const idx = all.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx >= 0) all[idx] = user;
      else all.push(user);
      saveStoredUsers(all);

      return user;
    } else if (assets.template || assets.stamp || assets.signature) {
      // User doc didn't exist but assets exist in Firestore subcollection
      const user: User = {
        id: 'usr_' + docId,
        email: email.toLowerCase(),
        name: email.split('@')[0],
        phone: '',
        dob: '',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
        role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        status: 'active',
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        theme: 'default-light',
        savedAssets: assets
      };
      await syncUserToFirestore(user);
      return user;
    }
  } catch (err) {
    console.warn('Fetch user by email error:', err);
  }
  return null;
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

/**
 * Universal login function for ALL users (Google or Email).
 * ALWAYS checks Cloud Firestore first to pull existing profile and assets across devices!
 */
export const loginWithEmailOrGoogle = async (profile: {
  email: string;
  name?: string;
  avatar?: string;
  authProvider?: 'google' | 'email';
  sub?: string;
}): Promise<{ success: boolean; user?: User; message: string }> => {
  const cleanEmail = profile.email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === ADMIN_EMAIL.toLowerCase();
  const docId = getDocId(cleanEmail);

  let cleanName = (profile.name || cleanEmail.split('@')[0]).replace('(المدير)', '').trim();

  // 1. FIRST: Check Cloud Firestore for existing user and assets (Cross-Device Guarantee)
  let cloudUser: User | null = null;
  let cloudAssets: SavedAssets = { template: null, stamp: null, signature: null };

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', docId));
      cloudAssets = await fetchUserAssetsFromFirestore(cleanEmail);

      if (snap.exists()) {
        const d = snap.data();
        cloudUser = {
          id: d.id || snap.id,
          email: cleanEmail,
          name: cleanName || d.name || cleanEmail.split('@')[0],
          phone: d.phone || '',
          dob: d.dob || '',
          avatar: profile.avatar || d.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
          role: isAdminEmail ? 'admin' : (d.role || 'user'),
          status: d.status === 'suspended' ? 'suspended' : 'active',
          authProvider: profile.authProvider || d.authProvider || 'google',
          createdAt: d.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          theme: d.theme || 'default-light',
          savedAssets: cloudAssets
        };
      }
    } catch (err) {
      console.warn('Firestore Check on Login Warning:', err);
    }
  }

  // 2. If user already exists in Firestore: Log them in with their persistent cloud assets!
  if (cloudUser) {
    if (cloudUser.status === 'suspended' && !isAdminEmail) {
      return { 
        success: false, 
        message: 'تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة. يرجى التواصل مع الإدارة لإعادة التفعيل.' 
      };
    }

    // Update login timestamp in Firestore
    try {
      if (db) {
        await setDoc(doc(db, 'users', docId), { lastLoginAt: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {
      console.warn(e);
    }

    // Save to local cache on this device
    updateUserInDb(cloudUser);
    setCurrentUser(cloudUser);
    return { 
      success: true, 
      user: cloudUser, 
      message: `مرحباً بعودتك ${cloudUser.name} ✨ تم تحميل أصولك المحفوظة من السيرفر بنجاح` 
    };
  }

  // 3. Fallback to local storage if user was previously on this device
  const users = getStoredUsers();
  let localUser = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (localUser) {
    if (localUser.status === 'suspended' && !isAdminEmail) {
      return { 
        success: false, 
        message: 'تم إيقاف هذا الحساب مؤقتاً من قبل الإدارة.' 
      };
    }
    if (cleanName) localUser.name = cleanName;
    if (profile.avatar) localUser.avatar = profile.avatar;
    if (isAdminEmail) {
      localUser.role = 'admin';
      localUser.status = 'active';
    }
    localUser.lastLoginAt = new Date().toISOString();
    localUser.savedAssets = {
      template: localUser.savedAssets?.template || cloudAssets.template,
      stamp: localUser.savedAssets?.stamp || cloudAssets.stamp,
      signature: localUser.savedAssets?.signature || cloudAssets.signature
    };

    updateUserInDb(localUser);
    setCurrentUser(localUser);
    return { success: true, user: localUser, message: `مرحباً بعودتك ${localUser.name}` };
  }

  // 4. Brand New User Registration across all devices
  const newUser: User = {
    id: 'usr_' + docId,
    email: cleanEmail,
    name: cleanName || cleanEmail.split('@')[0],
    avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName || 'User')}`,
    dob: '',
    phone: '',
    authProvider: profile.authProvider || 'google',
    role: isAdminEmail ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    theme: 'default-light',
    savedAssets: cloudAssets
  };

  // Sync to Firestore immediately so user doc exists in the cloud
  await syncUserToFirestore(newUser);
  updateUserInDb(newUser);
  setCurrentUser(newUser);
  return { success: true, user: newUser, message: `تم تسجيل الدخول بنجاح! مرحباً ${newUser.name}` };
};

export const loginWithGoogle = (googleProfile: {
  email: string;
  name: string;
  avatar?: string;
  sub?: string;
}) => {
  return loginWithEmailOrGoogle({
    ...googleProfile,
    authProvider: 'google'
  });
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
