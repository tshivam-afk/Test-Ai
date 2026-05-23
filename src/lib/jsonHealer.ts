import { Test, Question } from "../types";

/**
 * Robust JSON parsing and healing utility.
 * Attempts to repair malformed JSON format issues and convert irregular schemas
 * into valid Test objects with Questions matching the TypeScript interfaces.
 */
export function healAndParseJson(rawText: string): { success: boolean; data?: Test; error?: string; logs: string[] } {
  const logs: string[] = [];
  let cleanedText = rawText.trim();

  logs.push("Starting JSON self-healing scan...");

  if (!cleanedText) {
    return { success: false, error: "Text is empty.", logs };
  }

  // Phase 1: Direct JSON parsing attempt
  try {
    const rawObj = JSON.parse(cleanedText);
    logs.push("✨ Standard JSON parsed successfully on first attempt!");
    return conformToTestSchema(rawObj, logs);
  } catch (err: any) {
    logs.push(`⚠️ Standard JSON parsing failed: ${err.message}. Attempting syntax repairs...`);
  }

  // Phase 2: Syntax Level Repair Algorithms
  try {
    // 1. Repair unescaped line breaks in values
    // Often double quotes contain raw block newlines that crash standard JSON.parse.
    // Replace raw newlines inside strings with escaped \n (heuristic approach)
    // We can also clean up trailing commas in lists or maps.
    cleanedText = cleanedText
      // Wrap unquoted keys or single-quoted keys with double quotes
      .replace(/([{,]\s*)([a-zA-Z0-5_]+)\s*:/g, '$1"$2":')
      // Replace single-quoted string values with double quotes (whilst taking care not to ruin inner apostrophes)
      // We do a simple replacement for quote pairs where possible
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/\[\s*'([^']*)'/g, '[ "$1"')
      .replace(/'\s*([,\]}])/g, '"$1')
      // Clean up common trailing commas, e.g. [1, 2, 3,] -> [1, 2, 3] or {"a": 1,} -> {"a": 1}
      .replace(/,\s*([\]}])/g, "$1")
      // Clean up multiple trailing commas inside arrays or objects
      .replace(/,+/g, ",");

    // Fix trailing commas again after stripping double marks
    cleanedText = cleanedText.replace(/,\s*([\]}])/g, "$1");

    logs.push("Applied regex standardizations (fixed raw trailing commas and unquoted properties).");

    // 2. Bracket matching and self-closure heuristics
    // Count opening vs closing braces
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < cleanedText.length; i++) {
      const char = cleanedText[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === "{") openBraces++;
        if (char === "}") openBraces--;
        if (char === "[") openBrackets++;
        if (char === "]") openBrackets--;
      }
    }

    // Auto append missing closers to mend incomplete pastes
    if (openBrackets > 0) {
      logs.push(`🛠️ Found ${openBrackets} unmatched open bracket(s). Appending missing bracket(s).`);
      cleanedText += " ]".repeat(openBrackets);
    }
    if (openBraces > 0) {
      logs.push(`🛠️ Found ${openBraces} unmatched open brace(s). Appending missing brace(s).`);
      cleanedText += " }".repeat(openBraces);
    }

    // Try parsing again after syntactic repairs
    const repairedObj = JSON.parse(cleanedText);
    logs.push("🎉 Syntax-repaired JSON parsed successfully!");
    return conformToTestSchema(repairedObj, logs);
  } catch (err: any) {
    logs.push(`❌ Syntax repair failed: ${err.message}`);
  }

  // Phase 3: Final fallback - regex extraction of questions
  // Let's see if we can extract questions using aggressive regex if JSON structure is terminally damaged
  try {
    logs.push("🕵️ Entering aggressive regex recovery mode to extract fields from corrupted structure...");
    return extractViaRegex(rawText, logs);
  } catch (err: any) {
    logs.push(`💔 Recovery failed: ${err.message}`);
    return {
      success: false,
      error: "JSON is severely corrupted. Please check syntax or use a valid format.",
      logs,
    };
  }
}

/**
 * Conforms any parsed object (even with abnormal schemas) to the exact Test and Question interfaces.
 */
