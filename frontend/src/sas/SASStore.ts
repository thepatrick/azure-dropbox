export class SASStore {
  private sasCache = new Map<string, string>();

  constructor(private readonly token: string) {}

  // Get a valid SAS for blob
  async getValidSASForBlob(blobURL: string): Promise<string> {
    const existingSAS = this.sasCache.get(blobURL);
    if (existingSAS && this.isSasStillValidInNext2Mins(existingSAS)) {
      return existingSAS;
    } else {
      const newSAS = await this.getNewSasForBlob(blobURL);
      this.sasCache.set(blobURL, newSAS);
      return newSAS;
    }
  }

  // Return true if "se" section in SAS is still valid in next 2 mins
  isSasStillValidInNext2Mins(sas: string): boolean {
    const expiryStringInSas = new URL(`http://hostname${sas}`).searchParams.get('se');
    return new Date(expiryStringInSas).getTime() - Date.now() >= 2 * 60 * 1000;
  }

  // Get a new SAS for blob, we assume a SAS starts with a "?"

  async getNewSasForBlob(blobURL: string): Promise<string> {
    console.log('getNewSasForBlob blobURL', blobURL);

    const response = await fetch(`${process.env.UPLOAD_API_SERVER}/sas`, {
      method: 'POST',
      body: JSON.stringify({
        blob: blobURL,
      }),
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
    });

    const { sas } = (await response.json()) as { sas: string };

    console.log('getNewSasForBlob sas', sas);

    return `?${sas}`;
  }
}
