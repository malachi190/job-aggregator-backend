import { Injectable } from '@nestjs/common';
import {
  AIPROVIDER,
  TailoredContent,
} from '../interfaces/ai-provider.interface';
import { EnvService } from 'src/config/env.service';
import { Profile, Job } from 'generated/prisma/client';

@Injectable()
export class OpenAiProvider implements AIPROVIDER {
  private readonly model;

  constructor(private readonly env: EnvService) {}

  async generateTailoredCv(
    baseCvText: string,
    jobDescription: string,
    profile: Profile,
    job: Job,
  ): Promise<TailoredContent> {
    const prompt = this.buildPrompt(baseCvText, jobDescription, profile, job);
    return this.callModel(prompt);
  }

  async refineTailoredCv(
    currentContent: TailoredContent,
    feedback: string,
  ): Promise<TailoredContent> {
    const prompt = `You previously generated the following tailored CV and cover letter in JSON format.

CURRENT OUTPUT:
${JSON.stringify(currentContent, null, 2)}

The user has provided the following feedback for adjustments:
"${feedback}"

Please revise the CV and cover letter according to this feedback while maintaining the same JSON structure and all ATS-friendly formatting rules. Return ONLY valid JSON with no markdown code blocks.`;
    return this.callModel(prompt);
  }

  async callModel(prompt: string): Promise<TailoredContent> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();
    return this.parseJson(text);
  }

  private parseJson(text: string): TailoredContent {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as TailoredContent;
  }

  buildPrompt(
    baseCvText: string,
    jobDescription: string,
    profile: Profile,
    job: Job,
  ): string {
    return '';
  }
}
