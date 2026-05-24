package com.lumen.neetprep.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumen.neetprep.audio.AudioSynthManager
import com.lumen.neetprep.data.LocalStorageManager
import com.lumen.neetprep.models.ExamHistoryItem
import com.lumen.neetprep.models.PlannerTask
import com.lumen.neetprep.models.Test
import com.lumen.neetprep.models.TestProgress
import kotlinx.coroutines.delay
import java.util.*

// Style Constants for Amber, Indigo, Dark Theme Palette
val SlateDark = Color(0xFF0F172A)
val Indigo600 = Color(0xFF4F46E5)
val Teal600 = Color(0xFF0D9488)
val Amber500 = Color(0xFFF59E0B)
val LightBg = Color(0xFFF8FAFC)

// --- LIBRARY SCREEN ---
@Composable
fun LibraryScreen(
    tests: List<Test>,
    onSelectTest: (Test, String) -> Unit, // (test, mode)
    storageManager: LocalStorageManager,
    onNavigateToPlanner: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val progressList = remember { storageManager.getProgressList() }
    val plannerTasks = remember { storageManager.getPlannerTasks() }
    val uncompletedTasks = plannerTasks.filter { !it.completed }.size

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Lumen NEET Prep Desk",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark,
            fontFamily = FontFamily.SansSerif
        )
        Text(
            text = "Master your NCERT biology, physical chemistry and physics",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Study Planner Warning Widget
        if (uncompletedTasks > 0) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
                    .clickable { onNavigateToPlanner() }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.AssignmentAlert,
                        contentDescription = "Alert",
                        tint = Amber500,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "You have $uncompletedTasks agenda task${if (uncompletedTasks > 1) "s" else ""} left today!",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13sp,
                            color = Color(0xFF92400E)
                        )
                        Text(
                            text = "Tap here to view your NEET disciplines planner.",
                            fontSize = 10sp,
                            color = Color(0xFFB45309)
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = "Go",
                        tint = Color(0xFFB45309),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search syllabus, chapter mock exams...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(12.dp),
            singleLine = true
        )

        val filteredTests = tests.filter {
            it.title.contains(searchQuery, ignoreCase = true)
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
            items(filteredTests) { test ->
                val progress = progressList.find { it.testId == test.id }
                val completedCount = progress?.answers?.size ?: 0
                val totalQuestions = test.questions.size
                val pct = if (totalQuestions > 0) (completedCount * 100) / totalQuestions else 0

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = test.title,
                            fontSize = 16sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateDark
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = "Created",
                                tint = Color.LightGray,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Syllabus • $totalQuestions Questions",
                                fontSize = 11sp,
                                color = Color.Gray
                            )
                        }

                        if (progress != null) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                LinearProgressIndicator(
                                    progress = pct / 100f,
                                    color = Indigo600,
                                    trackColor = Color(0xFFE2E8F0),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(6.dp)
                                        .clip(CircleShape)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = "$pct% done",
                                    fontSize = 11sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Indigo600
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { onSelectTest(test, "study") },
                                colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.ChromeReaderMode, contentDescription = "Study", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Study Mode", fontSize = 11sp)
                            }
                            OutlinedButton(
                                onClick = { onSelectTest(test, "exam") },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Teal600),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.HourglassEmpty, contentDescription = "Exam", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Exam Mode", fontSize = 11sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- MISTAKE GYM SCREEN ---
