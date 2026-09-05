const fs = require('fs');

const files = [
  'components/DocumentationModal.tsx',
  'components/AuthFlow.tsx',
  'components/AccountView.tsx',
  'components/LandingView.tsx',
  'App.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/وترويسة/g, 'وورقة المؤسسة الرسمية');
    content = content.replace(/الترويسة/g, 'الورقة الرسمية');
    content = content.replace(/ترويسة/g, 'ورقة رسمية');
    content = content.replace(/الترويسات/g, 'الأوراق الرسمية');
    content = content.replace(/الترويستك/g, 'أوراقك الرسمية');
    content = content.replace(/وترويستك/g, 'وورقتك الرسمية');
    content = content.replace(/ورقة المؤسسة الرسمية \(الترويسة\)/g, 'ورقة المؤسسة الرسمية');
    content = content.replace(/استخدام الترويسة المحفوظة في حسابي/g, 'استخدام الورقة الرسمية المحفوظة في حسابي');
    content = content.replace(/استخدم الترويسة من السحابة 👑/g, 'استخدم الورقة الرسمية من السحابة 👑');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