function conformToTestSchema(obj: any, logs: string[]): { success: boolean; data?: Test; error?: string; logs: string[] } {
  let finalTest: Partial<Test> = {};

  // Find where the questions array is located
  let rawQuestions: any[] = [];
  let testTitle = "Imported Practice Test";

  if (Array.isArray(obj)) {
    logs.push("Detected array-only format. Treating direct item arrays as questions.");
    rawQuestions = obj;
  } else if (obj && typeof obj === "object") {
    // Look for common title property names
    testTitle = obj.title || obj.testTitle || obj.name || obj.subject || "Imported Practice Test";
    
    // Look for common array fields
    if (Array.isArray(obj.questions)) {
      rawQuestions = obj.questions;
    } else if (Array.isArray(obj.QuestionList)) {
      logs.push("Normalizing key name 'QuestionList' to 'questions'.");
      rawQuestions = obj.QuestionList;
    } else if (Array.isArray(obj.quiz)) {
      logs.push("Normalizing key name 'quiz' to 'questions'.");
      rawQuestions = obj.quiz;
    } else if (Array.isArray(obj.items)) {
      logs.push("Normalizing key name 'items' to 'questions'.");
      rawQuestions = obj.items;
    } else {
      // Look for any array inside the object
      for (const key of Object.keys(obj)) {
        if (Array.isArray(obj[key])) {
          logs.push(`Inferred questions array from key: '${key}'.`);
          rawQuestions = obj[key];
          break;
        }
      }
    }
  }

  if (rawQuestions.length === 0) {
    logs.push("⚠️ Could not find an explicit array of questions. Searching for nested objects...");
    // What if the object keys are numeric (e.g. "1": { ... }, "2": { ... })?
    if (obj && typeof obj === "object") {
      const values = Object.values(obj);
      const isObjectList = values.every(v => typeof v === "object" && v !== null);
      if (isObjectList && values.length > 0) {
        logs.push("Normalizing indexed-object map into question arrays.");
        rawQuestions = values;
      }
    }
  }

  if (rawQuestions.length === 0) {
    return {
      success: false,
      error: "No questions array or question list could be extracted from this JSON structure.",
      logs
    };
  }

  // Clean and map individual questions
  const conformedQuestions: Question[] = [];
  logs.push(`Processing ${rawQuestions.length} suspected question entries...`);

  rawQuestions.forEach((q, index) => {
    if (!q || typeof q !== "object") return;

    // 1. Determine number
    const qNum = typeof q.number === "number" ? q.number : (index + 1);

    // 2. Extract questionText
    const qText = q.questionText || q.question || q.text || q.desc || q.title || `Question #${qNum}`;

    // 3. Extract options
    let qOptions: string[] = [];
    if (Array.isArray(q.options)) {
      qOptions = q.options.map((opt: any) => String(opt).trim());
    } else if (q.choices && Array.isArray(q.choices)) {
      qOptions = q.choices.map((c: any) => String(c).trim());
    } else {
      // Look for separate option properties e.g. optionA, option_1, etc.
      const oA = q.optionA || q.option_a || q.A || q.a || q.option1;
      const oB = q.optionB || q.option_b || q.B || q.b || q.option2;
      const oC = q.optionC || q.option_c || q.C || q.c || q.option3;
      const oD = q.optionD || q.option_d || q.D || q.d || q.option4;

      if (oA && oB) {
        qOptions = [String(oA), String(oB)];
        if (oC) qOptions.push(String(oC));
        if (oD) qOptions.push(String(oD));
        logs.push(`- Q.${qNum}: Extracted individual scalar options (e.g. optionA/B/C/D) into array.`);
      }
    }

    if (qOptions.length === 0) {
      qOptions = ["Option A", "Option B", "Option C", "Option D"];
      logs.push(`- Q.${qNum}: ⚠️ No options list found! Injected default options.`);
    }

    // 4. Resolve correct option index with maximum self-healing flexibility
    let correctIdx = 0;
    const rawCorrect = q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correctOption || q.answer || q.key || q.correct_answer || q.correct);

    if (typeof rawCorrect === "number") {
      // Ensure index is within boundaries
      correctIdx = Math.max(0, Math.min(rawCorrect, qOptions.length - 1));
    } else if (typeof rawCorrect === "string") {
      const parsedVal = rawCorrect.trim().toUpperCase();
      
      // Checking letter patterns (A=0, B=1, etc.)
      if (parsedVal === "A" || parsedVal === "1") correctIdx = 0;
      else if (parsedVal === "B" || parsedVal === "2") correctIdx = 1;
      else if (parsedVal === "C" || parsedVal === "3") correctIdx = 2;
      else if (parsedVal === "D" || parsedVal === "4") correctIdx = 3;
      else {
        // Option text match fallback:
        // What if correctOption is the matching text of the correct option string?
        const matchIdx = qOptions.findIndex(o => o.toLowerCase() === parsedVal.toLowerCase() || o.toLowerCase().includes(parsedVal.toLowerCase()));
        if (matchIdx >= 0) {
          correctIdx = matchIdx;
          logs.push(`- Q.${qNum}: Matched correct key string "${parsedVal}" to option index ${matchIdx}.`);
        } else {
          // Attempt integer parsing
          const num = parseInt(parsedVal, 10);
          if (!isNaN(num)) {
            // Check if 1-indexed can be converted to 0-indexed
            correctIdx = num > 0 ? (num - 1) % qOptions.length : 0;
          } else {
            correctIdx = 0;
          }
        }
      }
    }

    // 5. Get solution explanation or fallback
    const qSol = q.solution || q.explanation || q.hint || q.reason || "Refer to core NCERT/NEET guidelines.";

    // 6. Get subject or fallback
    const qSubCode = q.subject || q.category || q.topic || "Biology";

    conformedQuestions.push({
      number: qNum,
      subject: String(qSubCode),
      questionText: String(qText),
      options: qOptions,
      correctOptionIndex: correctIdx,
      solution: String(qSol)
    });
  });

  if (conformedQuestions.length === 0) {
    return {
      success: false,
      error: "Extracted queston list was empty or invalid.",
      logs
    };
  }

  // Ensure questions are sorted by question number
  conformedQuestions.sort((a, b) => a.number - b.number);

  finalTest = {
    id: `repaired-${Date.now()}`,
    title: String(testTitle),
    questions: conformedQuestions,
    createdAt: new Date().toISOString()
  };

  logs.push(`✅ Successfully healed and validated workspace with ${conformedQuestions.length} conformed questions.`);
  return { success: true, data: finalTest as Test, logs };
}

