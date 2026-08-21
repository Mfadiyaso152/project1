const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// Fix grid block
const gridStr = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative">
              {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] bg-white/30 dark:bg-slate-950/30 rounded-3xl">
                   <div className="bg-white dark:bg-slate-800 shadow-2xl px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 animate-scale-in">
                     <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                     <span className="font-bold text-slate-800 dark:text-slate-200">بانتظار كود التفعيل</span>
                   </div>
                </div>
              )}
              
              <div className={\`\${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6\`}>
                <h3 className={\`font-extrabold text-lg flex items-center gap-2 \${isLight ? 'text-slate-800' : 'text-white'}\`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  المستندات الأساسية
                </h3>
                
                <div className="flex flex-col gap-5">
                  <FileUpload
                    label="المستند الأصلي (الأوراق)"
                    subLabel="PDF أو صور"
                    accept="image/*,application/pdf"
                    multiple={true}
                    value={docs.originalPages.length > 0 ? docs.originalPages : null}
                    onChange={handleOriginalUpload}
                    onClear={() => clearFile('original')}
                    icon={<FileText size={38} className="text-teal-500" />}
                  />
                  <div>
                    <FileUpload
                      label="ورقة المؤسسة الرسمية (الترويسة)"
                      subLabel="اختياري"
                      accept="image/*,application/pdf"
                      multiple={true}
                      value={docs.templatePages.length > 0 ? docs.templatePages : null}
                      onChange={handleTemplateUpload}
                      onClear={() => clearFile('template')}
                      icon={<ImageIcon size={38} className="text-teal-500" />}
                    />
                    {(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (
                      <button onClick={() => loadSavedAsset('template')} className="mt-2 text-xs text-teal-500 font-bold hover:underline">استخدام الترويسة المحفوظة في حسابي</button>
                    )}
                  </div>
                </div>
              </div>

              <div className={\`\${cardClass} p-6 rounded-3xl border shadow-xl flex flex-col gap-6\`}>
                <h3 className={\`font-extrabold text-lg flex items-center gap-2 \${isLight ? 'text-slate-800' : 'text-white'}\`}>
                  <div className="w-2 h-6 bg-teal-500 rounded-full" />
                  الأختام والتواقيع (اختياري)
                </h3>

                <div className="flex flex-col gap-5">
                  <div>
                    <FileUpload
                      label="ختم المؤسسة"
                      subLabel="صورة شفافة PNG"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.stamp}
                      onChange={(f) => handleFile('stamp', f as File)}
                      onClear={() => clearFile('stamp')}
                      icon={<Stamp size={38} className="text-teal-500" />}
                    />
                    {(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (
                      <button onClick={() => loadSavedAsset('stamp')} className="mt-2 text-xs text-teal-500 font-bold hover:underline">استخدام الختم المحفوظ في حسابي</button>
                    )}
                  </div>

                  <div>
                    <FileUpload
                      label="التوقيع"
                      subLabel="صورة أو رسم حي"
                      accept="image/png, image/jpeg, application/pdf"
                      value={docs.signature}
                      onChange={(f) => handleFile('signature', f as File)}
                      onClear={() => clearFile('signature')}
                      icon={<PenTool size={38} className="text-teal-500" />}
                    />
                    <div className="flex justify-between items-center mt-2">
                       {(currentUser?.plan === 'pro' || currentUser?.role === 'admin') && (
                        <button onClick={() => loadSavedAsset('signature')} className="text-xs text-teal-500 font-bold hover:underline">استخدام التوقيع المحفوظ</button>
                      )}
                      <button onClick={() => setIsDrawingSignature(true)} className={\`text-xs px-4 py-2 rounded-xl font-bold transition-colors \${isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}\`}>ارسم توقيعك ✍️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                disabled={!canProceed || isPending}
                onClick={handleProceedToEditor}
                className={\`flex items-center justify-center gap-3 px-12 py-4 rounded-3xl font-black text-lg transition-all shadow-xl \${
                  canProceed && !isPending ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                }\`}
              >
                المتابعة للدمج
                <ArrowLeft size={20} />
              </button>
            </div>`;

// Replace from grid-cols-1 ... down to the end of button
const oldGridRegex = /<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 relative">[\s\S]*?<\/button>\n            <\/div>/;
code = code.replace(oldGridRegex, gridStr);

fs.writeFileSync('App.tsx', code);
