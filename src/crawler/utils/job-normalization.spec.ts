import {
  deduplicateSkills,
  inferSalaryCurrency,
  isTechJob,
  parseListingDate,
  parseSalary,
} from './job-normalization';

describe('job normalization', () => {
  it.each([
    'Senior Software Engineer',
    'Machine Learning Engineer',
    'Cybersecurity Analyst',
    'UI/UX Designer',
    'IT Support Specialist',
  ])('recognizes a technical role: %s', (title) => {
    expect(isTechJob({ title })).toBe(true);
  });

  it.each(['Tech Sales Executive', 'Digital Marketer', 'Account Manager'])(
    'rejects a non-technical role: %s',
    (title) => expect(isTechJob({ title })).toBe(false),
  );

  it('normalizes full and abbreviated salary amounts', () => {
    expect(parseSalary('NGN 250,000 - 400,000')).toEqual({
      salaryMin: 250_000,
      salaryMax: 400_000,
    });
    expect(parseSalary('$175k - $190k')).toEqual({
      salaryMin: 175_000,
      salaryMax: 190_000,
    });
    expect(inferSalaryCurrency('NGN 250,000 - 400,000')).toBe('NGN');
    expect(inferSalaryCurrency('$175k - $190k')).toBe('USD');
  });

  it('parses relative listing dates', () => {
    const now = new Date('2026-08-25T12:00:00Z');
    expect(parseListingDate('6 days ago', now)).toEqual(
      new Date('2026-08-19T12:00:00Z'),
    );
  });

  it('deduplicates skills without regard to capitalization', () => {
    expect(deduplicateSkills(['React', 'react', 'Go', 'golang'])).toEqual([
      'React',
      'Go',
      'golang',
    ]);
  });
});
