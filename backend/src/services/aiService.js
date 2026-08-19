/**
 * JIVEXA Production AI Integration Service
 * Multi-Provider Real-Time Token-by-Token Streaming Engine & Medical Report Analyzer
 */

const OpenAI = require('openai');
const https = require('https');

// Persistent Keep-Alive Socket Pool for Sub-80ms API Latency
const groqKeepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 20,
  keepAliveMsecs: 60000
});

const SYSTEM_PROMPT = `You are the JIVEXA AI Medical & Health Assistant, a clinical-literacy AI helping users understand health questions and lab reports. You are NOT a doctor, you do not diagnose, and you never imply physician review has occurred.

CRITICAL INSTRUCTIONS:
1. Write in warm, clear, plain human language (like a knowledgeable nurse-educator).
2. Do NOT use markdown bold asterisks (no **words**) or robotic AI symbols. Use simple text and clean bullet points.
3. For medical reports or lab values, extract the test name, reported value, and reference range, and flag abnormal parameters for doctor discussion.
4. Keep answers concise, clear, and direct (under 60 words in 2-3 short bullet points).
5. If symptoms suggest a medical emergency (chest pain, severe bleeding, difficulty breathing), immediately tell them to call 108 / 112 or visit the nearest ER.
6. Closing reminder for lab questions: Always recommend sharing flagged reports with their doctor for clinical advice.`;

// Metrics tracker for monitoring
const aiMetrics = {
  totalRequests: 0,
  openAiSuccesses: 0,
  groqSuccesses: 0,
  geminiSuccesses: 0,
  emergencyDetections: 0,
  errors: 0
};

// Emergency symptom keywords detector
const EMERGENCY_KEYWORDS = [
  'chest pain', 'difficulty breathing', 'shortness of breath', 'severe bleeding',
  'suicidal', 'suicide', 'unconscious', 'stroke', 'heart attack', 'poisoning',
  'choking', 'seizure', 'severe burn', 'head injury'
];

const detectEmergency = (message) => {
  const text = (message || '').toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => text.includes(kw));
};

const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4) + 10;
};

/**
 * 1. Ultra-Fast Direct Groq Stream (Primary: groq/compound-mini -> Fallback: allam-2-7b)
 */
const streamGroq = (messages, onChunk, modelName = 'groq/compound-mini') => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return reject(new Error('GROQ_API_KEY not configured'));

    const postData = JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 150,
      stream: true
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      agent: groqKeepAliveAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    };

    let fullText = '';
    let isInsideThinkTag = false;

    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Groq API (${modelName}) returned HTTP ${res.statusCode}`));
      }

      res.setEncoding('utf8');
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const jsonStr = trimmed.replace('data: ', '');
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                if (content.includes('<think>')) isInsideThinkTag = true;
                if (content.includes('</think>')) {
                  isInsideThinkTag = false;
                  continue;
                }
                
                if (!isInsideThinkTag && !content.startsWith('<think')) {
                  fullText += content;
                  onChunk(content);
                }
              }
            } catch (e) {
              // Ignore incomplete lines
            }
          }
        }
      });

      res.on('end', () => {
        aiMetrics.groqSuccesses++;
        resolve({
          provider: 'JIVEXA AI',
          text: fullText || 'No response generated.',
          inputTokens: estimateTokens(JSON.stringify(messages)),
          outputTokens: estimateTokens(fullText)
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Groq request timed out'));
    });

    req.write(postData);
    req.end();
  });
};

/**
 * 2. Real-Time Deep Clinical Document Analyzer & Spam Detector
 */
const analyzeReportWithAI = async (documentText, fileName) => {
  const prompt = `You are JIVEXA Clinical Document Analyzer.
Analyze the following document text extracted from a file named "${fileName}":

--- DOCUMENT TEXT START ---
${(documentText || '').slice(0, 3000)}
--- DOCUMENT TEXT END ---

