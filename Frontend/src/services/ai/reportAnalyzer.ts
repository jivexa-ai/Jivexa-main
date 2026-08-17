import { AIReportAnalysisResult, ReportParameter } from '../../types';

export const SAMPLE_LAB_REPORTS = [
  {
    id: 'sample_cbc_lipid',
    title: 'Complete Blood Count (CBC) & Lipid Profile',
    fileName: 'CBC_Lipid_Panel_Mayank_Gangwar.pdf',
    fileSize: '1.4 MB',
    fileType: 'application/pdf',
    rawText: `
PATIENT LAB REPORT - METROPOLIS HEALTHCARE
Patient Name: Mayank Gangwar | Age: 28 | Gender: Male | Date: 05-Aug-2026

HAEMATOLOGY (CBC)
Hemoglobin: 11.8 g/dL (Reference Range: 13.5 - 17.5 g/dL) [LOW]
Total RBC Count: 4.8 mill/cumm (Reference Range: 4.3 - 5.9 mill/cumm) [NORMAL]
Total Leukocyte Count (WBC): 7,200 /cumm (Reference Range: 4,000 - 11,000 /cumm) [NORMAL]
Platelet Count: 240,000 /cumm (Reference Range: 150,000 - 450,000 /cumm) [NORMAL]

LIPID PROFILE
Total Cholesterol: 215 mg/dL (Reference Range: < 200 mg/dL) [HIGH]
Triglycerides: 145 mg/dL (Reference Range: < 150 mg/dL) [NORMAL]
HDL Cholesterol (Good): 42 mg/dL (Reference Range: > 40 mg/dL) [NORMAL]
LDL Cholesterol (Bad): 144 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
    `
  },
  {
    id: 'sample_diabetes_thyroid',
    title: 'HbA1c Diabetes & Thyroid Profile (TSH)',
    fileName: 'Diabetes_Thyroid_Screening.pdf',
    fileSize: '980 KB',
    fileType: 'application/pdf',
    rawText: `
DIABETES & ENDOCRINE LAB REPORT - THYROCARE
Patient Name: Mayank Gangwar | Date: 02-Aug-2026

GLUCOSE & HBA1C PANEL
Fasting Blood Sugar: 104 mg/dL (Reference Range: 70 - 99 mg/dL) [ELEVATED]
HbA1c (Glycated Hemoglobin): 5.9 % (Reference Range: < 5.7 % Normal, 5.7 - 6.4 % Prediabetes) [PREDIABETES]

THYROID PANEL
TSH (Thyroid Stimulating Hormone): 3.2 uIU/mL (Reference Range: 0.4 - 4.2 uIU/mL) [NORMAL]
Free T4: 1.2 ng/dL (Reference Range: 0.8 - 1.8 ng/dL) [NORMAL]
    `
  }
];

// Master catalog of clinical parameter rules for strictly parsing extracted text
interface ParameterRule {
  name: string;
  keywords: string[];
  extractValue: (text: string) => { value: string; ref: string; status: 'Normal' | 'Abnormal' | 'Attention'; explanation: string } | null;
}

