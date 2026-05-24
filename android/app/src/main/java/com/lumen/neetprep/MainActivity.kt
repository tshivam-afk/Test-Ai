package com.lumen.neetprep

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lumen.neetprep.audio.AudioSynthManager
import com.lumen.neetprep.data.LocalStorageManager
import com.lumen.neetprep.data.MockData
import com.lumen.neetprep.models.Test
import com.lumen.neetprep.ui.*

class MainActivity : ComponentActivity() {
    private lateinit var storageManager: LocalStorageManager
    private val synthManager = AudioSynthManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        storageManager = LocalStorageManager(applicationContext)

        val mockTests = listOf(
            MockData.getSampleTest(),
            MockData.getBiologyMarathonTest()
        )

        setContent {
            var activeTab by remember { mutableStateOf("library") }
            var activeTestForQuiz by remember { mutableStateOf<Test?>(null) }
            var activeQuizMode by remember { mutableStateOf("study") }

            Column(modifier = Modifier.fillMaxSize()) {
                Box(modifier = Modifier.weight(1f)) {
                    if (activeTestForQuiz != null) {
                        QuizScreen(
                            test = activeTestForQuiz!!,
                            mode = activeQuizMode,
                            storageManager = storageManager,
                            onBackToLibrary = {
                                activeTestForQuiz = null
                            }
                        )
                    } else {
                        when (activeTab) {
                            "library" -> LibraryScreen(
                                tests = mockTests,
                                onSelectTest = { test, mode ->
                                    activeTestForQuiz = test
                                    activeQuizMode = mode
                                },
                                storageManager = storageManager,
                                onNavigateToPlanner = { activeTab = "planner" }
                            )
                            "gym" -> GymScreen(
                                tests = mockTests,
                                storageManager = storageManager
                            )
                            "history" -> HistoryScreen(
                                storageManager = storageManager,
                                onDeleteHistory = { itemId ->
                                    storageManager.deleteHistoryItem(itemId)
                                }
                            )
                            "planner" -> PlannerScreen(
                                storageManager = storageManager
                            )
                            "relax" -> RelaxScreen(
                                synthManager = synthManager
                            )
                            "sync" -> SyncScreen(
                                storageManager = storageManager
                            )
                        }
                    }
                }

                if (activeTestForQuiz == null) {
                    NavigationBar(
                        containerColor = androidx.compose.ui.graphics.Color.White,
                        tonalElevation = 8.dp,
                        modifier = Modifier.height(72.dp)
                    ) {
                        val navItems = listOf(
                            Triple("library", "Library", Icons.Default.Book),
                            Triple("gym", "Gym", Icons.Default.FitnessCenter),
                            Triple("history", "History", Icons.Default.History),
                            Triple("planner", "Planner", Icons.Default.List),
                            Triple("relax", "Relax", Icons.Default.Spa),
                            Triple("sync", "Sync", Icons.Default.CloudSync)
                        )

                        navItems.forEach { (tab, label, icon) ->
                            val isSelected = activeTab == tab
                            NavigationBarItem(
                                selected = isSelected,
                                onClick = { activeTab = tab },
                                icon = {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = label,
                                        modifier = Modifier.size(18.dp)
                                    )
                                },
                                label = {
                                    Text(
                                        text = label,
                                        fontSize = 10sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    )
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Indigo600,
                                    unselectedIconColor = androidx.compose.ui.graphics.Color.Gray,
                                    selectedTextColor = Indigo600,
                                    unselectedTextColor = androidx.compose.ui.graphics.Color.Gray,
                                    indicatorColor = Indigo600.copy(alpha = 0.08f)
                                )
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        synthManager.stopSynth()
    }
}
