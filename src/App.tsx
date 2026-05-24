import { useState, useEffect } from "react";
import MobileFrame from "./components/MobileFrame";
import TestLibrary from "./components/TestLibrary";
import QuizView from "./components/QuizView";
import UploadModal from "./components/UploadModal";
import ThemeToggle from "./components/ThemeToggle";
import SplashScreen from "./components/SplashScreen";
import StudyRoadmap from "./components/StudyRoadmap";
import MistakeGym from "./components/MistakeGym";
import ExamHistory from "./components/ExamHistory";
import SyncSettingsModal from "./components/SyncSettingsModal";
import { BookOpen, TrendingUp, Dumbbell, History, Cloud, CloudOff } from "lucide-react";
import { getSampleTest } from "./data";
import { getBiologyMarathonTest } from "./biology_data";
import { Test, TestProgress, ExamHistoryItem } from "./types";
import { healQuestionCorrectIndexFromExplanation } from "./lib/jsonHealer";
import { getRandomQuote } from "./lib/quotes";
import {
  auth,
  saveWorkbookToCloud,
  deleteWorkbookFromCloud,
  saveProgressToCloud,
  deleteProgressFromCloud,
  saveHistoryToCloud,
  deleteHistoryFromCloud,
} from "./lib/firebase";

const LOCAL_STORAGE_TESTS_KEY = "practice_companion_tests_v1";
const LOCAL_STORAGE_PROGRESS_KEY = "practice_companion_progress_v1";
const LOCAL_STORAGE_THEME_KEY = "practice_companion_theme_v1";
const LOCAL_STORAGE_MODE_KEY = "practice_companion_mode_v1";
const LOCAL_STORAGE_ACTIVE_TEST_KEY = "practice_companion_active_test_v1";

