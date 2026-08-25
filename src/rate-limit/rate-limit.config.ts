type LimitType = {
  limit: number;
  ttl: number;
};

interface Limit extends Record<string, any> {
  auth: LimitType;
  tailoring: LimitType;
  upload: LimitType;
  default: LimitType;
}

export const RATE_LIMITS: Limit = {
  default: { limit: 500, ttl: 60_000 },
  auth: { limit: 5, ttl: 900_000 }, // 5 per 15 min
  tailoring: { limit: 10, ttl: 3_600_000 }, // 10 per hour
  upload: { limit: 10, ttl: 3_600_000 }, // 10 per hour
};
