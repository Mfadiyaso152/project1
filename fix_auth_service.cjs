const fs = require('fs');
let code = fs.readFileSync('authService.ts', 'utf-8');

// Add getAllUsers
if (!code.includes('export const getAllUsers')) {
  code += `\nexport const getAllUsers = (): User[] => getStoredUsers();\n`;
}

// Rename loginWithEmail to loginUser, or alias it
if (!code.includes('export const loginUser =')) {
  code = code.replace('export const loginWithEmail = (email: string, passwordHash: string)', 'export const loginUser = (email: string, passwordHash: string)');
}

// Fix registerUser signature
if (code.includes('export const registerUser = (email: string, passwordHash: string)')) {
  code = code.replace(
    'export const registerUser = (email: string, passwordHash: string):',
    'export const registerUser = (email: string, passwordHash: string, name?: string, phone?: string, dob?: string, plan?: "basic" | "pro"): '
  );
  code = code.replace(
    'name: isAdmin ? \'محمد\' : \'\',',
    'name: isAdmin ? \'محمد\' : (name || \'\'),'
  );
  code = code.replace(
    'dob: \'\',',
    'dob: dob || \'\','
  );
  code = code.replace(
    'phone: \'\',',
    'phone: phone || \'\','
  );
  code = code.replace(
    'plan: isAdmin ? \'pro\' : null,',
    'plan: isAdmin ? \'pro\' : (plan || null),'
  );
  // Remove the old createSubscriptionRequest logic if registerUser does it
  // Actually, we want to create a request for non-admins immediately if a plan is selected
  code = code.replace(
    'setCurrentUser(newUser);\n  return { success: true',
    `setCurrentUser(newUser);\n  if (!isAdmin && plan) { createSubscriptionRequest(newUser, plan); }\n  return { success: true`
  );
}

fs.writeFileSync('authService.ts', code);
