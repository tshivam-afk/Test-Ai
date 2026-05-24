package com.lumen.neetprep.data

import android.content.Context
import android.content.Intent
import com.lumen.neetprep.models.CloudSyncPayload
import com.lumen.neetprep.models.ExamHistoryItem
import com.lumen.neetprep.models.PlannerTask
import com.lumen.neetprep.models.TestProgress
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class LocalStorageManager(private val context: Context) {
    private val prefs = context.getSharedPreferences("lumen_neet_prep_prefs_v2", Context.MODE_PRIVATE)
    
    private val jsonHelper = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    // --- PROGRESS SAVING ---
    fun saveProgress(progress: TestProgress) {
        val list = getProgressList().toMutableList()
        val index = list.indexOfFirst { it.testId == progress.testId }
        if (index >= 0) {
            list[index] = progress
        } else {
            list.add(progress)
        }
        prefs.edit().putString("saved_progress_list_json", jsonHelper.encodeToString(list)).apply()
    }

    fun getProgress(testId: String): TestProgress? {
        return getProgressList().find { it.testId == testId }
    }

    fun getProgressList(): List<TestProgress> {
        val rawJson = prefs.getString("saved_progress_list_json", null) ?: return emptyList()
        return try {
            jsonHelper.decodeFromString(rawJson)
        } catch (e: Exception) {
            emptyList()
        }
    }

    // --- EXAM HISTORY TRACKING ---
    fun addHistoryItem(item: ExamHistoryItem) {
        val list = getHistoryList().toMutableList()
        list.add(0, item)
        prefs.edit().putString("exam_history_list_json", jsonHelper.encodeToString(list)).apply()
    }

    fun getHistoryList(): List<ExamHistoryItem> {
        val rawJson = prefs.getString("exam_history_list_json", null) ?: return emptyList()
        return try {
            jsonHelper.decodeFromString(rawJson)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun deleteHistoryItem(id: String) {
        val list = getHistoryList().filter { it.id != id }
        prefs.edit().putString("exam_history_list_json", jsonHelper.encodeToString(list)).apply()
    }

    // --- STUDY PLANNER ---
    fun savePlannerTasks(tasks: List<PlannerTask>) {
        prefs.edit().putString("planner_tasks_json", jsonHelper.encodeToString(tasks)).apply()
    }

    fun getPlannerTasks(): List<PlannerTask> {
        val rawJson = prefs.getString("planner_tasks_json", null) ?: return emptyList()
        return try {
            jsonHelper.decodeFromString(rawJson)
        } catch (e: Exception) {
            emptyList()
        }
    }

    // --- EXPORT AND BACKUP ---
    fun generateBackupString(): String {
        val payload = CloudSyncPayload(
            progress = getProgressList(),
            history = getHistoryList(),
            tasks = getPlannerTasks()
        )
        return jsonHelper.encodeToString(payload)
    }

    fun restoreBackupFromString(rawJson: String): Boolean {
        return try {
            val payload = jsonHelper.decodeFromString<CloudSyncPayload>(rawJson)
            prefs.edit().apply {
                putString("saved_progress_list_json", jsonHelper.encodeToString(payload.progress))
                putString("exam_history_list_json", jsonHelper.encodeToString(payload.history))
                putString("planner_tasks_json", jsonHelper.encodeToString(payload.tasks))
            }.apply()
            true
        } catch (e: Exception) {
            false
        }
    }

    // Standard resilient text share intent (Works universally without Provider definitions)
    fun triggerShareBackup() {
        try {
            val backupData = generateBackupString()
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_SUBJECT, "Lumen NEET Prep Backup Data")
                putExtra(Intent.EXTRA_TEXT, backupData)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val chooserIntent = Intent.createChooser(intent, "Back up to Socials, Drive, Keep...").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooserIntent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
