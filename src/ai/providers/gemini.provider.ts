import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Profile, Job } from 'generated/prisma/client';
import {
  AIPROVIDER,
  TailoredContent,
} from '../interfaces/ai-provider.interface';
import { EnvService } from 'src/config/env.service';

@Injectable()
export class GeminiProvider implements AIPROVIDER {
  private readonly model;

  constructor(private readonly env: EnvService) {
    const genAI = new GoogleGenerativeAI(this.env.geminiApiKey);
    this.model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  }

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

  buildPrompt(
    baseCvText: string,
    jobDescription: string,
    profile: Profile,
    job: Job,
  ): string {
    return `You are an expert career coach and ATS optimization specialist. Your task is to generate a tailored CV and cover letter for a job application using the candidate's base CV and the job description.

Follow this 10-point checklist rigorously:
1. CV title matches or closely aligns with the job title
2. Verbatim keywords from the job description are included
3. Experience section structure mirrors the job's stated requirements
4. Quantifiable achievements with real numbers are included
5. CV is in ATS-friendly format (single column, standard fonts, clear headings)
6. Location/logistics concerns are addressed proactively
7. Cover letter shows genuine, job-specific interest (not generic)
8. Exact technical terminology from the posting is used throughout
9. Alignment with the company's stated values (if listed)
10. Emphasize recency and relevance of skills

CANDIDATE PROFILE:
- Role: ${profile.role}
- Skills: ${profile.skills.join(', ')}
- Seniority: ${profile.seniority}
- Location: ${profile.location}
- Remote Preference: ${profile.remotePref ? 'Yes' : 'No'}
- Job Titles: ${profile.jobTitles.join(', ')}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Remote: ${job.isRemote ? 'Yes' : 'No'}
- Seniority: ${job.seniority}
- Skills Required: ${job.skills.join(', ')}

JOB DESCRIPTION:
${job.description || jobDescription}

BASE CV CONTENT:
${baseCvText}

Return ONLY a valid JSON object with this exact structure (no markdown, no prose). The CV must follow this professional resume format:

{
  "cv": {
    "title": "Job Title Here",
    "contact": {
      "email": "candidate@email.com",
      "phone": "+1234567890",
      "linkedin": "LinkedIn URL or empty string",
      "github": "GitHub URL or empty string",
      "portfolio": "Portfolio URL or empty string"
    },
    "summary": "2-3 paragraph professional summary tailored to the job",
    "skills": {
      "Backend Stack": "comma or semicolon separated skills",
      "Programming Languages": "comma or semicolon separated skills",
      "Cloud & Infrastructure": "comma or semicolon separated skills",
      "Databases": "comma or semicolon separated skills",
      "Other relevant category": "comma or semicolon separated skills"
    },
    "experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "dates": "MM/YYYY-MM/YYYY",
        "bullets": [
          "Achievement bullet with metrics and job-specific keywords",
          "Another achievement bullet"
        ]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "University Name"
      }
    ],
    "projects": [
      {
        "name": "Project Name | Tech Stack",
        "tech": "Tech Stack",
        "description": "1-2 sentence description"
      }
    ]
  },
  "coverLetter": {
    "greeting": "Dear Hiring Manager,",
    "body": "3-4 paragraphs showing specific interest in the role and company, referencing job requirements and candidate alignment",
    "closing": "Sincerely,\\n\\nCandidate Name"
  }
}`;
  }

  private parseJson(text: string): TailoredContent {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    let cleaned = jsonString
      .replace(/```json|```/g, '')
      .replace(/^[^\{]*/, '')
      .replace(/[^\}]*$/, '')
      .trim();

    cleaned = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      .replace(/[\x00-\x1F\x7F]/g, '');

    let raw: any;
    try {
      raw = JSON.parse(cleaned);
    } catch (err) {
      console.error(
        'Failed to parse AI JSON. Raw text:',
        text.substring(0, 1000),
      );
      return this.getEmptyContent();
    }

    return this.normalizeContent(raw);
  }

  private normalizeContent(raw: any): TailoredContent {
    const cv = raw?.cv || {};
    const cl = raw?.coverLetter || raw?.cover_letter || {};

    return {
      cv: {
        title: String(cv.title || ''),
        contact: {
          email: String(cv.contact?.email || ''),
          phone: String(cv.contact?.phone || ''),
          linkedin: String(cv.contact?.linkedin || ''),
          github: String(cv.contact?.github || ''),
          portfolio: String(cv.contact?.portfolio || ''),
        },
        summary: String(cv.summary || ''),
        skills: this.normalizeSkills(cv.skills),
        experience: Array.isArray(cv.experience)
          ? cv.experience.map((exp: any) => ({
              title: String(exp.title || ''),
              company: String(exp.company || ''),
              dates: String(exp.dates || ''),
              bullets: Array.isArray(exp.bullets)
                ? exp.bullets.map(String)
                : [],
            }))
          : [],
        education: Array.isArray(cv.education)
          ? cv.education.map((edu: any) => ({
              degree: String(edu.degree || ''),
              institution: String(edu.institution || ''),
            }))
          : [],
        projects: Array.isArray(cv.projects)
          ? cv.projects.map((proj: any) => ({
              name: String(proj.name || ''),
              tech: String(proj.tech || ''),
              description: String(proj.description || ''),
            }))
          : [],
      },
      coverLetter: {
        greeting: String(cl.greeting || 'Dear Hiring Manager,'),
        body: String(cl.body || ''),
        closing: String(cl.closing || 'Sincerely,'),
      },
    };
  }

  private normalizeSkills(skills: any): Record<string, string> {
    if (!skills || typeof skills !== 'object') return {};
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(skills)) {
      normalized[String(key)] = String(value);
    }
    return normalized;
  }

  private getEmptyContent(): TailoredContent {
    return {
      cv: {
        title: '',
        contact: {
          email: '',
          phone: '',
          linkedin: '',
          github: '',
          portfolio: '',
        },
        summary: '',
        skills: {},
        experience: [],
        education: [],
        projects: [],
      },
      coverLetter: { greeting: '', body: '', closing: '' },
    };
  }
}
