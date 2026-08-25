import { Injectable } from '@nestjs/common';
import { JobSourceAdapter } from '../interfaces/job-source.adapter';
import { RemotiveAdapter } from '../adapters/remotive.adapter';
import { JobbermanAdapter } from '../adapters/jobberman.adapter';
import { MyJobMagAdapter } from '../adapters/myjobmag.adapter';

@Injectable()
export class JobSourceRegistry {
  private readonly adapters = new Map<string, JobSourceAdapter>();

  constructor(
    remotive: RemotiveAdapter,
    jobberman: JobbermanAdapter,
    myJobMag: MyJobMagAdapter,
  ) {
    this.adapters.set('remotive', remotive);
    this.adapters.set('jobberman', jobberman);
    this.adapters.set('myjobmag', myJobMag);
  }

  getAdapter(name: string): JobSourceAdapter | undefined {
    return this.adapters.get(name.toLowerCase());
  }

  hasAdapter(name: string): boolean {
    return this.adapters.has(name.toLowerCase());
  }
}
