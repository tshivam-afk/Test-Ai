import { useState, DragEvent, ChangeEvent, useEffect, useRef } from "react";
import { Upload, X, Loader2, FileText, AlertTriangle, Code, Play, CheckCircle2, ShieldAlert } from "lucide-react";
import { Test } from "../types";
import { healAndParseJson } from "../lib/jsonHealer";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newTest: Test) => void;
}

const PROGRESS_MESSAGES = [
  "Initializing Gemini AI Reader...",
  "Reading scanned document structure...",
  "Extracting multiple-choice questions & options...",
  "Converting mathematical LaTeX equations...",
  "Scanning later tables for Answer Keys...",
  "Aligning explanations, formulas & hints...",
  "Assembling final interactive workspace..."
];

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"json" | "pdf">("json");
  const [dragActive, setDragActive] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);

  // States for JSON Paste / Upload Tab
  const [jsonText, setJsonText] = useState("");
  const [correctionLogs, setCorrectionLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [healedTest, setHealedTest] = useState<Test | null>(null);

  // Rotate helpful loading statements automatically to engage the student
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (loading) {
      intervalId = setInterval(() => {
        setProgressIdx((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
      }, 3500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processPdfFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setErrorString("Only academic PDF worksheets are supported currently.");
      return;
    }
    setErrorString(null);
    setPdfFile(selectedFile);
  };

  const handlePdfDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  // Drag and Drop for JSON files
  const handleJsonDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      readJsonFile(selectedFile);
    }
  };

  const readJsonFile = (file: File) => {
    setErrorString(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
    };
    reader.onerror = () => {
      setErrorString("Failed to read JSON file.");
    };
    reader.readAsText(file);
  };

  const handleJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readJsonFile(e.target.files[0]);
    }
  };

  // Fire PDF upload extraction
  const handlePdfSubmit = async () => {
    if (!pdfFile) return;

    setLoading(true);
    setErrorString(null);
    setProgressIdx(0);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = (err) => reject(err);
      });

      reader.readAsDataURL(pdfFile);
      const dataUri = await base64Promise;

      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBase64: dataUri,
          fileName: pdfFile.name,
        }),
      });

      const parsedResponse = await response.json();

      if (!response.ok || !parsedResponse.success) {
        throw new Error(parsedResponse.error || "Failed parsing the questions PDF.");
      }

      const parsedTest: Test = {
        id: `uploaded-${Date.now()}`,
        title: parsedResponse.data.testTitle || pdfFile.name.replace(".pdf", ""),
        questions: parsedResponse.data.questions || [],
        createdAt: new Date().toISOString(),
      };

      if (!parsedTest.questions || parsedTest.questions.length === 0) {
        throw new Error("No multi-choice questions could be found in this PDF structure.");
      }

      onUploadSuccess(parsedTest);
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "An error occurred during worksheet conversion. Please try again.");
      setLoading(false);
    }
  };

  // Fire JSON heuristic self-healing + schema mapping importer
  const handleJsonSubmit = () => {
    setErrorString(null);
    setHealedTest(null);
    setCorrectionLogs([]);
    setShowLogs(true);

    try {
      const result = healAndParseJson(jsonText);
      setCorrectionLogs(result.logs);

      if (result.success && result.data) {
        setHealedTest(result.data);
      } else {
        setErrorString(result.error || "Syntax corrupted beyond salvage. High-level parser error.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "An error occurred inside JSON correction logic.");
    }
  };

  const handleCommitJSONImport = () => {
    if (healedTest) {
      onUploadSuccess(healedTest);
    }
  };

  return (
    <div
      id="modal-overlay"
      className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none"
    >
      <div
        id="modal-card"
        className="w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl relative border border-slate-100 dark:border-zinc-800 transition-colors flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header bar */}
        <div id="modal-header" className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-50 tracking-tight">
              Test Importer Desk
            </h3>
            <span className="text-[10px] text-slate-400 font-medium block">
              Auto healing, auto correcting schema mapping.
            </span>
          </div>
          {!loading && (
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab switcher options */}
        {!loading && (
          <div className="flex bg-slate-100/75 dark:bg-zinc-850 p-1 rounded-2xl mb-4 shrink-0">
            <button
              onClick={() => {
                setActiveTab("json");
                setErrorString(null);
              }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "json"
                  ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-xs ring-1 ring-slate-100/50"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Direct JSON File / Paste</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("pdf");
                setErrorString(null);
              }}
              className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "pdf"
                  ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-xs ring-1 ring-slate-100/50"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Scanned Paper PDF</span>
            </button>
          </div>
        )}

        {/* Scrollable Modal Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">

          {loading ? (
            /* Live animated loading screen */
            <div
              id="loading-panel-spinner"
              className="py-12 flex flex-col items-center justify-center text-center animate-fade-in"
            >
              <div className="relative mb-6">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <FileText className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="font-bold text-slate-800 dark:text-zinc-200 text-sm mb-1 uppercase tracking-wider font-mono">
                Running Extractors...
              </p>
              <p className="text-xs text-indigo-500 font-semibold px-4 duration-500 h-8 flex items-center justify-center mt-1">
                {PROGRESS_MESSAGES[progressIdx]}
              </p>
              <span className="text-[10px] text-slate-400 mt-6 block max-w-[280px] leading-relaxed">
                Applying intelligent LaTeX solvers, organizing question indexes, and validating answer keys.
              </span>
            </div>
          ) : activeTab === "json" ? (
            /* Direct JSON healing/import panel */
            <div id="json-tab-body" className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-extrabold tracking-widest text-indigo-550 dark:text-indigo-400 block font-mono">
                  Paste JSON Text Content
                </label>
                <textarea
                  id="json-paster-box"
                  rows={6}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`{\n  "title": "NEET Mock Test",\n  "questions": [\n    {\n      "number": 1,\n      "questionText": "What cell organelle is known as power house?",\n      "options": ["Lysosome", "Mitochondria", "Ribosome", "Nucleus"],\n      "correctOptionIndex": 1,\n      "solution": "Mitochondria generates ATP."\n    }\n  ]\n}`}
                  className="w-full p-3 font-mono text-[10px] bg-slate-50 dark:bg-zinc-950 border border-slate-205 dark:border-zinc-805 rounded-xl text-slate-800 dark:text-zinc-150 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 custom-scrollbar"
                />
              </div>

              {/* Or Drag & Drop JSON file */}
              <div
                id="json-drag-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleJsonDrop}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-850/20"
                }`}
              >
                <input
                  id="json-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleJsonChange}
                />
                <label htmlFor="json-file-input" className="cursor-pointer w-full flex flex-col items-center justify-center">
                  <Play className="w-5 h-5 text-indigo-400 mb-1" />
                  <span className="font-bold text-slate-705 dark:text-zinc-200 text-xs">
                    Drag & Drop .json File
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    or select from list
                  </span>
                </label>
              </div>

              {/* Action Fix and Validate button */}
              <button
                type="button"
                id="self-correct-json-trigger"
                onClick={handleJsonSubmit}
                disabled={!jsonText.trim()}
                className={`w-full py-3 rounded-2xl text-center font-bold text-xs transition-transform tracking-wider uppercase ${
                  jsonText.trim()
                    ? "bg-indigo-650 hover:bg-indigo-550 active:scale-95 text-white"
                    : "bg-slate-100 text-slate-400 dark:bg-zinc-850 dark:text-zinc-650"
                }`}
              >
                🛡️ Parse & Self-Heal JSON
              </button>

              {/* Correction Logs output drawer inside modal */}
              {showLogs && (
                <div className="bg-slate-50/50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-150 dark:border-zinc-800 font-mono text-[10px] space-y-2 select-none">
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-500 block">
                    🧙‍♂️ Healing Console Outputs
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar">
                    {correctionLogs.map((log, i) => (
                      <div key={i} className="text-slate-650 dark:text-zinc-400 flex items-start gap-1">
                        <span className="text-indigo-400 shrink-0">&gt;</span>
                        <p>{log}</p>
                      </div>
                    ))}
                  </div>

                  {healedTest && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg flex items-center gap-1.5 font-sans mt-2 self-center text-xs">
                      <CheckCircle2 className="w-3.8 h-3.8 shrink-0 text-emerald-500" />
                      <div className="flex-1">
                        <span className="font-extrabold text-[10px] block uppercase tracking-wider">Success</span>
                        <span className="text-[10px] font-medium block">
                          Mapped <strong>{healedTest.questions.length}</strong> questions to &quot;{healedTest.title}&quot;!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCommitJSONImport}
                        className="py-1.5 px-3 bg-emerald-500 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer pointer-events-auto shrink-0 shadow-sm"
                      >
                        Import Workbook
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Upload drop panel for scanned PDF */
            <div id="pdf-tab-body" className="space-y-4 animate-fade-in">
              <div
                id="drop-zone-pdf"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handlePdfDrop}
                className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/20"
                    : "border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-650 bg-slate-50/50 dark:bg-zinc-850/20"
                }`}
              >
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handlePdfChange}
                />
                <label htmlFor="pdf-file-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-indigo-500" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm">
                    Drag & Drop PDF Test
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                    or browse files from system
                  </span>
                </label>
              </div>

              {/* Selected file card */}
              {pdfFile && (
                <div
                  id="selected-pdf-card"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-xs animate-fade-in"
                >
                  <FileText className="w-8 h-8 text-sky-500" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-semibold text-slate-700 dark:text-zinc-200">
                      {pdfFile.name}
                    </p>
                    <p className="text-slate-400">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    id="reset-pdf-btn"
                    onClick={() => setPdfFile(null)}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                id="run-extraction-btn"
                disabled={!pdfFile}
                onClick={handlePdfSubmit}
                className={`w-full py-3 rounded-2xl text-center font-extrabold text-xs transition-all uppercase tracking-wider cursor-pointer ${
                  pdfFile
                    ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg"
                    : "bg-slate-100 text-slate-400 dark:bg-zinc-850 dark:text-zinc-650"
                }`}
              >
                Scan PDF & Extract AI Test
              </button>
            </div>
          )}

          {/* General conversion warning or error alerts */}
          {errorString && (
            <div
              id="upload-error-alert-box"
              className="flex items-start gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-[#1a1215] text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-950/40 animate-slide-up select-none"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-extrabold uppercase text-[10px] block tracking-wide font-mono">
                  Schema Mapped Alert
                </span>
                <p className="leading-normal mt-0.5 font-mono text-[10px]">{errorString}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
