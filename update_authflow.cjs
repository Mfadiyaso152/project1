const fs = require('fs');
let code = fs.readFileSync('components/AuthFlow.tsx', 'utf-8');

// Remove dark classes
code = code.replace(/dark:[^\s"']+/g, '');

// Add confirm password state
code = code.replace(
  "const [password, setPassword] = useState('');",
  "const [password, setPassword] = useState('');\n  const [confirmPassword, setConfirmPassword] = useState('');"
);

// Update handleRegisterBasic
code = code.replace(
  "if (!email || !password) {\n      setError('الرجاء إدخال البريد وكلمة المرور');\n      return;\n    }",
  "if (!email || !password || !confirmPassword) {\n      setError('الرجاء إدخال جميع البيانات');\n      return;\n    }\n    if (password !== confirmPassword) {\n      setError('كلمتا المرور غير متطابقتين');\n      return;\n    }"
);

// Add confirm password input and replace admin@example.com placeholder
code = code.replace(
  `placeholder="admin@example.com"`,
  `placeholder="email@example.com"`
);

const confirmPasswordHtml = `
            {mode === 'register' && (
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pr-10 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                  <Lock size={18} className="absolute right-3 top-3 text-slate-400" />
                </div>
              </div>
            )}
`;
code = code.replace(
  `                <Lock size={18} className="absolute right-3 top-3 text-slate-400  " />
              </div>
            </div>`,
  `                <Lock size={18} className="absolute right-3 top-3 text-slate-400  " />
              </div>
            </div>` + confirmPasswordHtml
);

// Add Prices to plans
code = code.replace(
  `              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900  mb-2">الباقة الأساسية Basic</h3>
              </div>`,
  `              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900  mb-2">الباقة الأساسية Basic</h3>
                <p className="text-2xl font-black text-slate-900">25 <span className="text-sm text-slate-500 font-normal">ريال / شهر</span></p>
              </div>`
);

code = code.replace(
  `              <div className="mb-6">
                <h3 className="text-xl font-bold text-teal-600  mb-2">الباقة الاحترافية Pro</h3>
              </div>`,
  `              <div className="mb-6">
                <h3 className="text-xl font-bold text-teal-600  mb-2">الباقة الاحترافية Pro</h3>
                <p className="text-2xl font-black text-teal-700">35 <span className="text-sm text-teal-600/70 font-normal">ريال / شهر</span></p>
              </div>`
);

// Add Forgot Password link
const forgotPasswordLink = `
          {mode === 'login' && (
            <div className="mt-4 text-center">
              <a href="https://wa.me/966536894854?text=نسيت%20كلمة%20المرور" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-teal-600 hover:underline">
                نسيت كلمة المرور؟ تواصل مع الدعم
              </a>
            </div>
          )}
`;
code = code.replace(
  `</button>
          </form>

          <div className="mt-8 text-center text-sm">`,
  `</button>
          </form>` + forgotPasswordLink + `
          <div className="mt-8 text-center text-sm">`
);

fs.writeFileSync('components/AuthFlow.tsx', code);
