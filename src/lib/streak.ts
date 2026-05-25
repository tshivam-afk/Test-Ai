import { ExamHistoryItem, TestProgress } from "../types";

const LOCAL_STORAGE_PRACTICE_DATES_KEY = "practice_companion_practice_dates_v2";

/**
 * Get YYYY-MM-DD date string in user's browser local time
 */
export function getLocalDateString(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Gets the manual practice dates stored in LocalStorage.
 */
export function getManualPracticeDates(): string[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_PRACTICE_DATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed loading manual practice dates:", e);
  }
  return [];
}

/**
 * Adds today's local date to the manual practice dates, if not already present.
 */
export function recordPracticeToday(): string[] {
  const dates = getManualPracticeDates();
  const today = getLocalDateString();
  if (!dates.includes(today)) {
    const updated = [...dates, today];
    try {
      localStorage.setItem(LOCAL_STORAGE_PRACTICE_DATES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed saving manual practice date:", e);
    }
    return updated;
  }
  return dates;
}

export interface StreakStats {
  currentStreak: number;
  bestStreak: number;
  practicedToday: boolean;
  practicedYesterday: boolean;
  allPracticedDates: string[]; // sorted ascending
  last7Days: {
    dateStr: string;
    dayLabel: string;
    practiced: boolean;
    isToday: boolean;
  }[];
}

/**
 * Calculates current streak, best streak, and past 7 days practice status
 */
export function calculateStreakStats(
  examHistory: ExamHistoryItem[],
  progress: Record<string, TestProgress>,
  manualPracticeDates: string[] = getManualPracticeDates()
): StreakStats {
  const uniqueDatesSet = new Set<string>();

  // 1. Gather dates from exam logs (ISO string timestamps)
  examHistory.forEach((item) => {
    try {
      if (item.dateTime) {
        const d = new Date(item.dateTime);
        if (!isNaN( d.getTime() )) {
          uniqueDatesSet.add(getLocalDateString(d));
        }
      }
    } catch {}
  });

  // 2. Gather dates from progress updates (when user has actually answered at least one question)
  Object.values(progress).forEach((prog) => {
    try {
      const hasAnswers = prog.answers && Object.keys(prog.answers).length > 0;
      if (hasAnswers && prog.lastUpdatedAt) {
        const d = new Date(prog.lastUpdatedAt);
        if (!isNaN( d.getTime() )) {
          uniqueDatesSet.add(getLocalDateString(d));
        }
      }
    } catch {}
  });

  // 3. Incorporate manual practice logs
  manualPracticeDates.forEach((dateStr) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      uniqueDatesSet.add(dateStr);
    }
  });

  // Convert to sorted array
  const sortedDates = Array.from(uniqueDatesSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const practicedToday = uniqueDatesSet.has(todayStr);
  const practicedYesterday = uniqueDatesSet.has(yesterdayStr);

  // Calculate current streak
  let currentStreak = 0;
  if (practicedToday) {
    currentStreak = 1;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const checkStr = getLocalDateString(checkDate);
      if (uniqueDatesSet.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (practicedYesterday) {
    currentStreak = 1;
    let checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const checkStr = getLocalDateString(checkDate);
      if (uniqueDatesSet.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best (longest) streak across history
  let bestStreak = 0;
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    bestStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      
      // Calculate difference in calendar days, using local strings to avoid timezone shift
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Since sorting can be influenced by time, re-verify if they are consecutive strings by looking at checkDate + 1 day
      const expectedNext = new Date(prevDate);
      expectedNext.setDate(expectedNext.getDate() + 1);
      const expectedNextStr = getLocalDateString(expectedNext);
      
      if (sortedDates[i] === expectedNextStr) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else if (sortedDates[i] !== sortedDates[i - 1]) {
        // Reset streak unless it's the exact same day
        tempStreak = 1;
      }
    }
    
    // Ensure bestStreak is at least equal to currentStreak
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  }

  // Generate last 7 days (including today as the last element)
  const last7Days: StreakStats["last7Days"] = [];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - i);
    const dayStr = getLocalDateString(dayDate);
    
    last7Days.push({
      dateStr: dayStr,
      dayLabel: daysOfWeek[dayDate.getDay()],
      practiced: uniqueDatesSet.has(dayStr),
      isToday: dayStr === todayStr,
    });
  }

  return {
    currentStreak,
    bestStreak,
    practicedToday,
    practicedYesterday,
    allPracticedDates: sortedDates,
    last7Days,
  };
}