export default function App() {
  // 1. Initial State Loading with defaults
  const [tests, setTests] = useState<Test[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TESTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Run explanation key healing on all loaded questions to repair legacy mismatches
          const healedParsed = parsed.map((t: any) => ({
            ...t,
            questions: t.questions ? t.questions.map((q: any) => healQuestionCorrectIndexFromExplanation(q)) : []
          }));
          // Ensure Biology Marathon is included automatically
          const hasBio = healedParsed.some((t: any) => t.id === "neet-biology-marathon-q91-180");
          if (!hasBio) {
            return [getBiologyMarathonTest(), ...healedParsed];
          }
          return healedParsed;
        }
      }
    } catch (e) {
      console.error("Failed loading local tests:", e);
    }
    return [getSampleTest(), getBiologyMarathonTest()];
  });

  const [progress, setProgress] = useState<Record<string, TestProgress>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed loading local progress:", e);
    }
    return {};
  });

  const [activeTestId, setActiveTestId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_TEST_KEY);
    } catch {
      return null;
    }
  });

  const [practiceMode, setPracticeMode] = useState<"study" | "exam">(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MODE_KEY);
      if (stored === "study" || stored === "exam") {
        return stored;
      }
    } catch {}
    return "study";
  });

  const [theme, setTheme] = useState<"light" | "dark" | "amoled">(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (stored === "light" || stored === "dark" || stored === "amoled") {
        return stored as "light" | "dark" | "amoled";
      }
    } catch {}
    return "light";
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"library" | "roadmap" | "gym" | "history">("library");

  const [activeQuote] = useState(() => getRandomQuote());

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("practice_companion_sync_enabled_v1");
      return stored !== "false";
    } catch {
      return true;
    }
  });

  // Observe active user sessions
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Offline persist sync switch preference
  useEffect(() => {
    try {
      localStorage.setItem("practice_companion_sync_enabled_v1", String(syncEnabled));
    } catch {}
  }, [syncEnabled]);

  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem("practice_companion_exam_history_v1");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed loading local exam history:", e);
    }
    return [];
  });

  // Synchronize exam history entries
  useEffect(() => {
    try {
      localStorage.setItem("practice_companion_exam_history_v1", JSON.stringify(examHistory));
    } catch (e) {
      console.error(e);
    }
  }, [examHistory]);

  // 2. Synchronize theme states automatically into document elements list
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark" || theme === "amoled") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (theme === "amoled") {
      root.classList.add("amoled");
    } else {
      root.classList.remove("amoled");
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // 3. Keep local storage synced for tests list
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TESTS_KEY, JSON.stringify(tests));
    } catch (e) {
      console.error(e);
    }
  }, [tests]);

  // 4. Keep local storage synced for study progress logs
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error(e);
    }
  }, [progress]);

  // 5. Keep local storage synced for active study selectors
  useEffect(() => {
    try {
      if (activeTestId) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_TEST_KEY, activeTestId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TEST_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTestId]);

  // 6. Keep local storage synced for practice mode
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MODE_KEY, practiceMode);
    } catch (e) {
      console.error(e);
    }
  }, [practiceMode]);

  // 7. Core Workflows
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : prev === "dark" ? "amoled" : "light"));
  };

  const handleRenameTest = (testId: string, newTitle: string) => {
    setTests((prev) => {
      const updated = prev.map((t) => (t.id === testId ? { ...t, title: newTitle } : t));
      if (currentUser && syncEnabled) {
        const renamed = updated.find((t) => t.id === testId);
        if (renamed && !renamed.isSample) {
          saveWorkbookToCloud(currentUser.uid, renamed);
        }
      }
      return updated;
    });
    setExamHistory((prev) => {
      const updatedHistory = prev.map((item) =>
        item.testId === testId ? { ...item, testTitle: newTitle } : item
      );
      if (currentUser && syncEnabled) {
        updatedHistory.forEach((item) => {
          if (item.testId === testId) {
            saveHistoryToCloud(currentUser.uid, item);
          }
        });
      }
      return updatedHistory;
    });
  };

  const handleUploadSuccess = (newTest: Test) => {
    setTests((prev) => [newTest, ...prev]);
    setShowUploadModal(false);
    setActiveTestId(newTest.id); // Launch the test workspace immediately
    if (currentUser && syncEnabled) {
      saveWorkbookToCloud(currentUser.uid, newTest);
    }
  };

  const handleDeleteTest = (testId: string) => {
    setProgress((prev) => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
    setTests((prev) => prev.filter((t) => t.id !== testId));
    if (activeTestId === testId) {
      setActiveTestId(null);
    }
    if (currentUser && syncEnabled) {
      deleteWorkbookFromCloud(currentUser.uid, testId);
      deleteProgressFromCloud(currentUser.uid, testId);
    }
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    setExamHistory((prev) => prev.filter((item) => item.id !== itemId));
    if (currentUser && syncEnabled) {
      deleteHistoryFromCloud(currentUser.uid, itemId);
    }
  };

  const handleRetest = (testId: string) => {
    setProgress((prev) => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
    setActiveTestId(testId);
    setActiveTab("library");
    if (currentUser && syncEnabled) {
      deleteProgressFromCloud(currentUser.uid, testId);
    }
  };

  // Safe lazy initializer for progress records matching a test paper
  const getOrCreateProgressRecord = (testId: string): TestProgress => {
    const existing = progress[testId];
    if (existing) return existing;

    const matchedTest = tests.find((t) => t.id === testId);
    return {
      testId,
      answers: {},
      flagged: [],
      bookmarked: [],
      userNotes: {},
      timeSpent: 0,
      completed: false,
      lastActiveQuestionNumber: matchedTest?.questions[0]?.number || 1,
      lastUpdatedAt: new Date().toISOString(),
    };
  };

  const handleUpdateTestProgress = (testId: string, partial: Partial<TestProgress>) => {
    setProgress((prev) => {
      const existing = prev[testId] || {
        testId,
        answers: {},
        flagged: [],
        bookmarked: [],
        userNotes: {},
        timeSpent: 0,
        completed: false,
        lastActiveQuestionNumber: tests.find((t) => t.id === testId)?.questions[0]?.number || 1,
        lastUpdatedAt: new Date().toISOString(),
      };
      const updated: TestProgress = {
        ...existing,
        ...partial,
        lastUpdatedAt: new Date().toISOString(),
      };
      if (currentUser && syncEnabled) {
        saveProgressToCloud(currentUser.uid, updated);
      }
      return {
        ...prev,
        [testId]: updated,
      };
    });
  };

  const handleImportCloudData = (data: {
    workbooks: Test[];
    progress: Record<string, TestProgress>;
    history: ExamHistoryItem[];
  }) => {
    setTests(data.workbooks);
    setProgress(data.progress);
    setExamHistory(data.history);
  };

  const activeTest = tests.find((t) => t.id === activeTestId);
  const activeProgress = activeTestId ? getOrCreateProgressRecord(activeTestId) : undefined;

  return (
    <MobileFrame theme={theme}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Top Navbar Header */}
      <div
        id="app-header-bar"
        className="h-14 px-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between select-none transition-colors animate-fade-in"
      >
        <span
          onClick={() => {
            setActiveTestId(null);
          }}
          className="font-black text-sm tracking-widest text-slate-800 dark:text-zinc-100 uppercase cursor-pointer flex items-center gap-1"
        >
          🎓 NEET PREP
        </span>

        {/* Global theme and configuration settings controls */}
        <div className="flex items-center gap-1.5 font-sans">
          {/* Cloud Sync portal status activator trigger */}
          <button
            id="cloud-sync-status-portal-btn"
            onClick={() => setShowSyncModal(true)}
            className={`p-2 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 relative active:scale-95`}
            title={
              currentUser
                ? syncEnabled
                  ? `Synced to Google: ${currentUser.email} (Real-time Active)`
                  : `Synced to Google: ${currentUser.email} (Stopped)`
                : "Enable Cloud Sync with Google"
            }
          >
            {currentUser ? (
              syncEnabled ? (
                <Cloud id="header-active-cloud-icon" className="w-5 h-5 text-indigo-500 animate-pulse" />
              ) : (
                <CloudOff id="header-offline-cloud-icon" className="w-5 h-5 text-amber-500" />
              )
            ) : (
              <CloudOff id="header-unlinked-cloud-icon" className="w-5 h-5 text-slate-400" />
            )}
            {currentUser && (
              <span id="active-profile-indicator-pill" className="absolute w-2 h-2 rounded-full bg-emerald-500 top-1 right-1 border border-white dark:border-zinc-900" />
            )}
          </button>
          
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>
      </div>

      {/* Dynamic Screen View Router */}
      <div id="router-view-body" className="flex-1 flex flex-col overflow-hidden relative">
        {activeTest && activeTestId ? (
          <QuizView
            test={activeTest}
            progress={activeProgress}
            practiceMode={practiceMode}
            onChangeMode={setPracticeMode}
            onUpdateProgress={(partial) => handleUpdateTestProgress(activeTestId, partial)}
            onBackToLibrary={() => {
              setActiveTestId(null);
            }}
            onSubmitExamSuccess={(score, answers, confidences) => {
              const matchedTest = tests.find((t) => t.id === activeTestId);
              if (!matchedTest) return;

              const newHistoryItem: ExamHistoryItem = {
                id: `history-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                testId: matchedTest.id,
                testTitle: matchedTest.title,
                dateTime: new Date().toISOString(),
                timeSpent: activeProgress?.timeSpent || 0,
                score,
                answers,
                confidences,
                questions: matchedTest.questions,
              };

              setExamHistory((prev) => [newHistoryItem, ...prev]);
              if (currentUser && syncEnabled) {
                saveHistoryToCloud(currentUser.uid, newHistoryItem);
              }
            }}
          />
        ) : activeTab === "roadmap" ? (
          <StudyRoadmap
            tests={tests}
            progress={progress}
            onSelectTest={(id) => {
              setActiveTestId(id);
              setActiveTab("library");
            }}
          />
        ) : activeTab === "gym" ? (
          <MistakeGym
            tests={tests}
            progress={progress}
            onUpdateProgress={handleUpdateTestProgress}
            onSelectTest={(id, activeQNum) => {
              handleUpdateTestProgress(id, { lastActiveQuestionNumber: activeQNum });
              setActiveTestId(id);
              setActiveTab("library");
            }}
          />
        ) : activeTab === "history" ? (
          <ExamHistory
            historyItems={examHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onRetest={handleRetest}
          />
        ) : (
          <TestLibrary
            tests={tests}
            progress={progress}
            quote={activeQuote}
            onSelectTest={(id) => {
              setActiveTestId(id);
            }}
            onDeleteTest={handleDeleteTest}
            onOpenUpload={() => setShowUploadModal(true)}
            onRenameTest={handleRenameTest}
          />
        )}
      </div>

      {/* Premium Sticky Bottom Tab Navigation Bar */}
      {!activeTestId && (
        <div
          id="canvas-bottom-tabs"
          className="h-15 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-around select-none shrink-0 transition-colors"
        >
          {[
            { key: "library", label: "Workbooks", icon: BookOpen },
            { key: "roadmap", label: "Roadmap", icon: TrendingUp },
            { key: "gym", label: "Mistake Gym", icon: Dumbbell },
            { key: "history", label: "History", icon: History },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                id={`tab-button-${tab.key}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex flex-col items-center justify-center w-20 h-full transition-all cursor-pointer relative ${
                  isSelected
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 hover:text-slate-500"
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? "scale-110" : ""}`} />
                <span className={`text-[10px] mt-1 font-bold ${isSelected ? "text-indigo-650 dark:text-indigo-400 font-extrabold" : ""}`}>
                  {tab.label}
                </span>
                {isSelected && (
                  <span className="absolute bottom-1 w-5 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* PDF Scanned Parser Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Cloud Authentication and Settings Portal Modal */}
      {showSyncModal && (
        <SyncSettingsModal
          onClose={() => setShowSyncModal(false)}
          tests={tests}
          progress={progress}
          examHistory={examHistory}
          onImportCloudData={handleImportCloudData}
          syncEnabled={syncEnabled}
          onToggleSync={setSyncEnabled}
        />
      )}
    </MobileFrame>
  );
}
