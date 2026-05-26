import OpenAI from 'openai';
import { config } from 'dotenv';
import { saveWorkflowResult } from './db';

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1'
});

interface GenerateOptions {
  workflowId: string;
  description: string;
  language: string;
  framework: string;
  detailed: boolean;
  userId: string;
}

export async function generateWorkflow(options: GenerateOptions) {
  const { workflowId, description, language, framework, detailed, userId } = options;

  try {
    // Update status to processing
    await saveWorkflowResult(workflowId, {
      status: 'processing',
      result: null,
      error: null,
      credits_used: detailed ? 2 : 1,
      user_id: userId
    });

    const systemPrompt = `You are an expert at generating browser automation code.

Generate ${language} code using ${framework} framework based on the user's description.

Requirements:
1. The code must be production-ready and include error handling
2. Add comments explaining key parts
3. Include waitForLoadState and other reliability best practices
4. Make configurable values as variables at the top
5. The code should be self-contained and runnable

Respond ONLY with the code, no extra text or explanations.`;

    const userPrompt = `Generate automation code for: "${description}"

Use ${language} and ${framework} framework.

${detailed ? 'Please include detailed comments and error handling.' : 'Keep it concise but functional.'}`;

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: detailed ? 2000 : 1000
    });

    const generatedCode = response.choices[0]?.message?.content || '';

    // Extract variables (simple heuristic)
    const variables = extractVariables(generatedCode);

    // Generate suggestions
    const suggestions = generateSuggestions(generatedCode);

    // Save result
    await saveWorkflowResult(workflowId, {
      status: 'completed',
      result: {
        code: generatedCode,
        language,
        framework,
        variables,
        quality_score: 0.85,
        suggestions
      },
      error: null,
      credits_used: detailed ? 2 : 1,
      user_id: userId
    });

  } catch (error) {
    console.error('Workflow generation error:', error);

    await saveWorkflowResult(workflowId, {
      status: 'failed',
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      credits_used: 0, // Refund credits on failure
      user_id: userId
    });
  }
}

function extractVariables(code: string): Array<{ name: string; suggested_value: string }> {
  const variables: Array<{ name: string; suggested_value: string }> = [];

  // Look for URLs, emails, passwords, etc.
  const urlMatch = code.match(/['"](https?:\/\/[^\s'"]+)['"]/);
  if (urlMatch) {
    variables.push({ name: 'URL', suggested_value: urlMatch[1] });
  }

  const emailMatch = code.match(/['"]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"]/);
  if (emailMatch) {
    variables.push({ name: 'EMAIL', suggested_value: emailMatch[1] });
  }

  return variables;
}

function generateSuggestions(code: string): string[] {
  const suggestions: string[] = [];

  if (!code.includes('try')) {
    suggestions.push('Consider adding try-catch error handling for production use');
  }

  if (!code.includes('waitFor')) {
    suggestions.push('Add waitForLoadState for more reliable navigation');
  }

  if (code.includes('hardcoded') || code.includes('example.com')) {
    suggestions.push('Replace example values with your actual data');
  }

  suggestions.push('Test the script in a safe environment first');

  return suggestions;
}

// Mock functions - implement these with your actual DB
async function getWorkflowStatus(workflowId: string) {
  // Implement with Redis/PostgreSQL
  return {
    status: 'queued',
    result: null,
    error: null,
    credits_used: 0
  };
}

async function getCreditBalance(userId: string) {
  // Implement with your DB
  return 99;
}

export { getWorkflowStatus, getCreditBalance };