@Composable
fun GymScreen(
    tests: List<Test>,
    storageManager: LocalStorageManager
) {
    val progressList = remember { storageManager.getProgressList() }
    val incorrectQuestions = remember {
        val mistakes = mutableListOf<Pair<Test, com.lumen.neetprep.models.Question>>()
        for (progress in progressList) {
            val test = tests.find { it.id == progress.testId } ?: continue
            for (q in test.questions) {
                val answeredIdx = progress.answers[q.number]
                if (answeredIdx != null && answeredIdx != q.correctOptionIndex) {
                    mistakes.add(test to q)
                }
            }
        }
        mistakes
    }

    var selectedMistake by remember { mutableStateOf<Pair<Test, com.lumen.neetprep.models.Question>?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Mistake Gym 💪",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark
        )
        Text(
            text = "Your personalized errors workbook. High-yield correction yields higher scores.",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        if (incorrectQuestions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.SentimentSatisfiedAlt,
                        contentDescription = "Clean",
                        tint = Teal600,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Your Gym is clean! No incorrect questions.", fontSize = 14sp, color = Color.Gray, fontWeight = FontWeight.Bold)
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                items(incorrectQuestions) { (test, question) ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedMistake = test to question }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = question.subject,
                                    fontSize = 10sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    modifier = Modifier
                                        .background(Color.Red, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                                Text(
                                    text = "Book: ${test.title.take(12)}...",
                                    fontSize = 10sp,
                                    color = Color.Gray
                                )
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Problem Q${question.number}: ${question.questionText}",
                                fontSize = 13sp,
                                maxLines = 3,
                                color = SlateDark,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Tap to review correct solutions & formulas.",
                                fontSize = 11sp,
                                fontWeight = FontWeight.Bold,
                                color = Indigo600
                            )
                        }
                    }
                }
            }
        }

        // Solution Dialog Modal
        if (selectedMistake != null) {
            val (test, question) = selectedMistake!!
            AlertDialog(
                onDismissRequest = { selectedMistake = null },
                confirmButton = {
                    TextButton(onClick = { selectedMistake = null }) {
                        Text("Close solutions Gym")
                    }
                },
                title = {
                    Text(
                        text = "Question ${question.number} Error Analysis",
                        fontSize = 16sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateDark
                    )
                },
                text = {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .maxHeight(0.6f)
                    ) {
                        Text(
                            text = question.questionText,
                            fontSize = 13sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Divider(modifier = Modifier.padding(bottom = 12.dp))
                        Text(
                            text = "Correct Option: (${question.correctOptionIndex + 1}) \n${question.options[question.correctOptionIndex]}",
                            fontSize = 13sp,
                            fontWeight = FontWeight.Bold,
                            color = Teal600,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Text(
                            text = "Physics/Botany Core Solution Guide:",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12sp,
                            color = SlateDark
                        )
                        Text(
                            text = question.solution,
                            fontSize = 12sp,
                            color = Color.DarkGray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            )
        }
    }
}

// --- HISTORY SCREEN ---
@Composable
fun HistoryScreen(
    storageManager: LocalStorageManager,
    onDeleteHistory: (String) -> Unit
) {
    val historyList = remember { storageManager.getHistoryList() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Exam Attempt History 📜",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark
        )
        Text(
            text = "Track your speed, negative marks and overall performance logs.",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        if (historyList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text("No previous exam histories. Complete a timed exam tab to log!", fontSize = 13sp, color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                items(historyList) { item ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = item.dateTime.take(16).replace("T", " "),
                                    fontSize = 10sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Gray
                                )
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete",
                                    tint = Color.LightGray,
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clickable { onDeleteHistory(item.id) }
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = item.testTitle,
                                fontSize = 15sp,
                                fontWeight = FontWeight.Bold,
                                color = SlateDark
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Final Score", fontSize = 10sp, color = Color.Gray)
                                    Text(
                                        text = "${item.score.finalScore} PTS",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 16sp,
                                        color = if (item.score.finalScore >= 15) Teal600 else Color.Red
                                    )
                                }
                                Column {
                                    Text("Correct", fontSize = 10sp, color = Color.Gray)
                                    Text(
                                        text = "${item.score.correctCount} answers",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12sp,
                                        color = Teal600
                                    )
                                }
                                Column {
                                    Text("Pace Index", fontSize = 10sp, color = Color.Gray)
                                    val pace = if (item.questions.isNotEmpty()) item.timeSpent / item.questions.size else 0
                                    Text(
                                        text = "${pace}s / q",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12sp,
                                        color = Indigo600
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- PLANNER SCREEN ---
@Composable
fun PlannerScreen(
    storageManager: LocalStorageManager
) {
    var rawTasks by remember { mutableStateOf(storageManager.getPlannerTasks()) }
    var taskText by remember { mutableStateOf("") }
    var selectedSubject by remember { mutableStateOf("Physics") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Daily Planner Desk 📝",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark
        )
        Text(
            text = "Track daily practice targets structure by NEET core subject catalogs.",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Task Form Setup
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                OutlinedTextField(
                    value = taskText,
                    onValueChange = { taskText = it },
                    placeholder = { Text("Task description (e.g., Read plant physiology block...)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    listOf("Physics", "Chemistry", "Biology", "General").forEach { sub ->
                        val isSelected = selectedSubject == sub
                        Button(
                            onClick = { selectedSubject = sub },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isSelected) Indigo600 else Color(0xFFF1F5F9),
                                contentColor = if (isSelected) Color.White else Color.DarkGray
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(2.dp)
                        ) {
                            Text(sub, fontSize = 9sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        if (taskText.isNotBlank()) {
                            val newTask = PlannerTask(
                                id = UUID.randomUUID().toString(),
                                text = taskText,
                                subject = selectedSubject,
                                createdAt = Calendar.getInstance().time.toString()
                            )
                            val updatedList = listOf(newTask) + rawTasks
                            rawTasks = updatedList
                            storageManager.savePlannerTasks(updatedList)
                            taskText = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Add study target to today")
                }
            }
        }

        // Checklist Targets
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.weight(1f)) {
            items(rawTasks) { task ->
                val badgeColor = when (task.subject) {
                    "Physics" -> Indigo600
                    "Chemistry" -> Teal600
                    "Biology" -> Color(0xFF16A34A)
                    else -> Amber500
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = task.completed,
                            onCheckedChange = { isChecked ->
                                val updated = rawTasks.map {
                                    if (it.id == task.id) it.copy(completed = isChecked) else it
                                }
                                rawTasks = updated
                                storageManager.savePlannerTasks(updated)
                            }
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.subject.uppercase(),
                                fontSize = 8sp,
                                color = badgeColor,
                                fontWeight = FontWeight.Black
                            )
                            Text(
                                text = task.text,
                                fontSize = 13sp,
                                fontWeight = FontWeight.Medium,
                                color = if (task.completed) Color.LightGray else SlateDark
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Remove",
                            tint = Color.LightGray,
                            modifier = Modifier
                                .size(20.dp)
                                .clickable {
                                    val updated = rawTasks.filter { it.id != task.id }
                                    rawTasks = updated
                                    storageManager.savePlannerTasks(updated)
                                }
                        )
                    }
                }
            }
        }
    }
}

// --- RELAX SCREEN ---
@Composable
fun RelaxScreen(
    synthManager: AudioSynthManager
) {
    var breathePhase by remember { mutableStateOf("Breathe Room") }
    var breatheProgress by remember { mutableFloatStateOf(0f) }
    var activeSynthType by remember { mutableStateOf<AudioSynthManager.WavesType?>(null) }

    // Coroutine controller to handle dynamic Box Breathing loops
    LaunchedEffect(Unit) {
        val cycleTime = 4000L
        while (true) {
            breathePhase = "Inhale (4s) 🌬️"
            animate(0f, 1f, animationSpec = tween(4000, easing = LinearEasing)) { v, _ -> breatheProgress = v }
            
            breathePhase = "Hold Core (4s) 🧘"
            animate(1f, 1f, animationSpec = tween(4000, easing = LinearEasing)) { v, _ -> breatheProgress = v }
            
            breathePhase = "Exhale (4s) 💨"
            animate(1f, 0f, animationSpec = tween(4000, easing = LinearEasing)) { v, _ -> breatheProgress = v }
            
            breathePhase = "Suspend hold (4s) 🌿"
            animate(0f, 0f, animationSpec = tween(4000, easing = LinearEasing)) { v, _ -> breatheProgress = v }
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            synthManager.stopSynth()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Stress Release Room 💆",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark,
            modifier = Modifier.align(Alignment.Start)
        )
        Text(
            text = "Calm your nervous system and increase neural focus plasticity.",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier
                .align(Alignment.Start)
                .padding(bottom = 24.dp)
        )

        // Box Breathing Visual Spheres
        Box(
            modifier = Modifier
                .size(180.dp)
                .clip(CircleShape)
                .background(Color(0xFFEEF2F6))
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            val scaleRatio = 1f + (breatheProgress * 0.4f)
            Box(
                modifier = Modifier
                    .size((140 * scaleRatio).dp)
                    .clip(CircleShape)
                    .background(Indigo600.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size((100 * scaleRatio).dp)
                        .clip(CircleShape)
                        .background(Indigo600.copy(alpha = 0.35f))
                )
            }
            Text(
                text = breathePhase,
                fontSize = 11sp,
                fontWeight = FontWeight.Black,
                color = SlateDark
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "Focus Wave Generator Synthesizer",
            fontWeight = FontWeight.Bold,
            fontSize = 14sp,
            color = SlateDark
        )
        Text(
            text = "Custom generated binaural sounds streaming purely out of your CPU offline.",
            fontSize = 10sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        listOf(
            Triple(AudioSynthManager.WavesType.ALPHA_FOCUS, "Alpha Focus (160Hz + Flutter)", "Increases deep visual concentration"),
            Triple(AudioSynthManager.WavesType.GAMMA_CONSOLIDATE, "40Hz Gamma Sweep", "Assists fast conceptual working memory"),
            Triple(AudioSynthManager.WavesType.BROWN_NOISE, "Brown Noise Rumble", "Masks household distractions perfectly"),
            Triple(AudioSynthManager.WavesType.COSMIC_DELTA, "Cosmic Delta Oscillation", "Soothing low-end sweep for stress")
        ).forEach { (type, title, description) ->
            val isActive = activeSynthType == type
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isActive) Indigo600.copy(alpha = 0.08f) else Color.White
                ),
                shape = RoundedCornerShape(12.dp),
                border = if (isActive) BorderStroke(1.5.dp, Indigo600) else null,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clickable {
                        if (isActive) {
                            synthManager.stopSynth()
                            activeSynthType = null
                        } else {
                            synthManager.startSynth(type)
                            activeSynthType = type
                        }
                    }
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (isActive) Icons.Default.PauseCircleFilled else Icons.Default.PlayCircleFilled,
                        contentDescription = "Toggle",
                        tint = if (isActive) Indigo600 else Color.LightGray,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(title, fontWeight = FontWeight.Bold, fontSize = 12sp, color = SlateDark)
                        Text(description, fontSize = 10sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

// --- SYNC / BACKUP SCREEN ---
@Composable
fun SyncScreen(
    storageManager: LocalStorageManager
) {
    var rawInputString by remember { mutableStateOf("") }
    var operationResultMsg by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LightBg)
            .padding(16.dp)
    ) {
        Text(
            text = "Online Sync & Backups 🚀",
            fontSize = 26sp,
            fontWeight = FontWeight.Black,
            color = SlateDark
        )
        Text(
            text = "Your data runs 100% in your device sandbox. Back up often to secure progress.",
            fontSize = 12sp,
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Share Section
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Backup & Instant Share",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14sp,
                    color = SlateDark
                )
                Text(
                    text = "Creates a highly encrypted JSON backup string and opens the native Android share-sheet. Send this string to keep, email, or a friend to backup progress flawlessly.",
                    fontSize = 11sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Button(
                    onClick = { storageManager.triggerShareBackup() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Indigo600),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = "Share")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Share Progress Backup File/Text")
                }
            }
        }

        // Restore Area
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Restore Progress backup",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14sp,
                    color = SlateDark
                )
                Text(
                    text = "Paste your exact backup JSON string structure inside the block down below to reload previous checkpoints instantly.",
                    fontSize = 11sp,
                    color = Color.Gray,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                OutlinedTextField(
                    value = rawInputString,
                    onValueChange = { rawInputString = it },
                    placeholder = { Text("Paste JSON payload back up text block here...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = {
                        if (rawInputString.isNotBlank()) {
                            val success = storageManager.restoreBackupFromString(rawInputString)
                            operationResultMsg = if (success) {
                                "Successfully restored your entire backup data! Refresh screens."
                            } else {
                                "Format mismatch error. Ensure you copy the complete original text."
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Teal600),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Upload, contentDescription = "Import")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Import Backup String")
                }

                if (operationResultMsg.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = operationResultMsg,
                        color = if (operationResultMsg.contains("Success")) Teal600 else Color.Red,
                        fontSize = 11sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
