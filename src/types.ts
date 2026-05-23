export interface Question {
  number: number;
  subject: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  solution: string;
}

export interface Test {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  isSample?: boolean;
}

export interface TestProgress {
  testId: string;
  answers: Record<number, number>; // Maps question number to selected option index (0-3)
  flagged: number[]; // Array of flagged question numbers
  bookmarked: number[]; // Array of bookmarked question numbers for focused lists
  userNotes: Record<number, string>; // Maps question number to custom written study notes
  confidences?: Record<number, string>; // Maps question number to confidence level ('sure' | 'guess' | 'doubt')
  timeSpent: number; // Time elapsed in seconds
  completed: boolean;
  score?: {
    correctCount: number;
    incorrectCount: number;
    blankCount: number;
    finalScore: number;
  };
  lastActiveQuestionNumber: number;
  lastUpdatedAt: string;
}

export interface AppState {
  tests: Test[];
  progress: Record<string, TestProgress>; // Maps testId to progress
  activeTestId: string | null;
  practiceMode: "study" | "exam"; // study = immediate solution validation, exam = summary review on complete
  theme: "light" | "dark";
}
