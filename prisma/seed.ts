import { PrismaPg } from '@prisma/adapter-pg';
import { JobRegion, PrismaClient, SourceType } from '../generated/prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.jobSource.upsert({
    where: { name: 'remoteok' },
    update: {},
    create: {
      name: 'remoteok',
      type: SourceType.API,
      region: JobRegion.INTERNATIONAL,
      config: {
        url: 'https://remoteok.com/api',
      },
    },
  });

  // TODO: Add Nigerian sources here in v1.x
  // await prisma.jobSource.upsert({
  //   where: { name: 'nigerian_jobs_example' },
  //   update: {},
  //   create: {
  //     name: 'nigerian_jobs_example',
  //     type: SourceType.SCRAPE,
  //     region: JobRegion.LOCAL,
  //     config: { url: 'https://example.com/jobs' },
  //   },
  // });
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
