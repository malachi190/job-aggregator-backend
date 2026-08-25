import { Job, Profile } from 'generated/prisma/client';
import { calculateScore } from './scoring.util';

const profile = {
  skills: ['TypeScript', 'Node.js'],
  jobTitles: ['Backend Engineer'],
  seniority: 'Mid-Level',
  location: 'Lagos',
  remotePref: true,
} as Profile;

const job = {
  skills: ['typescript', 'PostgreSQL'],
  title: 'Backend Engineer',
  seniority: 'mid',
  location: 'Anywhere',
  isRemote: true,
  postedAt: new Date(),
} as Job;

describe('calculateScore', () => {
  it('normalizes skills and mid-level seniority', () => {
    const result = calculateScore(profile, job);
    expect(result.details.skills).toBe(33);
    expect(result.details.seniority).toBe(100);
    expect(result.details.title).toBe(100);
    expect(result.details.location).toBe(100);
  });

  it('gives partial seniority credit to adjacent levels', () => {
    const result = calculateScore(profile, { ...job, seniority: 'senior' });
    expect(result.details.seniority).toBe(50);
  });
});
