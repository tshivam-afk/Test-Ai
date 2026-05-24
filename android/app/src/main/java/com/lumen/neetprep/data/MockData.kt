package com.lumen.neetprep.data

import com.lumen.neetprep.models.Question
import com.lumen.neetprep.models.Test

object MockData {
    const val SAMPLE_TEST_ID = "aakash-neet-crash-pst02f"
    const val BIOLOGY_MARATHON_ID = "neet-biology-marathon-q91-180"

    fun getSampleTest(): Test {
        return Test(
            id = SAMPLE_TEST_ID,
            title = "Re-NEET Test: Work, Power & Conservative Forces (PST-02F)",
            isSample = true,
            createdAt = "2026-05-23T19:11:00Z",
            questions = listOf(
                Question(
                    number = 1,
                    subject = "Physics",
                    questionText = "Statement I: Work done by conservative force on a body is independent of path followed by body.\nStatement II: Work done by a conservative force along a closed path may not be zero.\n\nIn the light of above statements, choose the most appropriate answer.",
                    options = listOf(
                        "Both statement I and statement II are correct",
                        "Both statement I and statement II are incorrect",
                        "Statement I is correct but statement II is incorrect",
                        "Statement I is incorrect but statement II is correct"
                    ),
                    correctOptionIndex = 2,
                    solution = "Work done by conservative force is independent of path. Statement I is true. Work done inside closed path is exactly zero. Statement II is false."
                ),
                Question(
                    number = 2,
                    subject = "Physics",
                    questionText = "If force F = (x î + *y*² ĵ) N is acting on a body and the body moves from (1, 2, 1) m to (2, 3, 3) m, then the work done due to the force is:",
                    options = listOf(
                        "42/5 J",
                        "47/6 J",
                        "55/3 J",
                        "37/4 J"
                    ),
                    correctOptionIndex = 1,
                    solution = "W = ∫ F_x dx + ∫ F_y dy = [x²/2]₁² + [y³/3]₂³ = (2 - 1/2) + (9 - 8/3) = 3/2 + 19/3 = 47/6 J."
                ),
                Question(
                    number = 4,
                    subject = "Physics",
                    questionText = "A machine gun fires 60 bullets per minute with a velocity of 100 m/s. If each bullet has a mass of 20 g, then the average power developed by the gun is:",
                    options = listOf(
                        "1000 W",
                        "100 W",
                        "1200 W",
                        "2400 W"
                    ),
                    correctOptionIndex = 1,
                    solution = "Power = (n/t) * (1/2) * m * v² = 1 * 0.5 * 0.02 * (100)² = 100 W."
                ),
                Question(
                    number = 5,
                    subject = "Physics",
                    questionText = "The mass of a body is halved and its velocity is doubled. The percentage increase in the Kinetic Energy (K.E) of the body is:",
                    options = listOf(
                        "400%",
                        "300%",
                        "200%",
                        "100%"
                    ),
                    correctOptionIndex = 3,
                    solution = "Initial = 0.5 * m * v². Final = 0.5 * (m/2) * (2v)² = m * v². Percentage increase is [(1 - 0.5)/0.5] * 100 = 100%."
                ),
                Question(
                    number = 7,
                    subject = "Physics",
                    questionText = "The potential energy of a particle at position x is given by U = (x² - 4x + 2) J where x is in meters. The equilibrium position of the particle will occur at:",
                    options = listOf(
                        "x = 2 m",
                        "x = 0 m",
                        "x = 1 m",
                        "x = 3 m"
                    ),
                    correctOptionIndex = 0,
                    solution = "F = -dU/dx = -(2x - 4) = 4 - 2x. For equilibrium, F = 0 => 2x = 4 => x = 2 m."
                ),
                Question(
                    number = 9,
                    subject = "Physics",
                    questionText = "A particle is moving along the x-axis under conservative forces. Its potential energy U(x) varies with the x coordinate as shown. Point A is falling, B is minimum, C is rising, and D is maximum. The force is negative at:",
                    options = listOf(
                        "A",
                        "B",
                        "C",
                        "D"
                    ),
                    correctOptionIndex = 2,
                    solution = "F = -dU/dx. Force is negative where dU/dx (slope) is positive. Slope is positive at C."
                )
            )
        )
    }

