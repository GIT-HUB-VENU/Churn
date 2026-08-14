import { GoogleGenAI } from '@google/genai';

let aiClient = null;

function getAiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Gemini client initialization warning:', err);
    }
  }
  return aiClient;
}

export class GeminiService {
  static async generateMemberExplanation(
    memberId,
    planType,
    churnProbability,
    riskLevel,
    topDrivers,
    approvedActions
  ) {
    const client = getAiClient();

    // Deterministic fallback text
    const defaultText = `This member has an elevated predicted churn risk (${Math.round(churnProbability * 100)}%, Risk Level: ${riskLevel}). The strongest observed contributors to this prediction are ${topDrivers.map(d => d.featureLabel.toLowerCase()).join(', ')}. Recommended compliant retention actions based on observed indicators include ${approvedActions.map(a => a.action).join(' and ')}.`;

    if (!client) {
      return defaultText;
    }

    try {
      const driverSummary = topDrivers.map(d => `- ${d.featureLabel}: observed ${d.observedValue}`).join('\n');
      const actionSummary = approvedActions.map(a => `- ${a.action} (${a.priority} Priority): ${a.reason}`).join('\n');

      const prompt = `You are a healthcare business analyst assisting retention operations.
Generate a concise, professional 2-3 sentence business explanation for member retention advisors.

Context:
- Member ID: ${memberId}
- Plan: ${planType}
- Churn Probability: ${(churnProbability * 100).toFixed(1)}%
- Risk Level: ${riskLevel}

Observed Model Drivers:
${driverSummary}

Approved Retention Actions:
${actionSummary}

CRITICAL MANDATES:
Use only the supplied information. Do not infer facts that are not present. Do not diagnose. Do not infer financial hardship. Do not make unsupported claims. Do not introduce recommendations outside the approved action list. Keep language objective, professional, and compliant.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text ? response.text.trim() : defaultText;
    } catch (err) {
      console.warn('Gemini API call warning (using fallback):', err);
      return defaultText;
    }
  }
}
