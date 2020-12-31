import { ProgressBar } from './ProgressBar';
import { SetHidden } from './setHidden';
import { ShowAlert } from './createShowAlert';
import { upload } from './uploader/upload';

export const createUploadFile = (
  progressBar: ProgressBar,
  setFormBeingProcessed: SetHidden,
  showAlert: ShowAlert,
  setSpinnerHidden: SetHidden,
  token: string,
) => async (file: File, presentationTitle: string): Promise<void> => {
  try {
    setSpinnerHidden(false);
    progressBar.setHidden(false);

    await upload(token, file, presentationTitle, (loadedBytes) => {
      console.log('Updating progress...', loadedBytes, file.size, (loadedBytes / file.size) * 100);
      progressBar.setProgress((loadedBytes / file.size) * 100);
    });
    setSpinnerHidden(true);
    progressBar.setHidden(true);

    showAlert('Upload finished succesfully', 'success');
  } catch (error) {
    console.error('Error', error);
    showAlert((error as Error).message, 'danger');
    setFormBeingProcessed(false);
    setSpinnerHidden(true);
    progressBar.setHidden(true);
  }
};
