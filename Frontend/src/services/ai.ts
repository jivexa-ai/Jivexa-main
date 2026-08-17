export interface AIResponse {
  text: string;
  isEmergency: boolean;
  suggestions: string[];
  disclaimer: string;
}

export const askAIHealthAssistant = async (query: string): Promise<AIResponse> => {
  // Realistic simulated network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const q = query.toLowerCase().trim();
  const disclaimer = 'Jivexa Health AI Assistant provides educational health information. This does not replace a professional diagnosis or consultation from a qualified physician. If you are experiencing a medical emergency, seek help immediately.';

  // 1. Emergency cues check
  const emergencyKeywords = ['chest pain', 'breathing difficulty', 'shortness of breath', 'heart attack', 'stroke', 'unconscious', 'severe bleeding', 'sudden weakness', 'suicide', 'self harm'];
  const hasEmergency = emergencyKeywords.some((key) => q.includes(key));

  if (hasEmergency) {
    return {
      isEmergency: true,
      text: `⚠️ **CRITICAL WARNING: IMMEDIATE ACTION REQUIRED**\n\nThe symptoms you are describing (e.g., chest pain, breathing difficulty, sudden weakness) may indicate a severe medical emergency. \n\n**Please take the following steps immediately:**\n1. Call emergency services in your area (e.g., dial **112** or **102** in India, **911** in US).\n2. Head to the nearest Emergency Room (ER) or hospital immediately.\n3. Do not attempt to drive yourself; ask someone to assist you or wait for an ambulance.\n4. Inform emergency personnel of any active medications or history of heart conditions.`,
      suggestions: [
        'How do I recognize signs of a stroke?',
        'What should I do while waiting for an ambulance?',
        'Who is my emergency contact?'
      ],
      disclaimer
    };
  }

  // 2. Headache Check
  if (q.includes('headache') || q.includes('migraine')) {
    return {
      isEmergency: false,
      text: `### Common Causes of Headaches & Migraines\n\nHeadaches can stem from various sources. Most are primary headaches, which are benign, but secondary headaches can occur due to underlying health issues.\n\n**Common Types:**\n*   **Tension Headaches:** Usually caused by muscle contraction, stress, dehydration, or poor posture. Often feels like a tight band around the head.\n*   **Migraines:** Throbbing pain, typically on one side of the head, often accompanied by sensitivity to light/sound or nausea.\n*   **Sinus Headaches:** Pressure centered around the eyes, cheeks, and forehead, usually due to congestion or infection.\n\n**General Self-Care Tips:**\n1.  **Hydrate:** Drink a large glass of water. Dehydration is a very common trigger.\n2.  **Rest:** Lay down in a quiet, dark room for 20-30 minutes.\n3.  **Cold/Warm Pack:** Apply a cool compress to your forehead or a warm pad to your neck.\n4.  **Manage Stress:** Practice deep breathing or meditation.\n\n*If your headache is sudden, extremely severe ("thunderclap" headache), accompanied by fever, stiff neck, confusion, or difficulty speaking, seek immediate medical attention.*`,
      suggestions: [
        'How can I distinguish a headache from a migraine?',
        'Are there food triggers for migraines?',
        'When should I see a doctor for chronic headaches?'
      ],
      disclaimer
    };
  }

  // 3. Allergies Check
  if (q.includes('allergy') || q.includes('allergies') || q.includes('seasonal allergy')) {
    return {
      isEmergency: false,
      text: `### Understanding Seasonal & General Allergies\n\nAllergies occur when your immune system reacts to a foreign substance (allergen) like pollen, pet dander, or dust mites.\n\n**Typical Symptoms:**\n*   Sneezing and runny, stuffy nose\n*   Itchy, watery eyes\n*   Itching of the nose, roof of the mouth, or throat\n*   Fatigue due to disrupted sleep\n\n**Management & Treatment:**\n1.  **Reduce Exposure:** Keep windows closed during high-pollen seasons. Rinse off before bed to wash off allergens.\n2.  **Air Filtration:** Use HEPA filters in your home or bedroom.\n3.  **Antihistamines:** Over-the-counter antihistamines (like Cetirizine or Loratadine) can relieve sneezing and itching. Consult a doctor or pharmacist for a recommendation.\n4.  **Nasal Sprays:** Saline nasal rinses can help clear allergens and mucus.\n\n*Seek immediate care if you experience severe symptoms like swelling of the throat/tongue, difficulty swallowing, or wheezing (signs of Anaphylaxis).*`,
      suggestions: [
        'What is Anaphylaxis?',
        'How do I test for specific allergies?',
        'Which allergy medications are non-drowsy?'
      ],
      disclaimer
    };
  }

  // 4. Doctor Prep
  if (q.includes('prepare') && q.includes('doctor')) {
    return {
      isEmergency: false,
      text: `### Preparing for Your Doctor Appointment\n\nGetting the most out of your medical consultation requires brief preparation. Here is a helpful checklist:\n\n**1. Write Down Your Symptoms:**\n*   When did they start?\n*   What makes them better or worse?\n*   Rate the pain/severity on a scale of 1-10.\n\n**2. Keep Your Health History Handy:**\n*   Bring a list of current medications (name, dosage, frequency).\n*   Write down any known drug allergies.\n*   Have copies of recent lab reports or medical records (on JIVEXA, you can download these easily).\n\n**3. Prepare Questions for Your Doctor:**\n*   *What is the likely cause of my symptoms?*\n*   *Are there alternative treatments?*\n*   *What are the side effects of this medication?*\n*   *When should I follow up?*\n\n**4. Bring a Notebook:**\nTake notes during the consultation so you do not forget the treatment guidelines.`,
      suggestions: [
        'How do I share my health records on JIVEXA?',
        'What questions should I ask about new prescriptions?',
        'Find a general physician on JIVEXA'
      ],
      disclaimer
    };
  }

  // 5. Health Terms Explanation
  if (q.includes('explain') || q.includes('term') || q.includes('what is')) {
    return {
      isEmergency: false,
      text: `### Medical Terminology Simplified\n\nMedical jargon can be intimidating. Here are simple explanations for common terms you might see on reports:\n\n*   **Hypertension:** High blood pressure. It means the force of blood flowing through your blood vessels is consistently too high.\n*   **Lipid Profile:** A blood test measuring cholesterol levels, including LDL (often called "bad" cholesterol), HDL ("good" cholesterol), and triglycerides.\n*   **Acute vs. Chronic:** *Acute* refers to a condition that starts suddenly and is short-lived (like a cold). *Chronic* refers to a condition that persists over a long period (like diabetes or arthritis).\n*   **Electrocardiogram (ECG/EKG):** A simple test that records the electrical activity of your heart to check for irregularities.\n\n*Tell me which specific term you would like explained, and I will break it down for you.*`,
      suggestions: [
        'Explain LDL vs HDL cholesterol.',
        'What does HbA1c measure?',
        'How do I upload a test report to read it?'
      ],
      disclaimer
    };
  }

  // Default response
  return {
    isEmergency: false,
    text: `Hello! I am your JIVEXA AI Health Assistant. I can help answer common questions, explain medical terms in simple language, and help you prepare for doctor consultations.\n\n**How can I assist you today?**\n*   "Tell me about common causes of headaches."\n*   "What should I know about seasonal allergies?"\n*   "How can I prepare for a doctor appointment?"\n*   "Explain what a lipid profile blood test measures."\n\n*Please type your question, or select one of the suggested topics below.*`,
    suggestions: [
      'Tell me about common causes of headaches.',
      'What should I know about seasonal allergies?',
      'How can I prepare for a doctor appointment?',
      'Explain this health term in simple language.'
    ],
    disclaimer
  };
};
