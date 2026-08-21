const fs = require('fs');
let code = fs.readFileSync('authService.ts', 'utf-8');

const loginRegex = /export const loginUser = \[\s\S\]*?return \{ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' \};\n\};/m;

const newLogin = `export const loginUser = (email: string, passwordHash: string): { success: boolean; user?: User; message: string } => {
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
};`;

code = code.replace(/export const loginUser = [\s\S]*?(?=export const registerUser)/, newLogin + "\n\n");

fs.writeFileSync('authService.ts', code);
