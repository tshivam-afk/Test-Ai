package com.lumen.neetprep.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import kotlin.OptIn
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumen.neetprep.data.LocalStorageManager
import com.lumen.neetprep.models.ExamHistoryItem
import com.lumen.neetprep.models.Question
import com.lumen.neetprep.models.Score
import com.lumen.neetprep.models.Test
import com.lumen.neetprep.models.TestProgress
import kotlinx.coroutines.delay
import java.util.*


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizScreen(
    test: Test,
    mode: String, // "study" or "exam"
    storageManager: LocalStorageManager,
    onBackToLibrary: () -> Unit
) {
    // Load pre-existing state
    val initialProgress = remember { storageManager.getProgress(test.id) }
    
    var currentIdx by remember { mutableStateOf(0) }
    var answers by remember { mutableStateOf(initialProgress?.answers ?: emptyMap()) }
    var flagged by remember { mutableStateOf(initialProgress?.flagged ?: emptyList()) }
    var bookmarked by remember { mutableStateOf(initialProgress?.bookmarked ?: emptyList()) }
    var notes by remember { mutableStateOf(initialProgress?.userNotes ?: emptyMap()) }
    var confidences by remember { mutableStateOf(initialProgress?.confidences ?: emptyMap()) }
    
    var timeSpent by remember { mutableLongStateOf(initialProgress?.timeSpent ?: 0L) }
    var isSubmitted by remember { mutableStateOf(initialProgress?.completed ?: false) }
    
    var activeNoteInput by remember { mutableStateOf("") }
    var showGridSheet by remember { mutableStateOf(false) }

    val questions = test.questions
    val currentQuestion = questions.getOrNull(currentIdx) ?: return

    // Timer Loop
    LaunchedEffect(isSubmitted) {
        if (!isSubmitted) {
            while (true) {
                delay(1000L)
                timeSpent += 1L
                
                // Backup/Save check-point progress state every 5 seconds
                if (timeSpent % 5 == 0L) {
                    val currentProgress = TestProgress(
                        testId = test.id,
                        answers = answers,
                        flagged = flagged,
                        bookmarked = bookmarked,
                        userNotes = notes,
                        confidences = confidences,
                        timeSpent = timeSpent,
                        completed = false,
                        lastActiveQuestionNumber = currentQuestion.number,
                        lastUpdatedAt = Calendar.getInstance().time.toString(),
                        mode = mode
                    )
                    storageManager.saveProgress(currentProgress)
                }
            }
        }
    }

    // Load active notes
    LaunchedEffect(currentIdx) {
        activeNoteInput = notes[currentQuestion.number.toString()] ?: ""
    }

    val totalCorrect = remember(isSubmitted, answers) {
        if (!isSubmitted) 0 else {
            questions.count { answers[it.number.toString()] == it.correctOptionIndex }
        }
    }
    val totalIncorrect = remember(isSubmitted, answers) {
        if (!isSubmitted) 0 else {
            questions.count { answers.containsKey(it.number.toString()) && answers[it.number.toString()] != it.correctOptionIndex }
        }
    }
    val totalBlank = remember(isSubmitted, answers) {
        if (!isSubmitted) 0 else {
            questions.count { !answers.containsKey(it.number.toString()) }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(getThemeBg())
    ) {
        // TOP CONTROLLER HEADER
        TopAppBar(
            title = {
                Column {
                    Text(text = test.title.take(30) + "...", fontSize = 14.sp, fontWeight = FontWeight.Black)
                    Text(
                        text = "Current Mode: " + mode.uppercase(),
                        fontSize = 10.sp,
                        color = if (mode == "study") Teal600 else Color.Red,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            navigationIcon = {
                IconButton(onClick = onBackToLibrary) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                }
            },
            actions = {
                // Ticker display
                val mins = timeSpent / 60
                val secs = timeSpent % 60
                Text(
                    text = String.format("%02d:%02d", mins, secs),
                    fontWeight = FontWeight.Black,
                    fontSize = 13.sp,
                    color = getThemeText(),
                    modifier = Modifier.padding(end = 12.dp)
                )

                IconButton(onClick = { showGridSheet = !showGridSheet }) {
                    Icon(imageVector = Icons.Default.GridView, contentDescription = "Syllabus Map")
                }
            }
        )

        if (isSubmitted) {
            // EXAM RESULTS PERFORMANCE SUMMARY VIEW
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = getThemeCardBg()),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Exam Complete! 🎓", fontSize = 20.sp, fontWeight = FontWeight.Black, color = getThemeText())
                        Spacer(modifier = Modifier.height(16.dp))

                        val scorePoints = (totalCorrect * 4) - totalIncorrect
                        Text(
                            text = "$scorePoints PTS",
                            fontSize = 42.sp,
                            fontWeight = FontWeight.Black,
                            color = if (scorePoints > 0) Teal600 else Color.Red
                        )
                        Text("NEET Score weight metrics (+4 | -1)", fontSize = 11.sp, color = Color.Gray)

                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Correct ✅", fontSize = 11.sp, color = Color.Gray)
                                Text("$totalCorrect", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Teal600)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Incorrect ❌", fontSize = 11.sp, color = Color.Gray)
                                Text("$totalIncorrect", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.Red)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Unanswered ⚪", fontSize = 11.sp, color = Color.Gray)
                                Text("$totalBlank", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.Gray)
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                // Clear progress & retry
                                val progress = TestProgress(
                                    testId = test.id,
                                    completed = false
                                )
                                storageManager.saveProgress(progress)
                                answers = emptyMap()
                                flagged = emptyList()
                                bookmarked = emptyList()
                                notes = emptyMap()
                                confidences = emptyMap()
                                timeSpent = 0L
                                isSubmitted = false
                                currentIdx = 0
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Retest Challenge")
                        }
                    }
                }
            }
        } else {
            // MAIN QUESTION PAGER AND PANEL
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Progress stats bar tracker
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Question ${currentIdx + 1} of ${questions.size}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(
                            imageVector = if (bookmarked.contains(currentQuestion.number)) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder,
                            contentDescription = "Bookmark",
                            tint = if (bookmarked.contains(currentQuestion.number)) Amber500 else Color.LightGray,
                            modifier = Modifier
                                .size(24.dp)
                                .clickable {
                                    val updated = bookmarked.toMutableList()
                                    if (updated.contains(currentQuestion.number)) updated.remove(currentQuestion.number) else updated.add(currentQuestion.number)
                                    bookmarked = updated
                                }
                        )
                        Icon(
                            imageVector = if (flagged.contains(currentQuestion.number)) Icons.Default.Flag else Icons.Outlined.Flag,
                            contentDescription = "Flag",
                            tint = if (flagged.contains(currentQuestion.number)) Color.Red else Color.LightGray,
                            modifier = Modifier
                                .size(24.dp)
                                .clickable {
                                    val updated = flagged.toMutableList()
                                    if (updated.contains(currentQuestion.number)) updated.remove(currentQuestion.number) else updated.add(currentQuestion.number)
                                    flagged = updated
                                }
                        )
                    }
                }

                // Question Box
                Card(
                    colors = CardDefaults.cardColors(containerColor = getThemeCardBg()),
                    shape = RoundedCornerShape(20.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = currentQuestion.subject.uppercase(),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = Indigo600
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = currentQuestion.questionText,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Medium,
                            color = getThemeText()
                        )
                    }
                }

                // Options Lists
                val selectedOption = answers[currentQuestion.number.toString()]
                currentQuestion.options.forEachIndexed { optIdx, optionText ->
                    val isSelected = selectedOption == optIdx
                    val optionBg = if (isSelected) {
                        if (mode == "study") {
                            if (optIdx == currentQuestion.correctOptionIndex) Color(0xFFD1FAE5) else Color(0xFFFEE2E2)
                        } else Indigo600.copy(alpha = 0.08f)
                    } else getThemeCardBg()

                    val optionBorder = if (isSelected) {
                        if (mode == "study") {
                            if (optIdx == currentQuestion.correctOptionIndex) BorderStroke(2.dp, Teal600) else BorderStroke(2.dp, Color.Red)
                        } else BorderStroke(2.dp, Indigo600)
                    } else null

                    Card(
                        colors = CardDefaults.cardColors(containerColor = optionBg),
                        shape = RoundedCornerShape(14.dp),
                        border = optionBorder,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (!isSubmitted) {
                                    val updatedAnswers = answers.toMutableMap()
                                    updatedAnswers[currentQuestion.number.toString()] = optIdx

                                    // Auto-mark Confidence level to confident ("sure") to satisfy user auto-progress request
                                    val updatedConfidences = confidences.toMutableMap()
                                    if (!updatedConfidences.containsKey(currentQuestion.number.toString())) {
                                        updatedConfidences[currentQuestion.number.toString()] = "sure"
                                    }

                                    answers = updatedAnswers
                                    confidences = updatedConfidences

                                    // Save Progress
                                    val progress = TestProgress(
                                        testId = test.id,
                                        answers = updatedAnswers,
                                        flagged = flagged,
                                        bookmarked = bookmarked,
                                        userNotes = notes,
                                        confidences = updatedConfidences,
                                        timeSpent = timeSpent,
                                        completed = false,
                                        lastActiveQuestionNumber = currentQuestion.number,
                                        lastUpdatedAt = Calendar.getInstance().time.toString(),
                                        mode = mode
                                    )
                                    storageManager.saveProgress(progress)
                                }
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "(${optIdx + 1})",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = if (isSelected && mode != "study") Indigo600 else Color.Gray,
                                modifier = Modifier.padding(end = 12.dp)
                            )
                            Text(
                                text = optionText,
                                fontSize = 13.sp,
                                color = getThemeText()
                            )
                        }
                    }
                }

                // Show Solution immediate validation block on STUDY mode on selected option
                if (mode == "study" && selectedOption != null) {
                    AnimatedVisibility(visible = true) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F5F9)),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text(
                                    text = if (selectedOption == currentQuestion.correctOptionIndex) "Correct Answer! 🎉" else "Incorrect Match 🔍",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (selectedOption == currentQuestion.correctOptionIndex) Teal600 else Color.Red
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = currentQuestion.solution, fontSize = 12.sp, color = Color.DarkGray)
                            }
                        }
                    }
                }

                // Personal written Notes box
                Card(
                    colors = CardDefaults.cardColors(containerColor = getThemeCardBg()),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text("Add study reference notes...", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = activeNoteInput,
                            onValueChange = {
                                activeNoteInput = it
                                val updatedNotes = notes.toMutableMap()
                                updatedNotes[currentQuestion.number.toString()] = it
                                notes = updatedNotes
                            },
                            placeholder = { Text("E.g., Formula derivation, biology textbook page 112...") },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(fontSize = 12.sp),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                }

                // Navigation Prev / Next Control strip
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedButton(
                        onClick = { if (currentIdx > 0) currentIdx-- },
                        enabled = currentIdx > 0,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.ArrowBackIos, contentDescription = "Prev", modifier = Modifier.size(14.dp))
                        Text("Prev", fontSize = 13.sp)
                    }

                    if (currentIdx == questions.size - 1) {
                        Button(
                            onClick = {
                                isSubmitted = true
                                // Compile final score
                                val correctC = questions.count { answers[it.number.toString()] == it.correctOptionIndex }
                                val incorrectC = questions.count { answers.containsKey(it.number.toString()) && answers[it.number.toString()] != it.correctOptionIndex }
                                val blankC = questions.count { !answers.containsKey(it.number.toString()) }
                                val totalPoints = (correctC * 4) - incorrectC

                                val score = Score(
                                    correctCount = correctC,
                                    incorrectCount = incorrectC,
                                    blankCount = blankC,
                                    finalScore = totalPoints
                                )

                                val progress = TestProgress(
                                    testId = test.id,
                                    answers = answers,
                                    flagged = flagged,
                                    bookmarked = bookmarked,
                                    userNotes = notes,
                                    confidences = confidences,
                                    timeSpent = timeSpent,
                                    completed = true,
                                    score = score,
                                    lastActiveQuestionNumber = currentQuestion.number,
                                    lastUpdatedAt = Calendar.getInstance().time.toString(),
                                    mode = mode
                                )
                                storageManager.saveProgress(progress)

                                // Add item to history log
                                val historyItem = ExamHistoryItem(
                                    id = UUID.randomUUID().toString(),
                                    testId = test.id,
                                    testTitle = test.title,
                                    dateTime = Calendar.getInstance().time.toString(),
                                    timeSpent = timeSpent,
                                    score = score,
                                    answers = answers,
                                    confidences = confidences,
                                    questions = questions
                                )
                                storageManager.addHistoryItem(historyItem)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Teal600),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = "Submit", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Complete Exam", fontSize = 13.sp)
                        }
                    } else {
                        Button(
                            onClick = { if (currentIdx < questions.size - 1) currentIdx++ },
                            colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Next", fontSize = 13.sp)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(Icons.Default.ArrowForwardIos, contentDescription = "Next", modifier = Modifier.size(14.dp))
                        }
                    }
                }
            }
        }

        // Questions Sheet Grid Overlay
        if (showGridSheet) {
            AlertDialog(
                onDismissRequest = { showGridSheet = false },
                confirmButton = {
                    TextButton(onClick = { showGridSheet = false }) {
                        Text("Dismiss Map")
                    }
                },
                title = { Text("Jump to syllabus question", fontSize = 15.sp, fontWeight = FontWeight.Bold) },
                text = {
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(5),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(questions.size) { index ->
                            val qNumber = questions[index].number
                            val isAnswered = answers.containsKey(qNumber.toString())
                            val isFlagged = flagged.contains(qNumber)
                            val isBookmarked = bookmarked.contains(qNumber)
                            
                            val bg = if (currentIdx == index) Indigo600 else {
                                if (isAnswered) Teal600.copy(alpha = 0.15f) else Color(0xFFF1F5F9)
                            }
                            val textColor = if (currentIdx == index) Color.White else getThemeText()

                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(bg)
                                    .clickable {
                                        currentIdx = index
                                        showGridSheet = false
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${index + 1}",
                                    color = textColor,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                // Flags indicators overlay
                                Row(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(2.dp),
                                    horizontalArrangement = Arrangement.spacedBy(1.dp)
                                ) {
                                    if (isFlagged) {
                                        Box(modifier = Modifier.size(4.dp).clip(CircleShape).background(Color.Red))
                                    }
                                    if (isBookmarked) {
                                        Box(modifier = Modifier.size(4.dp).clip(CircleShape).background(Amber500))
                                    }
                                }
                            }
                        }
                    }
                }
            )
        }
    }
}