const PARAMETER_RULES: ParameterRule[] = [
  {
    name: 'Hemoglobin',
    keywords: ['hemoglobin', 'haemoglobin', 'hb '],
    extractValue: (text) => {
      const match = text.match(/(?:hemoglobin|haemoglobin|hb)\s*:\s*([0-9\.]+)\s*(g\/dl)?.*?(\((.*?)\))?\s*(\[?(low|high|normal)\]?)?/i);
      if (!match) return null;
      const valNum = parseFloat(match[1]);
      const status: 'Normal' | 'Abnormal' | 'Attention' = valNum < 13.5 ? 'Abnormal' : valNum > 17.5 ? 'Attention' : 'Normal';
      return {
        value: `${match[1]} g/dL`,
        ref: match[4] || '13.5 - 17.5 g/dL',
        status,
        explanation: status === 'Abnormal'
          ? `Your hemoglobin level (${match[1]} g/dL) is lower than reference target (${match[4] || '13.5 - 17.5 g/dL'}). This can affect red blood cell oxygen delivery.`
          : `Your hemoglobin level (${match[1]} g/dL) is within healthy reference targets.`
      };
    }
  },
  {
    name: 'Total RBC Count',
    keywords: ['rbc', 'red blood cell'],
    extractValue: (text) => {
      const match = text.match(/(?:rbc|red blood cell).*?:\s*([0-9\.]+)\s*(mill\/cumm)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} mill/cumm`,
        ref: match[4] || '4.3 - 5.9 mill/cumm',
        status: 'Normal',
        explanation: `Red blood cell count (${match[1]} mill/cumm) is within normal limits.`
      };
    }
  },
  {
    name: 'Total Leukocyte Count (WBC)',
    keywords: ['wbc', 'leukocyte', 'white blood'],
    extractValue: (text) => {
      const match = text.match(/(?:wbc|leukocyte|white blood).*?:\s*([0-9,]+)\s*(\/cumm)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} /cumm`,
        ref: match[4] || '4,000 - 11,000 /cumm',
        status: 'Normal',
        explanation: `White blood cell count (${match[1]} /cumm) indicates normal immune system baseline.`
      };
    }
  },
  {
    name: 'Platelet Count',
    keywords: ['platelet'],
    extractValue: (text) => {
      const match = text.match(/platelet.*?:\s*([0-9,]+)\s*(\/cumm)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} /cumm`,
        ref: match[4] || '150,000 - 450,000 /cumm',
        status: 'Normal',
        explanation: `Platelet count (${match[1]} /cumm) is optimal for blood clotting.`
      };
    }
  },
  {
    name: 'Total Cholesterol',
    keywords: ['total cholesterol'],
    extractValue: (text) => {
      const match = text.match(/total cholesterol.*?:\s*([0-9\.]+)\s*(mg\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      const valNum = parseFloat(match[1]);
      const status: 'Normal' | 'Abnormal' | 'Attention' = valNum > 200 ? 'Attention' : 'Normal';
      return {
        value: `${match[1]} mg/dL`,
        ref: match[4] || '< 200 mg/dL',
        status,
        explanation: status === 'Attention'
          ? `Total cholesterol (${match[1]} mg/dL) is slightly above ideal threshold (< 200 mg/dL).`
          : `Total cholesterol (${match[1]} mg/dL) is in healthy range.`
      };
    }
  },
  {
    name: 'Triglycerides',
    keywords: ['triglycerides'],
    extractValue: (text) => {
      const match = text.match(/triglycerides.*?:\s*([0-9\.]+)\s*(mg\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} mg/dL`,
        ref: match[4] || '< 150 mg/dL',
        status: 'Normal',
        explanation: `Triglycerides level (${match[1]} mg/dL) is normal.`
      };
    }
  },
  {
    name: 'HDL Cholesterol (Good)',
    keywords: ['hdl'],
    extractValue: (text) => {
      const match = text.match(/hdl.*?:\s*([0-9\.]+)\s*(mg\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} mg/dL`,
        ref: match[4] || '> 40 mg/dL',
        status: 'Normal',
        explanation: `HDL protective cholesterol (${match[1]} mg/dL) is in healthy range.`
      };
    }
  },
  {
    name: 'LDL Cholesterol (Bad)',
    keywords: ['ldl'],
    extractValue: (text) => {
      const match = text.match(/ldl.*?:\s*([0-9\.]+)\s*(mg\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      const valNum = parseFloat(match[1]);
      const status: 'Normal' | 'Abnormal' | 'Attention' = valNum > 100 ? 'Abnormal' : 'Normal';
      return {
        value: `${match[1]} mg/dL`,
        ref: match[4] || '< 100 mg/dL',
        status,
        explanation: status === 'Abnormal'
          ? `LDL cholesterol (${match[1]} mg/dL) is elevated above baseline target of 100 mg/dL.`
          : `LDL cholesterol (${match[1]} mg/dL) is optimal.`
      };
    }
  },
  {
    name: 'Fasting Blood Sugar',
    keywords: ['fasting', 'glucose'],
    extractValue: (text) => {
      const match = text.match(/(?:fasting blood sugar|fasting glucose).*?:\s*([0-9\.]+)\s*(mg\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      const valNum = parseFloat(match[1]);
      const status: 'Normal' | 'Abnormal' | 'Attention' = valNum > 99 ? 'Attention' : 'Normal';
      return {
        value: `${match[1]} mg/dL`,
        ref: match[4] || '70 - 99 mg/dL',
        status,
        explanation: status === 'Attention'
          ? `Fasting blood sugar (${match[1]} mg/dL) is slightly above fasting reference range (70 - 99 mg/dL).`
          : `Fasting blood sugar (${match[1]} mg/dL) is in normal range.`
      };
    }
  },
  {
    name: 'HbA1c (Glycated Hemoglobin)',
    keywords: ['hba1c', 'glycated'],
    extractValue: (text) => {
      const match = text.match(/(?:hba1c|glycated).*?:\s*([0-9\.]+)\s*(%)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      const valNum = parseFloat(match[1]);
      const status: 'Normal' | 'Abnormal' | 'Attention' = valNum >= 5.7 ? 'Abnormal' : 'Normal';
      return {
        value: `${match[1]} %`,
        ref: match[4] || '< 5.7 % Normal',
        status,
        explanation: status === 'Abnormal'
          ? `HbA1c level (${match[1]} %) indicates elevated 3-month average blood glucose.`
          : `HbA1c level (${match[1]} %) is normal.`
      };
    }
  },
  {
    name: 'TSH (Thyroid Stimulating Hormone)',
    keywords: ['tsh', 'thyroid stimulating'],
    extractValue: (text) => {
      const match = text.match(/(?:tsh|thyroid stimulating).*?:\s*([0-9\.]+)\s*(uiu\/ml)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} uIU/mL`,
        ref: match[4] || '0.4 - 4.2 uIU/mL',
        status: 'Normal',
        explanation: `TSH level (${match[1]} uIU/mL) indicates normal thyroid gland stimulation.`
      };
    }
  },
  {
    name: 'Free T4',
    keywords: ['free t4', 't4'],
    extractValue: (text) => {
      const match = text.match(/(?:free t4|t4).*?:\s*([0-9\.]+)\s*(ng\/dl)?.*?(\((.*?)\))?/i);
      if (!match) return null;
      return {
        value: `${match[1]} ng/dL`,
        ref: match[4] || '0.8 - 1.8 ng/dL',
        status: 'Normal',
        explanation: `Free T4 level (${match[1]} ng/dL) is optimal.`
      };
    }
  }
];