TASK 1: AUTHENTICITY & SPAM DETECTION
Determine if this document is an authentic clinical medical report (such as blood test, CBC, lipid panel, thyroid profile, HbA1c, liver test, kidney test, urine analysis, pathology scan, prescription).
If it is NOT a valid medical report (e.g. invoice, receipt, meme, non-medical document, random text), set isValidReport: false and provide a helpful warning.

TASK 2: CLINICAL PARAMETER EXTRACTION
If valid, extract ALL clinical test parameters present in the text into structured JSON format.

Return ONLY valid JSON matching this EXACT structure:
{
  "isValidReport": true,
  "invalidReason": "",
  "reportTitle": "Complete Blood Count & Lipid Profile",
  "patientName": "Patient",
  "healthScore": 75,
  "scoreStatus": "Requires Attention",
  "summary": "Detailed 1-2 sentence plain language summary of overall report findings.",
  "normalFindings": [
    {
      "name": "Parameter Name",
      "value": "Value with unit",
      "referenceRange": "Ref Range",
      "status": "Normal",
      "simpleExplanation": "Plain explanation"
    }
  ],
  "abnormalFindings": [
    {
      "name": "Parameter Name",
      "value": "Value with unit",
      "referenceRange": "Ref Range",
      "status": "Abnormal",
      "simpleExplanation": "Plain explanation and doctor review recommendation"
    }
  ],
  "attentionParameters": [],
  "questionsForDoctor": [
    "Specific question 1 based on findings",
    "Specific question 2 based on findings"
  ],
  "lifestyleRecommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ]
}`;

  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return reject(new Error('GROQ_API_KEY not configured'));

    const postData = JSON.stringify({
      model: 'groq/compound-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    });

    const req = https.request({
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      agent: groqKeepAliveAgent,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 12000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.message?.content || '';
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const reportData = JSON.parse(jsonMatch[0]);
            return resolve(reportData);
          }
        } catch (e) {
          console.warn('[Report Analyzer] Failed to parse JSON from LLM response');
        }
        reject(new Error('Failed to extract report JSON from LLM'));
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

/**
 * Stream Live AI Response (Sub-80ms Latency)
 */
const streamLiveAiResponse = async (userMessage, history = [], onChunk) => {
  aiMetrics.totalRequests++;

  // 1. Emergency Safety Check
  if (detectEmergency(userMessage)) {
    aiMetrics.emergencyDetections++;
    const emergencyText = `🚨 EMERGENCY WARNING: The symptoms you described require immediate care.
• Call 108 / 112 for an ambulance right away.
• Go to the nearest Hospital Emergency Room (ER).
Do not rely on text advice for emergency symptoms.`;

    onChunk(emergencyText);
    return {
      provider: 'JIVEXA Safety Guardrail',
      isEmergency: true,
      text: emergencyText,
      inputTokens: estimateTokens(userMessage),
      outputTokens: 40
    };
  }

  // Format chat history
  const formattedMessages = [
    ...history.slice(-2).map(h => ({
      role: h.sender === 'user' ? 'user' : 'assistant',
      content: h.text
    })),
    { role: 'user', content: userMessage }
  ];

  // Try 1: Groq Compound Mini (Primary Ultra-Fast)
  try {
    return await streamGroq(formattedMessages, onChunk, 'groq/compound-mini');
  } catch (groqErr) {
    console.warn('[JIVEXA AI] Groq primary error:', groqErr.message);
  }

  // Final Honest Error
  aiMetrics.errors++;
  const errorMsg = 'JIVEXA Assistant is temporarily unavailable, please try again in a moment.';
  onChunk(errorMsg);
  return {
    provider: 'JIVEXA Error Notice',
    text: errorMsg,
    inputTokens: estimateTokens(userMessage),
    outputTokens: 10
  };
};

module.exports = {
  streamLiveAiResponse,
  analyzeReportWithAI,
  detectEmergency,
  aiMetrics,
  SYSTEM_PROMPT
};
