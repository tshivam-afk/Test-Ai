import { Test } from "./types";

export const SAMPLE_TEST_ID = "aakash-neet-crash-pst02f";

export const getSampleTest = (): Test => ({
  id: SAMPLE_TEST_ID,
  title: "Re-NEET Test: Work, Power & Conservative Forces (PST-02F)",
  isSample: true,
  createdAt: new Date("2026-05-23T19:11:00Z").toISOString(),
  questions: [
    {
      number: 1,
      subject: "Physics",
      questionText: `Statement I: Work done by conservative force on a body is independent of path followed by body.\nStatement II: Work done by a conservative force along a closed path may not be zero.\n\nIn the light of above statements, choose the most appropriate answer from the options given below.`,
      options: [
        "Both statement I and statement II are correct",
        "Both statement I and statement II are incorrect",
        "Statement I is correct but statement II is incorrect",
        "Statement I is incorrect but statement II is correct"
      ],
      correctOptionIndex: 2, // (3) Statement I is correct but statement II is incorrect
      solution: "Work done by conservative force is independent of path followed. Hence, Statement I is correct.\n\nWork done by a conservative force along any closed circular or general path is always exactly zero. Thus, Statement II is false."
    },
    {
      number: 2,
      subject: "Physics",
      questionText: "If force F = (x î + *y*² ĵ) N is acting on a body and the body moves from (1, 2, 1) m to (2, 3, 3) m, then the work done due to the force is:",
      options: [
        "42/5 J",
        "47/6 J",
        "55/3 J",
        "37/4 J"
      ],
      correctOptionIndex: 1, // (2) 47/6 J
      solution: "Work done W = ∫ F_x dx + ∫ F_y dy + ∫ F_z dz\n\nGiven F_x = x, F_y = y², F_z = 0.\nIntegrating from coordinate points (1, 2, 1) to (2, 3, 3):\n\nW = ∫₁² x dx + ∫₂³ y² dy\nW = [ x²/2 ]₁² + [ y³/3 ]₂³\nW = (2²/2 - 1²/2) + (3³/3 - 2³/3)\nW = (2 - 1/2) + (9 - 8/3)\nW = 3/2 + 19/3\nW = (9 + 38) / 6 = 47/6 J."
    },
    {
      number: 4,
      subject: "Physics",
      questionText: "A machine gun fires 60 bullets per minute with a velocity of 100 m/s. If each bullet has a mass of 20 g, then the average power developed by the gun is:",
      options: [
        "1000 W",
        "100 W",
        "1200 W",
        "2400 W"
      ],
      correctOptionIndex: 1, // (2) 100 W
      solution: "Power = (Work done / time) = (Total Kinetic Energy / time)\n\nPower = (n/t) * (1/2) * m * v²\n\nRate n/t = 60 bullets / 60 seconds = 1 bullet/sec\nMass of a single bullet m = 20 g = 20 / 1000 kg = 0.02 kg\nVelocity v = 100 m/s\n\nPower = 1 * 0.5 * 0.02 * (100)²\nPower = 0.5 * 0.02 * 10000 = 100 W."
    },
    {
      number: 5,
      subject: "Physics",
      questionText: "The mass of a body is halved and its velocity is doubled. The percentage increase in the Kinetic Energy (K.E) of the body is:",
      options: [
        "400%",
        "300%",
        "200%",
        "100%"
      ],
      correctOptionIndex: 3, // (4) 100%
      solution: "Initial Kinetic Energy K_initial = (1/2) * m * v²\n\nDouble velocity (v' = 2v) and halve mass (m' = m/2):\nK_final = (1/2) * (m/2) * (2v)²\nK_final = (1/2) * (m/2) * 4v² = m * v²\n\nPercentage increase = [(K_final - K_initial) / K_initial] * 100\nIncrease = [(m*v² - 0.5*m*v²) / (0.5*m*v²)] * 100\nIncrease = [0.5 / 0.5] * 100 = 100%."
    },
    {
      number: 7,
      subject: "Physics",
      questionText: "The potential energy of a particle at position x is given by U = (x² - 4x + 2) J where x is in meters. The equilibrium position of the particle will occur at:",
      options: [
        "x = 2 m",
        "x = 0 m",
        "x = 1 m",
        "x = 3 m"
      ],
      correctOptionIndex: 0, // (1) x = 2 m
      solution: "Force acting on a particle is related to potential energy as F = -dU/dx.\n\nTaking derivative with respect to x:\ndU/dx = d/dx (x² - 4x + 2) = 2x - 4\nF = -(2x - 4) = 4 - 2x\n\nFor equilibrium, the net force on the particle must be zero (F = 0):\n4 - 2x = 0  =>  2x = 4  =>  x = 2 m."
    },
    {
      number: 9,
      subject: "Physics",
      questionText: "A particle is moving along the x-axis under conservative forces. Its potential energy U(x) varies with the x coordinate as shown in a curved plot with localized critical points. Point A is a falling slope, B is a local minimum, C is a rising positive slope, and D is a local maximum.\n\nThe force acting on the particle is negative at which point:",
      options: [
        "A",
        "B",
        "C",
        "D"
      ],
      correctOptionIndex: 2, // (3) C
      solution: "Slope property: Force is related to potential energy curve as F = -dU/dx (the negative slope of U versus x).\n\n- At Point A: slope is negative (dU/dx < 0), so F is positive.\n- At Point B (minimum): slope is zero (dU/dx = 0), so F is zero.\n- At Point C: slope is positive (dU/dx > 0), so F is negative.\n- At Point D (maximum): slope is zero (dU/dx = 0), so F is zero.\n\nTherefore, force is negative at Point C."
    }
  ]
});
