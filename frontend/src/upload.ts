import { AnonymousCredential, BlockBlobClient, newPipeline } from "@azure/storage-blob";
import { SASStore } from "./sas/SASStore";
import { SASUpdatePolicyFactory } from "./sas/SASUpdatePolicyFactory";

const getUploadBlobDetails = async (speakerName: string, talkTitle: string, fileName: string) => {
  const response = await fetch(`${process.env.UPLOAD_API_SERVER}/begin`, {
    method: 'POST',
    body: JSON.stringify({
      speaker: speakerName,
      talk: talkTitle,
      name: fileName,
    }),
    headers: {
      'content-type': 'application/json'
    }
  });

  return response.json();
};

export const upload = async (speakerName: string, talkTitle: string, file: File, onProgress: (loadedBytes: number) => void): Promise<void> => {
  const { object, token } = await getUploadBlobDetails(speakerName, talkTitle, file.name);

  const sasStore = new SASStore(token);

  const pipeline = newPipeline(new AnonymousCredential());
  // Inject SAS update policy factory into current pipeline
  pipeline.factories.unshift(new SASUpdatePolicyFactory(sasStore));

  const blockBlobClient = new BlockBlobClient(
    `${object}${await sasStore.getValidSASForBlob(object)}`, // A SAS should start with "?"
    pipeline
  );

  await blockBlobClient.uploadBrowserData(file, {
    maxSingleShotSize: 4 * 1024 * 1024,
    onProgress: ({ loadedBytes }) => onProgress(loadedBytes),
  });
}
