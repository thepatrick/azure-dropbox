import { SASStore } from './SASStore';
import { SASUpdatePolicy } from './SASUpdatePolicy';
import { RequestPolicy, RequestPolicyOptions } from '@azure/storage-blob';

export class SASUpdatePolicyFactory {
  constructor(private readonly sasStore: SASStore) {}

  create(nextPolicy: RequestPolicy, options: RequestPolicyOptions): SASUpdatePolicy {
    return new SASUpdatePolicy(nextPolicy, options, this.sasStore);
  }
}
