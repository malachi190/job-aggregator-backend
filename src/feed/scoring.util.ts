import { Profile, Job } from 'generated/prisma/client';

export const MIN_FEED_SCORE = 0.15;

export interface ScoreDetails {
  skills: number;
  title: number;
  seniority: number;
  location: number;
  recency: number;
  overall: number;
}

export interface ScoreResult {
  score: number;
  details: ScoreDetails;
}

export function calculateScore(profile: Profile, job: Job): ScoreResult {
  const pSkills = new Set(profile.skills.map((s) => s.toLowerCase().trim()));
  const jSkills = new Set(job.skills.map((s) => s.toLowerCase().trim()));
  const intersection = new Set([...pSkills].filter((s) => jSkills.has(s)));
  const union = new Set([...pSkills, ...jSkills]);
  const skillsRaw = union.size === 0 ? 0 : intersection.size / union.size;

  const pTitles = profile.jobTitles.map((t) => t.toLowerCase());
  const jTitle = job.title.toLowerCase();
  const titleRaw = pTitles.some((t) => jTitle.includes(t)) ? 1 : 0;

  const pSeniority = profile.seniority.toLowerCase();
  const jSeniority = job.seniority?.toLowerCase();
  let seniorityRaw = 0;
  if (pSeniority === jSeniority) seniorityRaw = 1;
  else if (areAdjacent(pSeniority, jSeniority as string)) seniorityRaw = 0.5;

  let locationRaw = 0;
  if (job.isRemote && profile.remotePref) locationRaw = 1;
  else if (job.location.toLowerCase().includes(profile.location.toLowerCase()))
    locationRaw = 1;

  const daysSincePosted =
    (Date.now() - job.postedAt.getTime()) / (1000 * 60 * 60 * 24);
  let recencyRaw = 0;
  if (daysSincePosted <= 1) recencyRaw = 1;
  else if (daysSincePosted <= 7) recencyRaw = 0.5;
  else if (daysSincePosted <= 30) recencyRaw = 0.25;

  const score =
    skillsRaw * 0.5 +
    titleRaw * 0.35 +
    seniorityRaw * 0.08 +
    locationRaw * 0.04 +
    recencyRaw * 0.03;

  const details: ScoreDetails = {
    skills: Math.round(skillsRaw * 100),
    title: Math.round(titleRaw * 100),
    seniority: Math.round(seniorityRaw * 100),
    location: Math.round(locationRaw * 100),
    recency: Math.round(recencyRaw * 100),
    overall: Math.round(score * 100),
  };

  return { score: Math.round(score * 100) / 100, details };
}

function areAdjacent(a: string, b: string): boolean {
  const levels = [
    'intern',
    'junior',
    'mid',
    'senior',
    'lead',
    'staff',
    'principal',
  ];
  const i = levels.indexOf(a);
  const j = levels.indexOf(b);
  if (i === -1 || j === -1) return false;
  return Math.abs(i - j) === 1;
}
