import { Job, Profile } from 'generated/prisma/client';

export interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
}

export interface ProjectEntry {
  name: string;
  tech: string;
  description: string;
}

export interface TailoredContent {
  cv: {
    title: string;
    contact: {
      email: string;
      phone: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
    summary: string;
    skills: Record<string, string>;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    projects: ProjectEntry[];
  };
  coverLetter: {
    greeting: string;
    body: string;
    closing: string;
  };
}

export interface AIPROVIDER {
  generateTailoredCv(
    baseCvText: string,
    jobDescription: string,
    profile: Profile,
    job: Job,
  ): Promise<TailoredContent>;

  refineTailoredCv(
    currentContent: TailoredContent,
    feedback: string,
  ): Promise<TailoredContent>;

  buildPrompt(
    baseCvText: string,
    jobDescription: string,
    profile: Profile,
    job: Job,
  ): string;

  callModel(prompt: string): Promise<TailoredContent>;
}
