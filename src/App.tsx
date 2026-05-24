import { useState, useEffect } from "react";
import MobileFrame from "./components/MobileFrame";
import TestLibrary from "./components/TestLibrary";
import QuizView from "./components/QuizView";
import UploadModal from "./components/UploadModal";
import ThemeToggle from "./components/ThemeToggle";
import SplashScreen from "./components/SplashScreen";
import { getSampleTest } from "./data";
import { getBiologyMarathonTest } from "./biology_data";
import { Test, TestProgress } from "./types";

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
          // Ensure Biology Marathon is included automatically
          const hasBio = parsed.some((t: any) => t.id === "neet-biology-marathon-q91-180");
          if (!hasBio) {
            return [getBiologyMarathonTest(), ...parsed];
          }
          return parsed;
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

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {}
    return "light";
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // 2. Synchronize theme states automatically into document elements list
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
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
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleUploadSuccess = (newTest: Test) => {
    setTests((prev) => [newTest, ...prev]);
    setShowUploadModal(false);
    setActiveTestId(newTest.id); // Launch the test workspace immediately
  };

  const handleDeleteTest = (testId: string) => {
    // Wipe progress first, then remove from tests repository
    setProgress((prev) => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
    setTests((prev) => prev.filter((t) => t.id !== testId));
    if (activeTestId === testId) {
      setActiveTestId(null);
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
      return {
        ...prev,
        [testId]: updated,
      };
    });
  };

  const activeTest = tests.find((t) => t.id === activeTestId);
  const activeProgress = activeTestId ? getOrCreateProgressRecord(activeTestId) : undefined;

  return (
    <MobileFrame theme={theme}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Top Navbar Header */}
      <div
        id="app-header-bar"
        className="h-14 px-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/60 flex items-center justify-between select-none transition-colors"
      >
        <span
          onClick={() => {
            setActiveTestId(null);
          }}
          className="font-black text-sm tracking-widest text-slate-800 dark:text-zinc-100 uppercase cursor-pointer"
        >
          🎓 NEET PREP
        </span>

        {/* Global theme and configuration settings controls */}
        <div className="flex items-center gap-1.5">
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
          />
        ) : (
          <TestLibrary
            tests={tests}
            progress={progress}
            onSelectTest={(id) => {
              setActiveTestId(id);
            }}
            onDeleteTest={handleDeleteTest}
            onOpenUpload={() => setShowUploadModal(true)}
          />
        )}
      </div>

      {/* PDF Scanned Parser Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </MobileFrame>
  );
}
