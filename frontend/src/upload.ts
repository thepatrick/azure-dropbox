import { AnonymousCredential, BlockBlobClient, newPipeline } from '@azure/storage-blob';
import { SASStore } from './sas/SASStore';
import { SASUpdatePolicyFactory } from './sas/SASUpdatePolicyFactory';
import { ProgressBar } from './ProgressBar';
import { SetHidden } from './setHidden';
import { ShowAlert } from './createShowAlert';

type UploadBlobDetails = { object: string; token: string };

const getUploadBlobDetails = async (
  roomName: string,
  speakerName: string,
  talkTitle: string,
  fileName: string,
): Promise<UploadBlobDetails> => {
  const response = await fetch(`${process.env.UPLOAD_API_SERVER}/begin`, {
    method: 'POST',
    body: JSON.stringify({
      room: roomName,
      speaker: speakerName,
      talk: talkTitle,
      name: fileName,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<UploadBlobDetails>;
};

type GetDownloadLink = () => Promise<string>;

const getDownloadURL = (sasStore: SASStore, object: string): GetDownloadLink => async () => {
  return `${object}${await sasStore.getValidSASForBlob(object)}`;
};

const upload = async (
  roomName: string,
  speakerName: string,
  talkTitle: string,
  file: File,
  onProgress: (loadedBytes: number) => void,
): Promise<GetDownloadLink> => {
  const { object, token } = await getUploadBlobDetails(roomName, speakerName, talkTitle, file.name);

  const sasStore = new SASStore(token);

  const pipeline = newPipeline(new AnonymousCredential());
  // Inject SAS update policy factory into current pipeline
  pipeline.factories.unshift(new SASUpdatePolicyFactory(sasStore));

  const blockBlobClient = new BlockBlobClient(
    `${object}${await sasStore.getValidSASForBlob(object)}`, // A SAS should start with "?"
    pipeline,
  );

  await blockBlobClient.uploadBrowserData(file, {
    maxSingleShotSize: 4 * 1024 * 1024,
    onProgress: ({ loadedBytes }) => onProgress(loadedBytes),
  });

  return getDownloadURL(sasStore, object);
};

export const createUploadFiles = (
  progressBar: ProgressBar,
  setFormBeingProcessed: SetHidden,
  showAlert: ShowAlert,
  setSpinnerHidden: SetHidden,
) => async (file: File, roomName: string, speakerName: string, talkTitle: string): Promise<void> => {
  try {
    setSpinnerHidden(false);
    progressBar.setHidden(false);
    const getDownloadLink = await upload(roomName, speakerName, talkTitle, file, (loadedBytes) => {
      progressBar.setProgress((loadedBytes / file.size) * 100);
    });
    setSpinnerHidden(true);
    progressBar.setHidden(true);

    showAlert('Upload finished succesfully', 'success');
  } catch (error) {
    showAlert((error as Error).message, 'danger');
    setFormBeingProcessed(false);
    setSpinnerHidden(true);
    progressBar.setHidden(true);
  }
};
