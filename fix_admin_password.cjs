const fs = require('fs');
let code = fs.readFileSync('authService.ts', 'utf-8');

code = code.replace(
  "export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';",
  "export const ADMIN_EMAIL = 'mfb.15.f@gmail.com';\nexport const ADMIN_PASSWORD = 'Mfadiyaso15';"
);

code = code.replace(
  "const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();\n  const users = getStoredUsers();",
  "const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();\n  if (isAdmin && passwordHash !== ADMIN_PASSWORD) {\n    return { success: false, message: 'كلمة المرور الخاصة بالمدير غير صحيحة' };\n  }\n  const users = getStoredUsers();"
);

code = code.replace(
  "const user = users.find(u => u.email === cleanEmail && u.passwordHash === passwordHash);",
  "let user = users.find(u => u.email === cleanEmail && u.passwordHash === passwordHash);\n  if (!user && cleanEmail === ADMIN_EMAIL.toLowerCase() && passwordHash === ADMIN_PASSWORD) {\n    // Auto-create admin if they don't exist but typed right password\n    return registerUser(email, passwordHash, 'محمد', '0536894854', '', 'pro');\n  }"
);

fs.writeFileSync('authService.ts', code);
