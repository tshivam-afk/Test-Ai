import { useState, DragEvent, ChangeEvent, useEffect } from "react";
import { X, Code, Play, CheckCircle2, AlertTriangle } from "lucide-react";
import { Test } from "../types";
import { healAndParseJson } from "../lib/jsonHealer";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newTest: Test) => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);

  // States for JSON Paste / Upload Tab
  const [jsonText, setJsonText] = useState("");
  const [correctionLogs, setCorrectionLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [healedTest, setHealedTest] = useState<Test | null>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
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
              Workbook Importer Desk
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium block">
              Direct JSON workbook parsing with dynamic self-healing engine.
            </span>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          {/* Direct JSON healing/import panel */}
          <div id="json-tab-body" className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 block font-mono">
                Paste JSON workbook content
              </label>
              <textarea
                id="json-paster-box"
                rows={8}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`{
  "title": "NEET Practice test",
  "questions": [
    {
      "number": 1,
      "questionText": "What cell organelle is known as powerhouse?",
      "options": ["Lysosome", "Mitochondria", "Ribosome", "Nucleus"],
      "correctOptionIndex": 1, // MUST be a 0-based integer representing the correct option: 0 = 1st option, 1 = 2nd option, 2 = 3rd option, 3 = 4th option. Do NOT use letter strings (e.g. use 1, not "B" or "2nd").
      "solution": "Mitochondria generate ATP."
    }
  ]
}`}
                className="w-full p-3 font-mono text-[10px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 placeholder-zinc-700 outline-none focus:ring-1 focus:ring-indigo-500 custom-scrollbar"
              />
            </div>

            {/* Drag & Drop JSON file */}
            <div
              id="json-drag-zone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleJsonDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/10"
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
                <span className="font-bold text-slate-700 dark:text-zinc-200 text-xs">
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
              className={`w-full py-3 rounded-2xl text-center font-bold text-xs transition-all tracking-wider uppercase ${
                jsonText.trim()
                  ? "bg-indigo-650 hover:bg-indigo-600 active:scale-95 text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-600"
              }`}
            >
              🛡️ Parse & Validate JSON
            </button>

            {/* Correction Logs output drawer inside modal */}
            {showLogs && (
              <div className="bg-slate-50/50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-[10px] space-y-2 select-none">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-500 block">
                  🧙‍♂️ Self-Healing Outputs
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1.5 custom-scrollbar">
                  {correctionLogs.map((log, i) => (
                    <div key={i} className="text-slate-600 dark:text-zinc-400 flex items-start gap-1">
                      <span className="text-indigo-400 shrink-0">&gt;</span>
                      <p>{log}</p>
                    </div>
                  ))}
                </div>

                {healedTest && (
                  <div className="bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg flex items-center gap-1.5 font-sans mt-2 self-center text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <div className="flex-1">
                      <span className="font-extrabold text-[10px] block uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Success</span>
                      <span className="text-[10px] font-medium block text-slate-600 dark:text-zinc-300">
                        Mapped <strong>{healedTest.questions.length}</strong> questions to &quot;{healedTest.title}&quot;!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCommitJSONImport}
                      className="py-1.5 px-3 bg-emerald-500 text-white rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer pointer-events-auto shrink-0 shadow-sm hover:bg-emerald-600"
                    >
                      Import
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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