/**
 * Super fallback parser using regular expression scans to extract individual questions
 * when the paste is incredibly mangled (e.g. cut off midway through, missing entire brackets layers).
 */
function extractViaRegex(rawText: string, logs: string[]): { success: boolean; data?: Test; error?: string; logs: string[] } {
  const conformedQuestions: Question[] = [];
  
  // Look for blocks containing question text, options, answers
  // Splits by words like "questionText", "question", etc.
  const questionBlocks = rawText.split(/(?={"question"|"questionText"|{\s*"number"|{\s*"q"\s*:)/gi);
  
  logs.push(`Aggressive regex split found ${questionBlocks.length} suspicious text blocks.`);

  questionBlocks.forEach((block, idx) => {
    if (block.trim().length < 50) return; // Ignore small noise blocks

    // Try extracting question text
    const qTextMatch = block.match(/"(?:questionText|question|text)"\s*:\s*"([^"]+)"/i);
    const qText = qTextMatch ? qTextMatch[1] : null;
    if (!qText) return;

    // Try extracting options array or choices list
    let options: string[] = [];
    const optionsBlockMatch = block.match(/"(?:options|choices)"\s*:\s*\[([^\]]+)\]/i);
    if (optionsBlockMatch) {
      const optionsRaw = optionsBlockMatch[1];
      // Split by double-quoted values
      const matches = optionsRaw.match(/"([^"]+)"/g);
      if (matches) {
        options = matches.map(m => m.replace(/^"|"$/g, "").trim());
      }
    } else {
      // Look for individual properties like "option1", etc.
      const individualMatches = block.match(/"(?:optionA|option_a|option1|A)"\s*:\s*"([^"]+)"/gi);
      if (individualMatches) {
        options = individualMatches.map(m => {
          const parts = m.split(":");
          return parts[1] ? parts[1].replace(/^[ \t"']+|[ \t"']+$/g, "") : "";
        });
      }
    }

    if (options.length === 0) {
      options = ["Option A", "Option B", "Option C", "Option D"];
    }

    // Try extracting correct option index
    const correctMatch = block.match(/"(?:correctOptionIndex|correctOption|answer|key)"\s*:\s*(?:"([^"]+)"|(\d+))/i);
    let correctIdx = 0;
    if (correctMatch) {
      const val = correctMatch[1] || correctMatch[2];
      if (val) {
        if (/[A-D]/i.test(val)) {
          const letter = val.toUpperCase();
          if (letter === "A") correctIdx = 0;
          if (letter === "B") correctIdx = 1;
          if (letter === "C") correctIdx = 2;
          if (letter === "D") correctIdx = 3;
        } else {
          const parsedNum = parseInt(val, 10);
          if (!isNaN(parsedNum)) {
            correctIdx = parsedNum >= 4 ? parsedNum % 4 : parsedNum;
          }
        }
      }
    }

    // Solution explanation
    const solMatch = block.match(/"(?:solution|explanation|reason)"\s*:\s*"([^"]+)"/i);
    const solution = solMatch ? solMatch[1] : "Refer to core NCERT/NEET guidelines.";

    // Subject topic
    const subMatch = block.match(/"(?:subject|category|topic)"\s*:\s*"([^"]+)"/i);
    const subject = subMatch ? subMatch[1] : "Biology";

    conformedQuestions.push({
      number: conformedQuestions.length + 1,
      subject,
      questionText: qText,
      options,
      correctOptionIndex: correctIdx,
      solution
    });
  });

  if (conformedQuestions.length > 0) {
    const finalTest: Test = {
      id: `regex-recovered-${Date.now()}`,
      title: "Extracted Practice Sheet",
      questions: conformedQuestions,
      createdAt: new Date().toISOString()
    };
    logs.push(`🎉 Recovered ${conformedQuestions.length} complete questions via aggressive pattern regex matching!`);
    return { success: true, data: finalTest, logs };
  }

  return {
    success: false,
    error: "Syntax corrupted beyond recovery. Regex scanner could not map question patterns.",
    logs
  };
}
