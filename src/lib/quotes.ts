export const PHILOSOPHICAL_QUOTES = [
  {
    text: "Wherever the art of Medicine is loved, there is also a love of Humanity.",
    author: "Hippocrates"
  },
  {
    text: "Your stethoscope is waiting for your persistence. The chapters you conquer today are the lives you save tomorrow.",
    author: "Medical Proverb"
  },
  {
    text: "Observation, Reason, Work, and Will. These are the four diagnostic pillars of a true physician.",
    author: "William Osler"
  },
  {
    text: "The chapter you are tempted to skip today is exactly what your future patient will need you to know.",
    author: "Aspirant Guide"
  },
  {
    text: "Difficulties master us when we lack conceptual clarity; clarity is born only through fearless mock analysis.",
    author: "Philosophical Maxim"
  },
  {
    text: "Medicines can cure diseases, but only the dedicated clinician can cure the patient's spirit.",
    author: "Carl Jung"
  },
  {
    text: "In the depth of winter, I finally learned that within me there lay an invincible scientific curiosity.",
    author: "Albert Camus"
  },
  {
    text: "Do not train to chase marks; train to internalize principles. Medical science demands humble, objective precision.",
    author: "Aspirant Mentor"
  },
  {
    text: "The hard work of today transforms into the diagnostic instinct of tomorrow. Do not lose your focus.",
    author: "Surgical Maxim"
  },
  {
    text: "The secret of diagnostic success lies in paying attention to details that others dismiss as trivial.",
    author: "Arthur Conan Doyle"
  }
];

export function getRandomQuote(): { text: string; author: string } {
  const index = Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length);
  return PHILOSOPHICAL_QUOTES[index];
}
