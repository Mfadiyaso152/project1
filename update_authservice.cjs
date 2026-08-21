const fs = require('fs');
let code = fs.readFileSync('authService.ts', 'utf-8');

// Add deleteUnusedCodes
code += `\nexport const deleteUnusedCodes = () => {
  const codes = getStoredCodes();
  const filtered = codes.filter(c => c.isUsed);
  saveStoredCodes(filtered);
};\n`;

// Add confirmRequestAndAddRevenue
code += `\nexport const confirmRequestAndAddRevenue = (reqId: string) => {
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
};\n`;

fs.writeFileSync('authService.ts', code);
