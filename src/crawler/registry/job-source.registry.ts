import { Injectable } from '@nestjs/common';
import { JobSourceAdapter } from '../interfaces/job-source.adapter';
import { RemoteOkAdapter } from '../adapters/remoteok.adapter';

@Injectable()
export class JobSourceRegistry {
  private readonly adapters = new Map<string, JobSourceAdapter>();

  constructor(private readonly remoteOk: RemoteOkAdapter) {
    this.adapters.set('remoteok', this.remoteOk);
    // set future adapters here
  }

  getAdapter(name: string): JobSourceAdapter | undefined {
    return this.adapters.get(name.toLowerCase());
  }
}
