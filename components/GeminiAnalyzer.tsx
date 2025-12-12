import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface GeminiAnalyzerProps {
  imageBase64: string | null;
}

const GeminiAnalyzer: React.FC<GeminiAnalyzerProps> = ({ imageBase64 }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeDocument = async () => {
    if (!imageBase64 || !process.env.API_KEY) {
      setError("مفتاح API غير متوفر أو لم يتم تحميل المستند.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Extract base64 data only (remove data:image/png;base64, prefix)
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: "قم بتحليل هذا المستند. استخرج العنوان الرئيسي، التاريخ، وملخص قصير للمحتوى في نقاط. اجعل الرد باللغة العربية ومنسقاً بشكل جيد."
            }
          ]
        }
      });

      setAnalysis(response.text);
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("حدث خطأ أثناء تحليل المستند. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (!imageBase64) return null;

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          مساعد الذكاء الاصطناعي
        </h3>
        {!analysis && !loading && (
          <button
            onClick={analyzeDocument}
            className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors font-medium border border-purple-200"
          >
            تحليل المستند
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>جاري تحليل المستند...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {analysis && (
        <div className="prose prose-sm prose-slate max-w-none text-right">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed text-slate-700">
            {analysis}
          </div>
          <button 
            onClick={() => setAnalysis(null)}
            className="mt-2 text-xs text-slate-500 hover:text-slate-800 underline"
          >
            تحليل جديد
          </button>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalyzer;
