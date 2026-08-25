import { PrismaPg } from '@prisma/adapter-pg';
import {
  JobRegion,
  PrismaClient,
  SourceType,
} from '../generated/prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const remoteOk = await prisma.jobSource.findUnique({
    where: { name: 'remoteok' },
    include: { _count: { select: { jobs: true } } },
  });

  if (remoteOk?._count.jobs === 0) {
    await prisma.jobSource.delete({ where: { id: remoteOk.id } });
  } else if (remoteOk) {
    console.warn(
      `RemoteOK was not deleted because ${remoteOk._count.jobs} jobs still reference it. Clear those jobs, then run the seed again.`,
    );
  }

  const sources = [
    {
      name: 'remotive',
      type: SourceType.API,
      region: JobRegion.INTERNATIONAL,
      url: 'https://remotive.com/api/remote-jobs',
    },
    {
      name: 'jobberman',
      type: SourceType.SCRAPE,
      region: JobRegion.LOCAL,
      url: 'https://www.jobberman.com/jobs/software-data',
    },
    {
      name: 'myjobmag',
      type: SourceType.SCRAPE,
      region: JobRegion.LOCAL,
      url: 'https://www.myjobmag.com/jobs-by-field/information-technology',
    },
  ];

  for (const source of sources) {
    await prisma.jobSource.upsert({
      where: { name: source.name },
      update: {
        type: source.type,
        region: source.region,
        config: { url: source.url },
      },
      create: {
        name: source.name,
        type: source.type,
        region: source.region,
        config: { url: source.url },
      },
    });
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
