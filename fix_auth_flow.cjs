const fs = require('fs');
let code = fs.readFileSync('components/AuthFlow.tsx', 'utf-8');

code = code.replace(
  "if (res.success && res.user) {\n        onSuccess(res.user);\n      } else {\n        setError('بيانات الدخول غير صحيحة');\n      }",
  "if (res.success && res.user) {\n        onSuccess(res.user);\n      } else {\n        setError(res.message || 'بيانات الدخول غير صحيحة');\n      }"
);

fs.writeFileSync('components/AuthFlow.tsx', code);