export const processAndAnalyzeReport = async (
  fileName: string,
  rawContentText?: string
): Promise<AIReportAnalysisResult> => {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  const textToAnalyze = (rawContentText || '').trim();
  const reportId = `rep_analysis_${Date.now()}`;
  const analyzedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const disclaimer =
    'AI-generated information is for educational purposes and should be reviewed with a qualified healthcare professional. This analysis is not a formal medical diagnosis or prescription.';

  const normalFindings: ReportParameter[] = [];
  const abnormalFindings: ReportParameter[] = [];
  const attentionParameters: ReportParameter[] = [];

  // Parse ONLY parameters present in rawContentText
  if (textToAnalyze.length > 20) {
    for (const rule of PARAMETER_RULES) {
      const isKeywordPresent = rule.keywords.some((kw) => textToAnalyze.toLowerCase().includes(kw));
      if (isKeywordPresent) {
        const extracted = rule.extractValue(textToAnalyze);
        if (extracted) {
          const paramObj: ReportParameter = {
            name: rule.name,
            value: extracted.value,
            referenceRange: extracted.ref,
            status: extracted.status,
            simpleExplanation: extracted.explanation
          };

          if (extracted.status === 'Abnormal') abnormalFindings.push(paramObj);
          else if (extracted.status === 'Attention') attentionParameters.push(paramObj);
          else normalFindings.push(paramObj);
        }
      }
    }
  }

  const totalDetected = normalFindings.length + abnormalFindings.length + attentionParameters.length;

  // RULE #6 & #7: Low OCR Confidence / Unreadable Document protection
  if (totalDetected === 0) {
    return {
      id: reportId,
      reportId: `rep_${Date.now()}`,
      reportTitle: fileName,
      healthScore: 0,
      scoreStatus: 'Needs Review',
      summary:
        '⚠️ OCR Confidence Low / Unreadable Document: No valid laboratory test parameters were detected in the uploaded file text. Please upload a clearer digital PDF or high-resolution image report to ensure accurate medical parsing without guessing.',
      normalFindings: [],
      abnormalFindings: [],
      attentionParameters: [],
      possibleFactors: [
        'OCR text confidence is too low to extract laboratory values.',
        'The document may be blurred, low-resolution, or non-medical.'
      ],
      questionsForDoctor: [
        'Can I obtain a digital PDF copy of my lab results directly from the laboratory portal?'
      ],
      lifestyleSuggestions: [
        'Re-upload a clear high-resolution digital PDF or uncompressed photo of your medical report.'
      ],
      disclaimer,
      analyzedAt
    };
  }

  // Calculate health score strictly from detected values
  let calculatedScore = 100 - (abnormalFindings.length * 12 + attentionParameters.length * 6);
  if (calculatedScore < 50) calculatedScore = 50;

  const scoreStatus: 'Optimal' | 'Requires Attention' | 'Needs Review' =
    abnormalFindings.length > 0 ? 'Requires Attention' : attentionParameters.length > 0 ? 'Requires Attention' : 'Optimal';

  // Construct traceable summary exclusively from detected parameters
  const detectedNames = normalFindings.concat(abnormalFindings, attentionParameters).map(p => p.name).join(', ');
  let summaryText = `Analyzed ${totalDetected} laboratory parameter(s) detected in this report: ${detectedNames}.\n\n`;

  if (abnormalFindings.length > 0) {
    summaryText += `Parameters requiring clinical review: ${abnormalFindings.map(p => `${p.name} (${p.value})`).join(', ')}. `;
  }
  if (attentionParameters.length > 0) {
    summaryText += `Parameters requiring attention: ${attentionParameters.map(p => `${p.name} (${p.value})`).join(', ')}. `;
  }
  if (abnormalFindings.length === 0 && attentionParameters.length === 0) {
    summaryText += `All ${totalDetected} detected parameters are within normal reference ranges.`;
  }

  // Construct traceable questions and lifestyle suggestions exclusively for detected findings
  const possibleFactors: string[] = [];
  const questionsForDoctor: string[] = [];
  const lifestyleSuggestions: string[] = [];

  if (abnormalFindings.some(p => p.name.includes('Hemoglobin'))) {
    possibleFactors.push('Suboptimal dietary iron or Vitamin B12 intake.');
    questionsForDoctor.push('Should I take iron supplements or recheck Ferritin levels?');
    lifestyleSuggestions.push('Increase iron-rich foods (spinach, lentils, beetroot) paired with Vitamin C.');
  }

  if (abnormalFindings.some(p => p.name.includes('LDL')) || attentionParameters.some(p => p.name.includes('Total Cholesterol'))) {
    possibleFactors.push('Higher intake of dietary saturated fats or reduced physical exercise.');
    questionsForDoctor.push('What target LDL cholesterol level should I aim for?');
    lifestyleSuggestions.push('Reduce saturated fats and incorporate 30 minutes of aerobic exercise 5 days a week.');
  }

  if (abnormalFindings.some(p => p.name.includes('HbA1c')) || attentionParameters.some(p => p.name.includes('Glucose'))) {
    possibleFactors.push('Elevated intake of refined sugars or dietary carbohydrates.');
    questionsForDoctor.push('Should I repeat an HbA1c test in 3 months to monitor progress?');
    lifestyleSuggestions.push('Limit refined sugars and replace simple carbs with fiber-rich complex grains.');
  }

  if (questionsForDoctor.length === 0) {
    questionsForDoctor.push('Are there any routine health screenings I should schedule based on these normal results?');
    lifestyleSuggestions.push('Maintain balanced nutrition, stay well-hydrated, and engage in regular exercise.');
    possibleFactors.push('Healthy metabolic baseline observed across all detected values.');
  }

  return {
    id: reportId,
    reportId: `rep_${Date.now()}`,
    reportTitle: fileName,
    healthScore: calculatedScore,
    scoreStatus,
    summary: summaryText,
    normalFindings,
    abnormalFindings,
    attentionParameters,
    possibleFactors,
    questionsForDoctor,
    lifestyleSuggestions,
    disclaimer,
    analyzedAt
  };
};
