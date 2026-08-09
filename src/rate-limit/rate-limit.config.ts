type LimitType = {
  limit: number;
  ttl: number;
};

interface Limit extends Record<string, any> {
  auth: LimitType;
  tailoring: LimitType;
  upload: LimitType;
}

export const RATE_LIMITS: Limit = {
  auth: { limit: 5, ttl: 900_000 }, // 5 per 15 min
  tailoring: { limit: 10, ttl: 3_600_000 }, // 10 per hour
  upload: { limit: 10, ttl: 3_600_000 }, // 10 per hour
};
