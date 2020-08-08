import {
  BaseRequestPolicy,

  RequestPolicy,
  RequestPolicyOptions,
  HttpOperationResponse
} from "@azure/storage-blob";
import { SASStore } from "./SASStore";

export class SASUpdatePolicy extends BaseRequestPolicy {
  constructor(nextPolicy: RequestPolicy, options: RequestPolicyOptions, private sasStore: SASStore) {
    super(nextPolicy, options);
  }

  async sendRequest(request): Promise<HttpOperationResponse> {
    const urlObj = new URL(request.url);
    const sas = await this.sasStore.getValidSASForBlob(`${urlObj.origin}${urlObj.pathname}`);
    new URL(`http://hostname${sas}`).searchParams.forEach((value, key) => {
      urlObj.searchParams.set(key, value);
    });

    // Update request URL with latest SAS
    request.url = urlObj.toString();

    return this._nextPolicy.sendRequest(request);
  }
}
