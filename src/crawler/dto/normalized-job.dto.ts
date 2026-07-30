export interface NormalizedJob {
  externalId: string;
  title: string;
  company: string;
  description: string;
  skills: string[];
  seniority: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  isRemote?: boolean;
  postedAt: Date;
}
