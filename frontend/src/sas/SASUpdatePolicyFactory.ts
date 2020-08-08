import { SASStore } from "./SASStore";
import { SASUpdatePolicy } from "./SASUpdatePolicy";

export class SASUpdatePolicyFactory {
  constructor(private readonly sasStore: SASStore) { }

  create(nextPolicy, options) {
    return new SASUpdatePolicy(nextPolicy, options, this.sasStore);
  }
}
