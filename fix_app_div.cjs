const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const target = `              >
                المتابعة للدمج
                <ArrowLeft size={20} />
              </button>
          </div>
        )}`;
        
const replace = `              >
                المتابعة للدمج
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        )}`;

code = code.replace(target, replace);
fs.writeFileSync('App.tsx', code);