    fun getBiologyMarathonTest(): Test {
        val staticQuestions = listOf(
            Question(
                number = 91,
                subject = "Biology - Botany",
                questionText = "Which of the following is considered as the 'powerhouse of the cell' and is site of aerobic respiration, releasing ATP?",
                options = listOf(
                    "Chloroplast",
                    "Mitochondrion",
                    "Ribosome",
                    "Endoplasmic Reticulum"
                ),
                correctOptionIndex = 1,
                solution = "Mitochondria are double membrane-bound organelles where ATP is generated, making them the powerhouse."
            ),
            Question(
                number = 92,
                subject = "Biology - Botany",
                questionText = "The final acceptor of electrons in the non-cyclic photophosphorylation (Z-scheme) of photosynthesis in plants is:",
                options = listOf(
                    "NADP+",
                    "Oxygen",
                    "Plastocyanin",
                    "Cytochrome b6f"
                ),
                correctOptionIndex = 0,
                solution = "During non-cyclic electron transport, electrons are transferred to NADP+ via NADP+ reductase to produce NADPH."
            ),
            Question(
                number = 93,
                subject = "Biology - Botany",
                questionText = "According to the Fluid Mosaic Model of cell membrane, what is the orientation of the hydrophobic tails of lipids?",
                options = listOf(
                    "Towards the outer side",
                    "Towards the inner side, protected from water",
                    "Symmetrically dispersed randomly everywhere",
                    "Charged pointing directly to the extracellular matrix"
                ),
                correctOptionIndex = 1,
                solution = "The hydrophobic tail composed of saturated hydrocarbons is oriented towards the inner side to prevent direct exposure to the aqueous environment."
            ),
            Question(
                number = 94,
                subject = "Biology - Botany",
                questionText = "Which of the following plant hormones is primarily responsible for apical dominance in higher plants?",
                options = listOf(
                    "Gibberellins",
                    "Cytokinins",
                    "Auxin (Indole-3-acetic acid)",
                    "Abscisic Acid"
                ),
                correctOptionIndex = 2,
                solution = "Auxins produced at the apex inhibit lateral bud growth, initiating apical dominance."
            ),
            Question(
                number = 95,
                subject = "Biology - Botany",
                questionText = "During DNA replication, what enzyme links Okazaki fragments together on the lagging strand?",
                options = listOf(
                    "DNA Helicase",
                    "DNA Ligase",
                    "DNA Polymerase I",
                    "RNA Primase"
                ),
                correctOptionIndex = 1,
                solution = "DNA Ligase links fragments together by creating phosphodiester bonds."
            ),
            Question(
                number = 100,
                subject = "Biology - Botany",
                questionText = "In Mendel's dihybrid cross of round yellow (RRYY) and wrinkled green (rryy) pea plants, what is the expected phenotypic ratio in the F2 generation?",
                options = listOf(
                    "3 : 1",
                    "9 : 3 : 3 : 1",
                    "1 : 2 : 1",
                    "1 : 1 : 1 : 1"
                ),
                correctOptionIndex = 1,
                solution = "The phenotype ratio is 9 (Round Yellow) : 3 (Round Green) : 3 (Wrinkled Yellow) : 1 (Wrinkled Green)."
            ),
            Question(
                number = 110,
                subject = "Biology - Zoology",
                questionText = "What is the primary site of absorption of digested food nutrients such as simple sugars, amino acids in the human body?",
                options = listOf(
                    "Stomach",
                    "Large Intestine",
                    "Small Intestine (specifically jejunum and ileum)",
                    "Oesophagus"
                ),
                correctOptionIndex = 2,
                solution = "Small intestine maximizes surface absorption area via millions of active microvilli."
            ),
            Question(
                number = 120,
                subject = "Biology - Zoology",
                questionText = "The functional unit of human kidney, responsible for ultrafiltration, selective reabsorption, and tubular secretion is:",
                options = listOf(
                    "Neuron",
                    "Nephron",
                    "Glomerulus",
                    "Alveolus"
                ),
                correctOptionIndex = 1,
                solution = "The Nephron is the structural and functional unit of the human kidney."
            ),
            Question(
                number = 135,
                subject = "Biology - Zoology",
                questionText = "Which of the following blood groups is known as the 'universal donor' due to the absence of surface antigens?",
                options = listOf(
                    "AB Positive",
                    "O Negative",
                    "A Negative",
                    "B Positive"
                ),
                correctOptionIndex = 1,
                solution = "O negative has no A, B, or Rh antigens and is hence the universal donor."
            ),
            Question(
                number = 150,
                subject = "Biology - Zoology",
                questionText = "A sudden surge of which hormone on day 14 of the menstrual cycle triggers ovulation?",
                options = listOf(
                    "Progesterone",
                    "Luteinizing Hormone (LH)",
                    "Estrogen",
                    "Follicle Stimulating Hormone (FSH)"
                ),
                correctOptionIndex = 1,
                solution = "The LH surge triggers Graafian follicle rupture and ovulation."
            ),
            Question(
                number = 165,
                subject = "Biology - Zoology",
                questionText = "Which of the following cellular components is responsible for cell-mediated immunity in the human body?",
                options = listOf(
                    "B-lymphocytes",
                    "T-lymphocytes",
                    "Erythrocytes",
                    "Thrombocytes"
                ),
                correctOptionIndex = 1,
                solution = "T-lymphocytes handle Cell-Mediated Immunity (CMI), whereas B-lymphocytes handle humoral immunity."
            ),
            Question(
                number = 172,
                subject = "Biology - Zoology",
                questionText = "According to Darwin's theory of evolution, natural selection favors individuals with characteristics that:",
                options = listOf(
                    "Increase their body weight",
                    "Allow them to produce offspring with more mutations",
                    "Enable them to survive and reproduce more successfully in their environment",
                    "Allow them to absorb atmospheric nitrogen directly"
                ),
                correctOptionIndex = 2,
                solution = "Natural selection favors physiological fitness yielding adaptive survival advantages."
            ),
            Question(
                number = 180,
                subject = "Biology - Zoology",
                questionText = "Which ecological level represents the highest level of hierarchy, comprising all living organisms interacting as a unified balanced cycle?",
                options = listOf(
                    "Biosphere",
                    "Ecosystem",
                    "Community",
                    "Population"
                ),
                correctOptionIndex = 0,
                solution = "The biosphere integrates all ecosystems globally."
            )
        )

        val questions = mutableListOf<Question>()
        val staticMap = staticQuestions.associateBy { it.number }

        for (n in 91..180) {
            val staticQ = staticMap[n]
            if (staticQ != null) {
                questions.add(staticQ)
            } else {
                val sampleTopics = listOf(
                    Triple(
                        "Biology - Botany",
                        "What is the primary function of sieve tubes in plant phloem?",
                        listOf("Water transportation", "Translocation of organic solutes (food)", "Mechanical support", "Storage of waste products")
                    ),
                    Triple(
                        "Biology - Botany",
                        "The process of double fertilization is unique to which of the following plant divisions?",
                        listOf("Gymnosperms", "Pteridophytes", "Angiosperms", "Bryophytes")
                    ),
                    Triple(
                        "Biology - Botany",
                        "Which cell organelle is rich in hydrolytic enzymes active at an acidic pH?",
                        listOf("Lysosome", "Ribosome", "Golgi apparatus", "Peroxisome")
                    ),
                    Triple(
                        "Biology - Zoology",
                        "Action potential of a standard neuron is initiated by rapid influx of:",
                        listOf("Potassium ions", "Sodium ions", "Chloride ions", "Calcium ions")
                    ),
                    Triple(
                        "Biology - Zoology",
                        "Which of the following is an example of an egg-laying mammal (monotreme)?",
                        listOf("Platypus (Ornithorhynchus)", "Kangaroo (Macropus)", "Flying fox (Pteropus)", "Blue whale (Balaenoptera)")
                    )
                )

                val idx = (n * 73) % sampleTopics.size
                val (subj, text, opts) = sampleTopics[idx]
                questions.add(
                    Question(
                        number = n,
                        subject = subj,
                        questionText = "[High-Yield NEET Q$n] $text",
                        options = opts,
                        correctOptionIndex = if (idx == 0 || idx == 3) 1 else if (idx == 1) 2 else 0,
                        solution = "High yield NCERT reference and syllabus details for item Q$n."
                    )
                )
            }
        }
        return Test(
            id = BIOLOGY_MARATHON_ID,
            title = "NEET Biology High-Yield Marathon (Q91 - Q180)",
            isSample = true,
            createdAt = "2026-05-23T19:25:00Z",
            questions = questions.sortedBy { it.number }
        )
    }
}
