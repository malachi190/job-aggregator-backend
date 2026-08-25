import { load } from 'cheerio';

const TECH_TITLE_PATTERNS = [
  /\b(?:software|application|web|frontend|front-end|backend|back-end|full[ -]?stack|mobile|android|ios|flutter|react|node(?:\.js)?|java|python|php|ruby|golang|\.net)\b.*\b(?:engineer|developer|architect|programmer|consultant|specialist|intern)\b/i,
  /\b(?:engineer|developer|architect|programmer)\b.*\b(?:software|application|web|frontend|front-end|backend|back-end|full[ -]?stack|mobile|android|ios|cloud|platform|systems?)\b/i,
  /\b(?:devops|devsecops|site reliability|sre|cloud engineer|platform engineer|infrastructure engineer)\b/i,
  /\b(?:data engineer|data scientist|data analyst|analytics engineer|business intelligence|bi developer|database administrator|dba)\b/i,
  /\b(?:machine learning|ml engineer|artificial intelligence|ai engineer|computer vision|nlp engineer)\b/i,
  /\b(?:cyber ?security|information security|security engineer|security analyst|penetration tester|soc analyst)\b/i,
  /\b(?:qa engineer|quality assurance|test automation|automation tester|software tester)\b/i,
  /\b(?:ui\/ux|ui designer|ux designer|product designer|interaction designer)\b/i,
  /\b(?:it support|technical support|systems? administrator|network administrator|network engineer|solutions? architect)\b/i,
  /\b(?:technical product manager|technical program manager|scrum master)\b/i,
];

const SKILL_TERMS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Angular',
  'Vue',
  'Node.js',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'C#',
  '.NET',
  'SQL',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'Terraform',
  'Linux',
  'Git',
  'Figma',
  'Machine Learning',
];

export function isTechJob(job: { title: string; skills?: string[] }): boolean {
  const searchable = [job.title, ...(job.skills ?? [])].join(' ');
  return TECH_TITLE_PATTERNS.some((pattern) => pattern.test(searchable));
}

export function extractSkills(...values: string[]): string[] {
  const text = values.join(' ');
  return SKILL_TERMS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
  });
}

export function deduplicateSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const key = skill.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function stripHtml(value: string): string {
  return normalizeWhitespace(load(value).root().text());
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function inferSeniority(title: string): string {
  if (/\b(?:intern|internship|trainee)\b/i.test(title)) return 'intern';
  if (/\b(?:junior|jr\.?|entry[ -]level|graduate)\b/i.test(title))
    return 'junior';
  if (/\b(?:lead|principal|staff|head|director)\b/i.test(title)) return 'lead';
  if (/\b(?:senior|sr\.?)\b/i.test(title)) return 'senior';
  return 'mid';
}

export function parseSalary(value: string): {
  salaryMin?: number;
  salaryMax?: number;
} {
  const amounts = value
    .match(/[\d,.]+\s*[kKmM]?/g)
    ?.map((amount) => {
      const suffix = amount.trim().slice(-1).toLowerCase();
      const multiplier =
        suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : 1;
      const numeric =
        suffix === 'k' || suffix === 'm' ? amount.slice(0, -1) : amount;
      return Number(numeric.replace(/[,.\s]/g, '')) * multiplier;
    })
    .filter(Number.isFinite);

  return {
    salaryMin: amounts?.[0],
    salaryMax: amounts?.[1] ?? amounts?.[0],
  };
}

export function inferSalaryCurrency(
  value: string,
  location = '',
  fallback = 'USD',
): string {
  const explicitCurrencies: Array<[RegExp, string]> = [
    [/₦|\bNGN\b|\bNigerian naira\b/i, 'NGN'],
    [/C\$|\bCAD\b|\bCanadian dollars?\b/i, 'CAD'],
    [/A\$|\bAUD\b|\bAustralian dollars?\b/i, 'AUD'],
    [/NZ\$|\bNZD\b|\bNew Zealand dollars?\b/i, 'NZD'],
    [/S\$|\bSGD\b|\bSingapore dollars?\b/i, 'SGD'],
    [/£|\bGBP\b|\bBritish pounds?\b/i, 'GBP'],
    [/€|\bEUR\b|\beuros?\b/i, 'EUR'],
    [/US\$|\bUSD\b|\bUS dollars?\b|\$/i, 'USD'],
  ];
  const explicit = explicitCurrencies.find(([pattern]) => pattern.test(value));
  if (explicit) return explicit[1];

  const locationCurrencies: Array<[RegExp, string]> = [
    [/\b(?:Nigeria|Lagos|Abuja)\b/i, 'NGN'],
    [
      /\b(?:United Kingdom|UK|England|Scotland|Wales|Northern Ireland)\b/i,
      'GBP',
    ],
    [
      /\b(?:Europe|European Union|EU|Germany|France|Spain|Italy|Netherlands|Belgium|Portugal|Ireland|Austria|Finland|Greece)\b/i,
      'EUR',
    ],
    [/\bCanada\b/i, 'CAD'],
    [/\bAustralia\b/i, 'AUD'],
    [/\bNew Zealand\b/i, 'NZD'],
    [/\bSingapore\b/i, 'SGD'],
    [/\b(?:United States|USA|US)\b/i, 'USD'],
  ];
  const inferred = new Set(
    locationCurrencies
      .filter(([pattern]) => pattern.test(location))
      .map(([, currency]) => currency),
  );

  return inferred.size === 1 ? [...inferred][0] : fallback;
}

export function parseListingDate(value: string, now = new Date()): Date {
  const relative = value.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/i);
  if (relative) {
    const date = new Date(now);
    const amount = Number(relative[1]);
    const unit = relative[2].toLowerCase();
    if (unit === 'hour') date.setHours(date.getHours() - amount);
    if (unit === 'day') date.setDate(date.getDate() - amount);
    if (unit === 'week') date.setDate(date.getDate() - amount * 7);
    if (unit === 'month') date.setMonth(date.getMonth() - amount);
    return date;
  }

  const withYear = new Date(
    `${normalizeWhitespace(value)} ${now.getFullYear()}`,
  );
  if (Number.isNaN(withYear.getTime())) return now;
  if (withYear.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    withYear.setFullYear(withYear.getFullYear() - 1);
  }
  return withYear;
}
