import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function CreativeScanner({ darkMode = false }) {
  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Style Guide PDF State
  const [pdfFile, setPdfFile] = useState(null);

  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Helper: Convert any File to Base64 string (strips data URL prefix)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result;
        resolve(res.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 1. Simple, reliable Image Handler
  const handleImageSelect = (file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    // Check extension as fallback if OS leaves file.type blank
    const validExt = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!file.type.startsWith('image/') && !validExt) {
      setError('Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    setImageFile(file);

    // Use FileReader DataURL so it never fails due to revoked Blob URLs
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result);
    reader.readAsDataURL(file);
  };

  // 2. Simple PDF Handler
  const handlePdfSelect = (file) => {
    if (!file) return;
    setError(null);
    setResult(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF style guide.');
      return;
    }

    setPdfFile(file);
  };

  // 3. Direct AI Multimodal Scan (Image + PDF -> Gemini)
  const runScan = async () => {
    if (!imageFile || !pdfFile) {
      setError('Both an email design image and a brand style guide PDF are required.');
      return;
    }

    if (!GEMINI_API_KEY) {
      setError('Gemini API key is not configured. Please verify VITE_GEMINI_API_KEY in your environment.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const [imageBase64, pdfBase64] = await Promise.all([
        fileToBase64(imageFile),
        fileToBase64(pdfFile),
      ]);

      const prompt = `
        Analyze the attached email design image against the attached Brand Style Guide PDF.
        1. Check if colors, typography, logo usage, and tone match the PDF brand rules.
        2. Locate the primary Call-To-Action (CTA) button/link and evaluate whether it is clear, visible, and actionable.
        Return ONLY valid JSON matching this structure:
        {
          "brandCompliant": boolean,
          "brandFeedback": string[],
          "ctaDetected": boolean,
          "ctaText": string,
          "ctaClarityScore": "High" | "Medium" | "Low",
          "ctaFeedback": string
        }
      `;

      const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.0-flash'];
      let lastErr = null;
      let parsedData = null;

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: imageFile.type || 'image/png',
                        data: imageBase64,
                      },
                    },
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: pdfBase64,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    brandCompliant: { type: 'BOOLEAN' },
                    brandFeedback: { type: 'ARRAY', items: { type: 'STRING' } },
                    ctaDetected: { type: 'BOOLEAN' },
                    ctaText: { type: 'STRING' },
                    ctaClarityScore: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
                    ctaFeedback: { type: 'STRING' },
                  },
                  required: ['brandCompliant', 'brandFeedback', 'ctaDetected', 'ctaText', 'ctaClarityScore', 'ctaFeedback'],
                },
              },
            }),
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            const msg = errBody?.error?.message || `HTTP ${response.status}`;
            throw new Error(msg);
          }

          const apiJson = await response.json();
          const rawText = apiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) throw new Error('Empty response received from Gemini.');

          const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
          parsedData = JSON.parse(cleanJson);
          break;
        } catch (modelErr) {
          lastErr = modelErr;
          if (modelErr.message && (modelErr.message.includes('404') || modelErr.message.includes('not found') || modelErr.message.includes('no longer available'))) {
            continue;
          }
          throw modelErr;
        }
      }

      if (!parsedData) {
        throw lastErr || new Error('Failed to analyze creative.');
      }

      setResult(parsedData);
    } catch (err) {
      setError(err.message || 'Something went wrong during the scan.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-2">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: UPLOADS & ACTION BUTTON */}
        <div className="space-y-6">
          {/* STEP 1: EMAIL IMAGE UPLOAD & SIMPLE PREVIEW */}
          <div className={`rounded-xl border p-5 shadow-sm transition-colors ${darkMode ? 'border-[#405E69]/40 bg-[#072E3D]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>1. Upload Email Design Image</h2>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setResult(null);
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              onClick={(e) => {
                e.currentTarget.value = '';
              }}
              onChange={(e) => handleImageSelect(e.target.files?.[0])}
            />

            {!imagePreview ? (
              <div
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageSelect(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition ${
                  darkMode
                    ? 'border-[#405E69]/50 bg-[#002230] hover:border-[#80949B] hover:bg-[#002b3d]'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50/40'
                }`}
              >
                <Upload className={`mb-2 h-8 w-8 ${darkMode ? 'text-[#80949B]' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Click to upload or drag & drop your image
                </p>
                <p className={`mt-1 text-xs ${darkMode ? 'text-[#80949B]' : 'text-gray-500'}`}>PNG, JPG, or WEBP</p>
              </div>
            ) : (
              <div className={`overflow-hidden rounded-lg border p-4 ${darkMode ? 'border-[#405E69]/40 bg-[#002230]' : 'border-gray-200 bg-gray-100'}`}>
                <img
                  src={imagePreview}
                  alt="Uploaded email design"
                  className="mx-auto block max-h-[28rem] w-auto max-w-full rounded object-contain shadow-sm"
                />
                <p className={`mt-2 text-center text-xs ${darkMode ? 'text-[#80949B]' : 'text-gray-500'}`}>{imageFile?.name}</p>
              </div>
            )}
          </div>

          {/* STEP 2: STYLE GUIDE PDF UPLOAD */}
          <div className={`rounded-xl border p-5 shadow-sm transition-colors ${darkMode ? 'border-[#405E69]/40 bg-[#072E3D]' : 'border-gray-200 bg-white'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>2. Upload Brand Style Guide (PDF)</h2>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    setResult(null);
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="sr-only"
              onClick={(e) => {
                e.currentTarget.value = '';
              }}
              onChange={(e) => handlePdfSelect(e.target.files?.[0])}
            />

            {!pdfFile ? (
              <div
                onClick={() => pdfInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handlePdfSelect(e.dataTransfer.files?.[0]);
                }}
                className={`flex cursor-pointer items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition ${
                  darkMode
                    ? 'border-[#405E69]/50 bg-[#002230] hover:border-[#80949B] hover:bg-[#002b3d]'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50/40'
                }`}
              >
                <FileText className={`h-6 w-6 ${darkMode ? 'text-[#80949B]' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Select Brand Guidelines PDF</span>
              </div>
            ) : (
              <div className={`flex items-center gap-3 rounded-lg border p-3.5 ${darkMode ? 'border-[#405E69]/40 bg-[#002230]' : 'border-gray-200 bg-gray-50'}`}>
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{pdfFile.name}</span>
              </div>
            )}
          </div>

          {/* ERROR BANNER */}
          {error && (
            <div className={`flex items-center gap-2 rounded-lg border p-3.5 text-sm ${darkMode ? 'border-red-900/60 bg-red-950/40 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            type="button"
            onClick={runScan}
            disabled={!imageFile || !pdfFile || isScanning}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-slate-700"
          >
            <Sparkles className="h-4 w-4" />
            {isScanning ? 'Scanning Design & Checking CTA...' : 'Scan Against Style Guide'}
          </button>
        </div>

        {/* RIGHT COLUMN: SCAN RESULTS */}
        <div className={`rounded-xl border p-5 shadow-sm transition-colors ${darkMode ? 'border-[#405E69]/40 bg-[#072E3D]' : 'border-gray-200 bg-white'}`}>
          <h3 className={`mb-4 text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            CTA Scan &amp; Brand Guide Alignment
          </h3>

          {isScanning ? (
            <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center ${darkMode ? 'border-[#405E69]/40 bg-[#002230] text-[#80949B]' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              <Sparkles className="mb-3 h-8 w-8 animate-pulse text-blue-500" />
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Scanning Design &amp; Checking CTA...
              </p>
              <p className="mt-1 text-xs">Evaluating brand style guide alignment and primary CTA clarity</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* CTA Clarity Check */}
              <div className={`rounded-lg border p-4 ${darkMode ? 'border-[#405E69]/30 bg-[#002230]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    CTA Check: {result.ctaDetected ? `"${result.ctaText}"` : 'No Clear CTA Found'}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Clarity: {result.ctaClarityScore}
                  </span>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{result.ctaFeedback}</p>
              </div>

              {/* Brand Style Guide Check */}
              <div className={`rounded-lg border p-4 ${darkMode ? 'border-[#405E69]/30 bg-[#002230]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="mb-2 flex items-center gap-2">
                  {result.brandCompliant ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Brand Style Guide: {result.brandCompliant ? 'Aligned' : 'Needs Adjustments'}
                  </span>
                </div>
                <ul className={`list-disc space-y-1 pl-6 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {(result.brandFeedback || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center ${darkMode ? 'border-[#405E69]/40 bg-[#002230] text-[#80949B]' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              <Sparkles className="mb-3 h-8 w-8 opacity-40" />
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                No Scan Results Yet
              </p>
              <p className="mt-1 max-w-sm text-xs">
                Upload your email design image and brand style guide PDF on the left, then click &ldquo;Scan Against Style Guide&rdquo; to view CTA clarity and brand alignment results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
