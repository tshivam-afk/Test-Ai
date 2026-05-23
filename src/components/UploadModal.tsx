import { useState, DragEvent, ChangeEvent, useEffect } from "react";
import { Upload, X, Loader2, FileText, AlertTriangle } from "lucide-react";
import { Test } from "../types";

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
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [progressIdx, setProgressIdx] = useState(0);

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

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setErrorString("Only academic PDF worksheets are supported currently.");
      return;
    }
    setErrorString(null);
    setFile(selectedFile);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setErrorString(null);
    setProgressIdx(0);

    try {
      // 1. Convert PDF to Base64 String
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = (err) => reject(err);
      });

      reader.readAsDataURL(file);
      const dataUri = await base64Promise;

      // 2. Transmit to server API parse route
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfBase64: dataUri,
          fileName: file.name,
        }),
      });

      const parsedResponse = await response.json();

      if (!response.ok || !parsedResponse.success) {
        throw new Error(parsedResponse.error || "Failed parsing the questions PDF.");
      }

      const parsedTest: Test = {
        id: `uploaded-${Date.now()}`,
        title: parsedResponse.data.testTitle || file.name.replace(".pdf", ""),
        questions: parsedResponse.data.questions || [],
        createdAt: new Date().toISOString(),
      };

      if (!parsedTest.questions || parsedTest.questions.length === 0) {
        throw new Error("No multi-choice questions could be found in this PDF structure.");
      }

      onUploadSuccess(parsedTest);
    } catch (err: any) {
      console.error(err);
      setErrorString(
        err.message || "An error occurred during worksheet conversion. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div
      id="modal-overlay"
      className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="modal-card"
        className="w-full max-w-[400px] bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl relative border border-slate-100 dark:border-zinc-800 transition-colors"
      >
        {/* Header bar */}
        <div id="modal-header" className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-zinc-100">
            Import Practice Test
          </h3>
          {!loading && (
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading ? (
          /* Live animated loading screen */
          <div
            id="loading-panel animate-pulse"
            className="py-10 flex flex-col items-center justify-center text-center"
          >
            <div className="relative mb-6">
              <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
              <FileText className="w-5 h-5 text-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="font-bold text-slate-850 dark:text-zinc-200 text-sm mb-1">
              Analyzing Study Sheets...
            </p>
            <p className="text-xs text-sky-500 font-semibold px-4 duration-500 h-8 flex items-center justify-center mt-1">
              {PROGRESS_MESSAGES[progressIdx]}
            </p>
            <span className="text-[10px] text-slate-400 mt-6 block max-w-[280px]">
              This processes the full workbook directly matching standard layouts. It might take up to a minute.
            </span>
          </div>
        ) : (
          /* Upload drop panel */
          <div id="upload-panel" className="space-y-4">
            <div
              id="drop-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/10"
                  : "border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-850/50"
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="file-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-sky-500" />
                </div>
                <span className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">
                  Drag & Drop PDF Test
                </span>
                <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  or tap to browse files
                </span>
              </label>
            </div>

            {/* Error alerts */}
            {errorString && (
              <div
                id="upload-error-alert"
                className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-zinc-950 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-950"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-normal">{errorString}</p>
              </div>
            )}

            {/* Selected file card */}
            {file && (
              <div
                id="selected-file-card"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-xs"
              >
                <FileText className="w-8 h-8 text-sky-500" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-semibold text-slate-700 dark:text-zinc-200">
                    {file.name}
                  </p>
                  <p className="text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  id="reset-file-btn"
                  onClick={() => setFile(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-650"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              id="run-extraction-btn"
              disabled={!file}
              onClick={handleSubmit}
              className={`w-full py-3.5 rounded-2xl text-center font-bold text-sm transition-colors cursor-pointer ${
                file
                  ? "bg-slate-900 border-b-2 border-slate-950 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300"
                  : "bg-slate-100 hover:bg-slate-150 text-slate-400 dark:bg-zinc-850 dark:text-zinc-650"
              }`}
            >
              Start Analysis & Extraction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
