const fs = require('fs');

// 1. Update BottomNav.tsx to be floating and fully rounded (pill shape)
let bottomNav = fs.readFileSync('components/BottomNav.tsx', 'utf-8');
bottomNav = bottomNav.replace(
  'className={`fixed bottom-0 left-0 right-0 z-40 ${bgClass} pb-safe`}',
  'className={`fixed bottom-6 left-6 right-6 z-40 ${bgClass} rounded-full shadow-2xl max-w-lg mx-auto overflow-hidden`}'
);
fs.writeFileSync('components/BottomNav.tsx', bottomNav);

// 2. Update all .toLocaleDateString('ar-SA') to Gregorian (e.g. en-GB or en-CA or formatted ISO date)
const filesToUpdateDate = [
  'components/AccountView.tsx',
  'components/AdminViews.tsx',
  'authService.ts',
  'App.tsx'
];

filesToUpdateDate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    // Replace ar-SA with en-GB or format date to Gregorian
    content = content.replace(/\.toLocaleDateString\('ar-SA'\)/g, ".toLocaleDateString('en-GB')");
    content = content.replace(/\.toLocaleDateString\("ar-SA"\)/g, '.toLocaleDateString("en-GB")');
    fs.writeFileSync(file, content);
  }
});

// Also check components directory files
const compFiles = fs.readdirSync('components');
compFiles.forEach(f => {
  const filePath = 'components/' + f;
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('ar-SA')) {
    content = content.replace(/\.toLocaleDateString\('ar-SA'\)/g, ".toLocaleDateString('en-GB')");
    content = content.replace(/\.toLocaleDateString\("ar-SA"\)/g, '.toLocaleDateString("en-GB")');
    fs.writeFileSync(filePath, content);
  }
});

// 3. Update authService.ts for confirmRequestAndAddRevenue not to activate user directly, and add cancel request / redeemed codes history
let auth = fs.readFileSync('authService.ts', 'utf-8');

// Update User type / interface if needed in types.ts
let types = fs.readFileSync('types.ts', 'utf-8');
if (!types.includes('redeemedCodesHistory')) {
  types = types.replace(
    'export interface User {',
    'export interface User {\n  redeemedCodesHistory?: Array<{ code: string; plan: string; startDate: string; expiryDate: string }>;'
  );
  fs.writeFileSync('types.ts', types);
}

// Update confirmRequestAndAddRevenue in authService.ts so it ONLY marks request as completed / adds revenue WITHOUT activating user subscription directly
const oldConfirm = `export const confirmRequestAndAddRevenue = (reqId: string) => {
  const requests = getStoredRequests();
  const reqIdx = requests.findIndex(r => r.id === reqId);
  if (reqIdx === -1) return false;
  
  const req = requests[reqIdx];
  if (req.status === 'completed') return false; // Already done
  
  req.status = 'completed';
  saveStoredRequests(requests);
  
  const users = getStoredUsers();
  const userIdx = users.findIndex(u => u.id === req.userId);
  if (userIdx !== -1) {
    const user = users[userIdx];
    const plan = req.plan || 'basic';
    const durationMs = 30 * 24 * 60 * 60 * 1000;
    let baseTime = Date.now();
    
    if (user.subscriptionExpiresAt) {
      const existingExpiry = new Date(user.subscriptionExpiresAt).getTime();
      if (existingExpiry > baseTime) {
        baseTime = existingExpiry;
      }
    }
    
    user.subscriptionStatus = 'active';
    user.plan = plan;
    user.subscriptionExpiresAt = new Date(baseTime + durationMs).toISOString();
    
    saveStoredUsers(users);
    
    // Check if current user is this user
    const current = getCurrentUser();
    if (current && current.id === user.id) {
      setCurrentUser(user);
    }
  }
  
  // Add revenue
  addRevenue(req.plan === 'pro' ? 35 : 25);
  return true;
};`;

const newConfirm = `export const confirmRequestAndAddRevenue = (reqId: string) => {
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
};`;

if (auth.includes('export const confirmRequestAndAddRevenue')) {
  // Replace confirmRequestAndAddRevenue implementation
  const parts = auth.split('export const confirmRequestAndAddRevenue');
  // Find where function ends
  let rest = parts[1];
  let braceCount = 0;
  let endIndex = 0;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '{') braceCount++;
    if (rest[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  auth = parts[0] + newConfirm + rest.substring(endIndex);
  fs.writeFileSync('authService.ts', auth);
}

// Update redeemCodeForUser to record history
let authContent = fs.readFileSync('authService.ts', 'utf-8');
if (!authContent.includes('redeemedCodesHistory')) {
  authContent = authContent.replace(
    'user.subscriptionStatus = \'active\';',
    'if (!user.redeemedCodesHistory) user.redeemedCodesHistory = [];\n  user.redeemedCodesHistory.push({\n    code: targetCode.code,\n    plan,\n    startDate: now.toISOString(),\n    expiryDate: expiryDate.toISOString()\n  });\n  user.subscriptionStatus = \'active\';'
  );
  fs.writeFileSync('authService.ts', authContent);
}

console.log("Base updates applied successfully.");
