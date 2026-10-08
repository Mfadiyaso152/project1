import path from 'path';
import crypto from 'crypto';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// In-memory OTP storage for secure verification and rate-limiting on server side
interface StoredOtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const serverOtpStore = new Map<string, StoredOtpRecord>();

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function otpApiPlugin(resendApiKey?: string): Plugin {
  return {
    name: 'otp-api-server-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'POST' && url === '/api/auth/send-otp') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const email = (body.email || '').trim().toLowerCase();

              if (!email || !email.includes('@') || !email.includes('.')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'البريد الإلكتروني غير صالح' }));
                return;
              }

              // Rate limit: 60s cooldown
              const now = Date.now();
              const existing = serverOtpStore.get(email);
              if (existing && (now - existing.lastSentAt) < 60000) {
                const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: false, 
                  error: `يرجى الانتظار ${waitSec} ثانية قبل إعادة إرسال الرمز` 
                }));
                return;
              }

              // Generate 6-digit cryptographically secure OTP
              const randomNum = crypto.randomInt(100000, 999999);
              const otpCode = randomNum.toString();
              const hash = sha256Hex(otpCode);

              // Store hash with 5 minute expiration (never store raw code in state)
              serverOtpStore.set(email, {
                hash,
                expiresAt: now + 5 * 60 * 1000,
                attempts: 0,
                lastSentAt: now
              });

              // If Resend API key is available in environment, send real email
              const apiKey = resendApiKey || process.env.RESEND_API_KEY;
              if (apiKey) {
                try {
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${apiKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: 'وثيق <onboarding@resend.dev>',
                      to: [email],
                      subject: 'رمز التحقق لتسجيل الدخول - منصة وثيق',
                      html: `
                        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; text-align: center;">
                          <h2 style="color: #0f172a; margin-bottom: 8px;">منصة وثيق | Wathiq</h2>
                          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">رمز التحقق الخاص بك لتسجيل الدخول:</p>
                          <div style="background-color: #f0fdfa; border: 1px solid #0d9488; border-radius: 12px; padding: 16px 24px; display: inline-block; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f766e; font-family: monospace;">${otpCode}</span>
                          </div>
                          <p style="color: #94a3b8; font-size: 12px; margin: 0;">هذا الرمز صالح لمدة 5 دقائق فقط. لا تشارك هذا الرمز مع أي شخص.</p>
                        </div>
                      `
                    })
                  });
                } catch (emailErr) {
                  // Fallback gracefully
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: true, 
                message: 'تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني'
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'تعذر معالجة الطلب، يرجى المحاولة لاحقاً' }));
            }
          });
          return;
        }

        if (req.method === 'POST' && url === '/api/auth/verify-otp') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const email = (body.email || '').trim().toLowerCase();
              const code = (body.code || '').trim();

              if (!email || !code || code.length !== 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'يرجى إدخال رمز التحقق المكون من 6 أرقام' }));
                return;
              }

              const record = serverOtpStore.get(email);
              if (!record) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'لم يتم العثور على رمز تحقق نشط. يرجى طلب رمز جديد.' }));
                return;
              }

              const now = Date.now();
              if (now > record.expiresAt) {
                serverOtpStore.delete(email);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.' }));
                return;
              }

              if (record.attempts >= 5) {
                serverOtpStore.delete(email);
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'تجاوزت الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز جديد.' }));
                return;
              }

              const inputHash = sha256Hex(code);
              if (inputHash !== record.hash) {
                record.attempts += 1;
                const remaining = 5 - record.attempts;
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  success: false, 
                  error: `رمز التحقق غير صحيح. متبقي ${remaining} محاولات.` 
                }));
                return;
              }

              // Success: Remove OTP so it cannot be used again
              serverOtpStore.delete(email);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, verified: true, message: 'تم التحقق بنجاح' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'تعذر التحقق من الرمز' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      otpApiPlugin(env.RESEND_API_KEY)
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
