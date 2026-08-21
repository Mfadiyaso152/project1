const fs = require('fs');
let code = fs.readFileSync('components/AuthFlow.tsx', 'utf-8');

code = code.replace(
  'const user = loginUser(email, password);\n      if (user) {\n        onSuccess(user);\n      } else',
  'const res = loginUser(email, password);\n      if (res.success && res.user) {\n        onSuccess(res.user);\n      } else'
);

code = code.replace(
  'const user = registerUser(email, password, name, phone, dob, plan);\n      setTempUser(user);\n      setMode(\'pending\');',
  `const res = registerUser(email, password, name, phone, dob, plan);\n      if (res.success && res.user) {\n        setTempUser(res.user);\n        setMode('pending');\n      } else {\n        setError(res.message);\n      }`
);

fs.writeFileSync('components/AuthFlow.tsx', code);
