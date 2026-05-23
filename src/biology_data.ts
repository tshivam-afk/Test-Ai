import { Test, Question } from "./types";

export const BIOLOGY_MARATHON_ID = "neet-biology-marathon-q91-180";

const generateBiologyQuestions = (): Question[] => {
  const highYieldQuestions: Question[] = [
    {
      number: 91,
      subject: "Biology - Botany",
      questionText: "Which of the following is considered as the 'powerhouse of the cell' and is site of aerobic respiration, releasing ATP?",
      options: [
        "Chloroplast",
        "Mitochondrion",
        "Ribosome",
        "Endoplasmic Reticulum"
      ],
      correctOptionIndex: 1,
      solution: "Mitochondria are double membrane-bound organelles where Krebs cycle and Oxidative Phosphorylation occur to generate ATP, making them the powerhouse of the cell."
    },
    {
      number: 92,
      subject: "Biology - Botany",
      questionText: "The final acceptor of electrons in the non-cyclic photophosphorylation (Z-scheme) of photosynthesis in plants is:",
      options: [
        "NADP+",
        "Oxygen",
        "Plastocyanin",
        "Cytochrome b6f"
      ],
      correctOptionIndex: 0,
      solution: "During non-cyclic electron transport, electrons are transferred from PS I to Ferredoxin, and ultimately to NADP+ via NADP+ reductase to produce NADPH."
    },
    {
      number: 93,
      subject: "Biology - Botany",
      questionText: "According to the Fluid Mosaic Model of cell membrane, the membrane is composed of lipids and proteins. What is the orientation of the hydrophobic tails of lipids?",
      options: [
        "Towards the outer side",
        "Towards the inner side, protected from water",
        "Symmetrically dispersed randomly everywhere",
        "Charged pointing directly to the extracellular matrix"
      ],
      correctOptionIndex: 1,
      solution: "The hydrophobic tail composed of saturated hydrocarbons is oriented towards the inner side to prevent direct exposure to the aqueous environment."
    },
    {
      number: 94,
      subject: "Biology - Botany",
      questionText: "Which of the following plant hormones is primarily responsible for apical dominance in higher plants?",
      options: [
        "Gibberellins",
        "Cytokinins",
        "Auxin (Indole-3-acetic acid)",
        "Abscisic Acid"
      ],
      correctOptionIndex: 2,
      solution: "Auxin produced at the shoot apex inhibits the growth of lateral buds, maintaining apical dominance."
    },
    {
      number: 95,
      subject: "Biology - Botany",
      questionText: "During DNA replication, the Okazaki fragments are synthesized discontinuously on the lagging strand. Which enzyme links these fragments together?",
      options: [
        "DNA Helicase",
        "DNA Ligase",
        "DNA Polymerase I",
        "RNA Primase"
      ],
      correctOptionIndex: 1,
      solution: "DNA Ligase catalyzes the formation of phosphodiester bonds to join discontinuous Okazaki fragments on the lagging strand."
    },
    {
      number: 100,
      subject: "Biology - Botany",
      questionText: "In Mendel's dihybrid cross of round yellow (RRYY) and wrinkled green (rryy) pea plants, what is the expected phenotypic ratio in the F2 generation?",
      options: [
        "3 : 1",
        "9 : 3 : 3 : 1",
        "1 : 2 : 1",
        "1 : 1 : 1 : 1"
      ],
      correctOptionIndex: 1,
      solution: "Mendel's Law of Independent Assortment predicts a phenotypic ratio of 9 (Round Yellow) : 3 (Round Green) : 3 (Wrinkled Yellow) : 1 (Wrinkled Green) in F2."
    },
    {
      number: 110,
      subject: "Biology - Zoology",
      questionText: "What is the primary site of absorption of digested food nutrients such as simple sugars, amino acids, and fatty acids in human body?",
      options: [
        "Stomach",
        "Large Intestine",
        "Small Intestine (specifically jejunum and ileum)",
        "Oesophagus"
      ],
      correctOptionIndex: 2,
      solution: "The small intestine has millions of microvilli that maximize the surface area for highly efficient nutrient absorption."
    },
    {
      number: 120,
      subject: "Biology - Zoology",
      questionText: "The functional unit of human kidney, responsible for ultrafiltration, selective reabsorption, and tubular secretion is:",
      options: [
        "Neuron",
        "Nephron",
        "Glomerulus",
        "Alveolus"
      ],
      correctOptionIndex: 1,
      solution: "The Nephron is the primary structural and functional unit of the kidney, consisting of Bowmans capsule and renal tubules."
    },
    {
      number: 135,
      subject: "Biology - Zoology",
      questionText: "Which of the following blood groups is known as the 'universal donor' due to the absence of active A and B surface antigens?",
      options: [
        "AB Positive",
        "O Negative",
        "A Negative",
        "B Positive"
      ],
      correctOptionIndex: 1,
      solution: "Blood group O negative has no A, B, or Rh antigens on the surface of erythrocytes, preventing severe agglutination reactions during transfusions."
    },
    {
      number: 150,
      subject: "Biology - Zoology",
      questionText: "The dynamic hormone triggers ovulation in human females. A sudden surge of which hormone on day 14 of menstrual cycle is responsible?",
      options: [
        "Progesterone",
        "Luteinizing Hormone (LH)",
        "Estrogen",
        "Follicle Stimulating Hormone (FSH)"
      ],
      correctOptionIndex: 1,
      solution: "The rapid increase in LH levels (called the LH surge) triggers rupture of the Graafian follicle and ovulation."
    },
    {
      number: 165,
      subject: "Biology - Zoology",
      questionText: "Which of the following cellular components is responsible for cell-mediated immunity in the human body?",
      options: [
        "B-lymphocytes",
        "T-lymphocytes",
        "Erythrocytes",
        "Thrombocytes"
      ],
      correctOptionIndex: 1,
      solution: "T-lymphocytes are responsible for Cell-Mediated Immunity (CMI), whereas B-lymphocytes handle humoral immunity."
    },
    {
      number: 172,
      subject: "Biology - Zoology",
      questionText: "According to Darwin's theory of evolution, natural selection favors individuals with characteristics that:",
      options: [
        "Increase their body weight",
        "Allow them to produce offspring with more mutations",
        "Enable them to survive and reproduce more successfully in their environment",
        "Allow them to absorb atmospheric nitrogen directly"
      ],
      correctOptionIndex: 2,
      solution: "Natural selection favors fitness, which is defined as adaptive traits yielding higher reproductive success and survival rates."
    },
    {
      number: 180,
      subject: "Biology - Zoology",
      questionText: "Which ecological level represents the highest level of hierarchy, comprising all living organisms interacting with the physical environment as a unified balanced cycle?",
      options: [
        "Biosphere",
        "Ecosystem",
        "Community",
        "Population"
      ],
      correctOptionIndex: 0,
      solution: "The biosphere represents the global ecological system integrating all living beings and their relationships (from deep lithosphere to high atmosphere)."
    }
  ];

  // Let's dynamically fill the other questions from 91 to 180 to make a realistic 90 question pool!
  const questions: Question[] = [];
  const highYieldMap = new Map<number, Question>();
  highYieldQuestions.forEach(q => highYieldMap.set(q.number, q));

  for (let n = 91; n <= 180; n++) {
    if (highYieldMap.has(n)) {
      questions.push(highYieldMap.get(n)!);
    } else {
      // Dynamic simulated high-yield biology question
      const sampleBotanyTopics = [
        {
          subject: "Biology - Botany",
          qText: "What is the primary function of sieve tubes in plant phloem?",
          options: ["Water transportation", "Translocation of organic solutes (food)", "Mechanical support", "Storage of waste products"],
          correct: 1,
          desc: "Sieve tube elements are living columns designed for phloem sugar translocation."
        },
        {
          subject: "Biology - Botany",
          qText: "The process of double fertilization is unique to which of the following plant divisions?",
          options: ["Gymnosperms", "Pteridophytes", "Angiosperms", "Bryophytes"],
          correct: 2,
          desc: "Double fertilization yields zygote and triploid endosperm in flowering plants."
        },
        {
          subject: "Biology - Botany",
          qText: "Which cell organelle is rich in hydrolytic enzymes active at an acidic pH?",
          options: ["Lysosome", "Ribosome", "Golgi apparatus", "Peroxisome"],
          correct: 0,
          desc: "Lysosomes contain acid hydrolases to digest macromolecules intracellularly."
        },
        {
          subject: "Biology - Zoology",
          qText: "Action potential of a standard neuron is initiated by rapid influx of:",
          options: ["Potassium ions", "Sodium ions", "Chloride ions", "Calcium ions"],
          correct: 1,
          desc: "Sodium channels open rapidly, resulting in sodium influx and depolarization."
        },
        {
          subject: "Biology - Zoology",
          qText: "Which of the following is an example of an egg-laying mammal (monotreme)?",
          options: ["Platypus (Ornithorhynchus)", "Kangaroo (Macropus)", "Flying fox (Pteropus)", "Blue whale (Balaenoptera)"],
          correct: 0,
          desc: "Platypus is a primitive oviparous mammal native to eastern Australia."
        }
      ];

      const seedIndex = (n * 73) % sampleBotanyTopics.length;
      const template = sampleBotanyTopics[seedIndex];
      questions.push({
        number: n,
        subject: template.subject,
        questionText: `[High-Yield NEET Q${n}] ${template.qText}`,
        options: template.options,
        correctOptionIndex: template.correct,
        solution: template.desc
      });
    }
  }

  return questions.sort((a, b) => a.number - b.number);
};

export const getBiologyMarathonTest = (): Test => ({
  id: BIOLOGY_MARATHON_ID,
  title: "NEET Biology High-Yield Marathon (Q91 - Q180)",
  isSample: true,
  createdAt: new Date("2026-05-23T19:25:00Z").toISOString(),
  questions: generateBiologyQuestions()
});
