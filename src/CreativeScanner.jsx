import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import './CreativeScanner.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function CreativeScanner() {
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
    <div className="scanner-container">
      <div className="scanner-grid">
        {/* LEFT COLUMN: UPLOADS & ACTION BUTTON */}
        <div className="scanner-left-col">
          {/* STEP 1: EMAIL IMAGE UPLOAD & SIMPLE PREVIEW */}
          <div className="scanner-card">
            <div className="scanner-card-header">
              <h2 className="scanner-card-title">1. Upload Email Design Image</h2>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setResult(null);
                  }}
                  className="btn-remove-file"
                >
                  <X className="icon-xs" /> Remove
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
                className="scanner-dropzone"
              >
                <Upload className="scanner-dropzone-icon" />
                <p className="scanner-dropzone-title">
                  Click to upload or drag &amp; drop your image
                </p>
                <p className="scanner-dropzone-hint">PNG, JPG, or WEBP</p>
              </div>
            ) : (
              <div className="scanner-preview-box">
                <img
                  src={imagePreview}
                  alt="Uploaded email design"
                  className="scanner-preview-img"
                />
                <p className="scanner-file-caption">{imageFile?.name}</p>
              </div>
            )}
          </div>

          {/* STEP 2: STYLE GUIDE PDF UPLOAD */}
          <div className="scanner-card">
            <div className="scanner-card-header">
              <h2 className="scanner-card-title">2. Upload Brand Style Guide (PDF)</h2>
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null);
                    setResult(null);
                  }}
                  className="btn-remove-file"
                >
                  <X className="icon-xs" /> Remove
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
                className="scanner-dropzone scanner-dropzone-pdf"
              >
                <FileText className="scanner-dropzone-pdf-icon" />
                <span className="scanner-dropzone-title">Select Brand Guidelines PDF</span>
              </div>
            ) : (
              <div className="scanner-pdf-selected">
                <FileText className="scanner-pdf-icon" />
                <span className="scanner-pdf-name">{pdfFile.name}</span>
              </div>
            )}
          </div>

          {/* ERROR BANNER */}
          {error && (
            <div className="scanner-error-banner">
              <AlertCircle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            type="button"
            onClick={runScan}
            disabled={!imageFile || !pdfFile || isScanning}
            className="btn-run-scan"
          >
            <Sparkles className="icon-sm" />
            {isScanning ? 'Scanning Design & Checking CTA...' : 'Scan Against Style Guide'}
          </button>
        </div>

        {/* RIGHT COLUMN: SCAN RESULTS */}
        <div className="scanner-card">
          <h3 className="scanner-results-heading">
            CTA Scan &amp; Brand Guide Alignment
          </h3>

          {isScanning ? (
            <div className="scanner-empty-box">
              <Sparkles className="scanner-pulse-icon" />
              <p className="scanner-empty-title">
                Scanning Design &amp; Checking CTA...
              </p>
              <p className="scanner-empty-desc">
                Evaluating brand style guide alignment and primary CTA clarity
              </p>
            </div>
          ) : result ? (
            <div className="scanner-results-list">
              {/* CTA Clarity Check */}
              <div className="scanner-result-box">
                <div className="scanner-result-header-between">
                  <span className="scanner-result-title">
                    CTA Check: {result.ctaDetected ? `"${result.ctaText}"` : 'No Clear CTA Found'}
                  </span>
                  <span className="clarity-badge">
                    Clarity: {result.ctaClarityScore}
                  </span>
                </div>
                <p className="scanner-feedback-text">{result.ctaFeedback}</p>
              </div>

              {/* Brand Style Guide Check */}
              <div className="scanner-result-box">
                <div className="scanner-result-header">
                  {result.brandCompliant ? (
                    <CheckCircle2 className="icon-md status-pass" />
                  ) : (
                    <AlertCircle className="icon-md status-warning" />
                  )}
                  <span className="scanner-result-title">
                    Brand Style Guide: {result.brandCompliant ? 'Aligned' : 'Needs Adjustments'}
                  </span>
                </div>
                <ul className="scanner-feedback-list">
                  {(result.brandFeedback || []).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="scanner-empty-box">
              <Sparkles className="scanner-empty-icon" />
              <p className="scanner-empty-title">
                No Scan Results Yet
              </p>
              <p className="scanner-empty-desc">
                Upload your email design image and brand style guide PDF on the left, then click &ldquo;Scan Against Style Guide&rdquo; to view CTA clarity and brand alignment results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
