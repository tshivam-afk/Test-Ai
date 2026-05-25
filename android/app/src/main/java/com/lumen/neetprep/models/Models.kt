package com.lumen.neetprep.models

import kotlinx.serialization.Serializable

@Serializable
data class Question(
    val number: Int,
    val subject: String,
    val questionText: String,
    val options: List<String>,
    val correctOptionIndex: Int,
    val solution: String
)

@Serializable
data class Test(
    val id: String,
    val title: String,
    val questions: List<Question>,
    val createdAt: String,
    val isSample: Boolean = false
)

@Serializable
data class Score(
    val correctCount: Int = 0,
    val incorrectCount: Int = 0,
    val blankCount: Int = 0,
    val finalScore: Int = 0
)

@Serializable
data class TestProgress(
    val testId: String,
    val answers: Map<String, Int> = emptyMap(),
    val flagged: List<Int> = emptyList(),
    val bookmarked: List<Int> = emptyList(),
    val userNotes: Map<String, String> = emptyMap(),
    val confidences: Map<String, String> = emptyMap(),
    val timeSpent: Long = 0,
    val completed: Boolean = false,
    val score: Score? = null,
    val lastActiveQuestionNumber: Int = 1,
    val lastUpdatedAt: String = "",
    val mode: String = "study" // "study" or "exam"
)

@Serializable
data class ExamHistoryItem(
    val id: String,
    val testId: String,
    val testTitle: String,
    val dateTime: String,
    val timeSpent: Long,
    val score: Score,
    val answers: Map<String, Int> = emptyMap(),
    val confidences: Map<String, String> = emptyMap(),
    val questions: List<Question>
)

@Serializable
data class PlannerTask(
    val id: String,
    val text: String,
    val subject: String,
    val createdAt: String,
    val completed: Boolean = false
)

@Serializable
data class CloudSyncPayload(
    val progress: List<TestProgress> = emptyList(),
    val history: List<ExamHistoryItem> = emptyList(),
    val tasks: List<PlannerTask> = emptyList()
)
