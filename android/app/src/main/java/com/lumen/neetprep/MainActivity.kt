package com.lumen.neetprep

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
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

@OptIn(ExperimentalMaterial3Api::class)
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
            val isDark by remember { LocalStorageManager.isDarkThemeState }
            var activeTab by remember { mutableStateOf("library") }
            var activeTestForQuiz by remember { mutableStateOf<Test?>(null) }
            var activeQuizMode by remember { mutableStateOf("study") }

            // Reactive dynamically loaded imported custom test books
            val customTests = remember(activeTab, activeTestForQuiz) {
                storageManager.getCustomTests()
            }
            val allTests = remember(customTests) {
                mockTests + customTests
            }

            val themeBg = if (isDark) androidx.compose.ui.graphics.Color(0xFF0B0F19) else androidx.compose.ui.graphics.Color(0xFFF8FAFC)
            val themeCard = if (isDark) androidx.compose.ui.graphics.Color(0xFF151D30) else androidx.compose.ui.graphics.Color.White
            val themeText = if (isDark) androidx.compose.ui.graphics.Color(0xFFF1F5F9) else androidx.compose.ui.graphics.Color(0xFF0F172A)

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(themeBg)
            ) {
                // Global top bar with theme toggle (only show when not actively taking a checklist quiz)
                if (activeTestForQuiz == null) {
                    androidx.compose.material3.SmallTopAppBar(
                        title = {
                            Text(
                                text = when(activeTab) {
                                    "library" -> "NEET Practice Books"
                                    "gym" -> "Mistake Revision Gym"
                                    "history" -> "Performance Logs"
                                    "planner" -> "Daily Study Tasks"
                                    "relax" -> "Acoustic Focus Timer"
                                    else -> "Sync Progress"
                                },
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = themeText
                            )
                        },
                        actions = {
                            IconButton(onClick = {
                                storageManager.setDarkTheme(!isDark)
                            }) {
                                Icon(
                                    imageVector = if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                                    contentDescription = "Toggle Theme",
                                    tint = if (isDark) androidx.compose.ui.graphics.Color.Yellow else Indigo600
                                )
                            }
                        },
                        colors = TopAppBarDefaults.smallTopAppBarColors(
                            containerColor = themeCard
                        )
                    )
                }

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
                                tests = allTests,
                                onSelectTest = { test, mode ->
                                    activeTestForQuiz = test
                                    activeQuizMode = mode
                                },
                                storageManager = storageManager,
                                onNavigateToPlanner = { activeTab = "planner" }
                            )
                            "gym" -> GymScreen(
                                tests = allTests,
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
                        containerColor = themeCard,
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
                                        fontSize = 10.sp,
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
