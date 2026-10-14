import React from 'react';
import { Layers, Stamp, PenTool, Download, Upload, Check, FileText, ArrowLeft, Play, User } from 'lucide-react';
import { Logo } from './Logo';
import './wathiq-brand.css';

interface LandingViewProps { onStart: () => void }
const features = [
  { Icon: Layers, title: 'دمج المستندات', text: 'ادمج ملفاتك وصورك وورقة مؤسستك في مستند واحد.' },
  { Icon: PenTool, title: 'الختم والتوقيع', text: 'أضف ختم المؤسسة وتوقيعك، واضبط موضعهما بسهولة.' },
  { Icon: Download, title: 'تصدير PDF', text: 'صدّر مستندك النهائي بصيغة PDF جاهزة للمشاركة.' }
];
const steps = [
  { Icon: Upload, title: 'ارفع ملفاتك', text: 'اختر مستندك وورقة مؤسستك.' },
  { Icon: Stamp, title: 'أضف ختمك وتوقيعك', text: 'استخدم أصولك المحفوظة أو ارسم توقيعك.' },
  { Icon: Download, title: 'صدّر مستندك', text: 'راجع الصفحات وحمّل ملف PDF.' }
];
export const LandingView: React.FC<LandingViewProps> = ({ onStart }) => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
  return (
    <div className="wq-landing" dir="rtl">
      <div className="wq-shell">
        <header className="wq-header">
          <Logo className="wq-logo" imageClassName="wq-logo-image" textSize="wq-logo-text" />
          <nav aria-label="روابط الصفحة" className="wq-nav">
            <button type="button" onClick={() => scrollTo('features')}>المزايا</button>
            <button type="button" onClick={() => scrollTo('how-it-works')}>كيف يعمل</button>
          </nav>
          <button type="button" className="wq-btn wq-login" onClick={onStart}><User size={18}/><span>تسجيل الدخول</span></button>
        </header>
        <main>
          <section className="wq-hero" aria-labelledby="wq-title">
            <div className="wq-copy">
              <h1 id="wq-title">مستنداتك،<br/><span>بثقة.</span></h1>
              <p className="wq-description">ادمج أوراقك، أضف ختمك وتوقيعك،<br className="wq-desktop-break"/> وصدّر مستندك في مكان واحد.</p>
              <div className="wq-actions">
                <button type="button" className="wq-btn wq-primary" onClick={onStart}><FileText size={21}/><span>ابدأ توثيق مستندك</span><ArrowLeft size={18}/></button>
                <button type="button" className="wq-btn wq-secondary" onClick={() => scrollTo('how-it-works')}><Play size={18}/><span>كيف يعمل وثيق؟</span></button>
              </div>
              <div className="wq-chips">{['دمج متعدد الصفحات','أصول محفوظة','تصدير PDF'].map(label => <span key={label}><Check size={14}/>{label}</span>)}</div>
            </div>
            <div className="wq-scene" role="img" aria-label="رسم توضيحي لدمج المستند وإضافة الختم والتوقيع وتصديره">
              <div className="wq-ribbon wq-ribbon-one"/><div className="wq-ribbon wq-ribbon-two"/>
              <div className="wq-paper wq-paper-back"/><div className="wq-paper wq-paper-middle"/>
              <div className="wq-document"><div className="wq-document-title"/><div className="wq-document-image"/>
                <div className="wq-lines">{Array.from({length:8},(_,i)=><i key={i} style={{width: i % 3 === 0 ? '72%' : '100%'}}/>)}</div>
                <div className="wq-document-bottom"><svg className="wq-signature" viewBox="0 0 160 65" aria-hidden="true"><path d="M8 49C23 36 59 7 48 7C35 7 18 62 42 52C65 42 69 15 58 30C49 44 72 49 86 36C97 23 90 46 107 38C116 34 123 42 150 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><div className="wq-demo-stamp"><Stamp size={25}/><span>ختم المؤسسة</span></div></div>
              </div>
              <div className="wq-tools wq-float"><span><Stamp size={20}/>ختم المؤسسة</span><span><PenTool size={20}/>التوقيع الرسمي</span><span><FileText size={20}/>ورقة المؤسسة</span></div>
              <div className="wq-merge wq-float"><span>دمج 3 ملفات</span><div><FileText/><ArrowLeft size={16}/><Layers/></div></div>
              <div className="wq-export wq-float"><div className="wq-pdf">PDF</div><span>جاهز للتصدير</span><Check size={19}/></div>
            </div>
          </section>
          <section id="features" className="wq-features" aria-label="مزايا وثيق">{features.map(({Icon,title,text},i)=><article className="wq-feature" key={title} style={{animationDelay:`${i*70}ms`}}><div className="wq-feature-icon"><Icon size={28}/></div><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
          <section id="how-it-works" className="wq-how" aria-labelledby="wq-how-title"><h2 id="wq-how-title">كيف يعمل وثيق؟</h2><div className="wq-steps">{steps.map(({Icon,title,text},i)=><article className="wq-step" key={title}><span className="wq-step-number">{i+1}</span><div className="wq-step-icon"><Icon size={25}/></div><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>
        </main>
        <footer className="wq-footer">وثيق · دمج المستندات والختم والتوقيع</footer>
      </div>
    </div>
  );
};
