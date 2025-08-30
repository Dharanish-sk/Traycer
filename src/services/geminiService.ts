import { GoogleGenerativeAI } from "@google/generative-ai";
import chalk from "chalk";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private jsonModel: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GEMINI_KEY is required");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.jsonModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(chalk.red("Error calling Gemini API:"), error);
      return "";
    }
  }

  async generateJsonContent<T>(prompt: string): Promise<T | null> {
    try {
      const result = await this.jsonModel.generateContent(prompt);
      const jsonResponse = JSON.parse(result.response.text());
      return jsonResponse as T;
    } catch (error) {
      console.error(chalk.red("Error generating or parsing JSON from Gemini:"), error);
      return null;
    }
  }

  async validateRequirements(requirements: string): Promise<{ isValid: boolean; feedback: string }> {
    const validationPrompt = `
You are a requirements analyst. Evaluate if the following project requirements are clear and actionable enough to create a detailed implementation plan.

REQUIREMENTS:
${requirements}

Check for these criteria:
1. CLARITY: Is it clear what needs to be built?
2. SPECIFICITY: Are there specific features or functionality mentioned?
3. TECHNICAL SCOPE: Is the technical scope reasonably defined?
4. ACTIONABILITY: Can a developer understand what to implement?
5. COMPLETENESS: Are there enough details to break into concrete tasks?

VALIDATION RULES:
- Requirements should be more than just a single sentence or vague idea
- Should include specific features, functionality, or technical details
- Should not be just "build an app" or "create a website" without context
- Should provide enough detail for planning concrete implementation steps
- Should be at least 20 words and contain actionable verbs

Respond with either:
"VALID: [brief explanation of why it's actionable]"
or
"INVALID: [specific feedback on what's missing or unclear]"
`;

    const validation = await this.generateContent(validationPrompt);
    const isValid = validation.toLowerCase().includes("valid:");
    
    return { isValid, feedback: validation };
  }
}