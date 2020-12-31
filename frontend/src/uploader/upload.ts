import { uploadPart } from './uploadPart';
import { getSlice } from './getSlice';

export interface PartProgress {
  uploadedBytes: number;
}

import pLimit from 'p-limit';
import { abandonUpload, completeUpload, getPartSignedURLs, getUploadId } from './apiCalls';

const FILE_CHUNK_SIZE = 10_000_000;

const calculateProgress = (allParts: { uploadedBytes: number }[]): number =>
  allParts.reduce((prev, curr) => prev + curr.uploadedBytes, 0);

export const upload = async (
  token: string,
  file: File,
  presentationTitle: string,
  onProgress: (loadedBytes: number) => void,
): Promise<void> => {
  const partCounts = Math.ceil(file.size / FILE_CHUNK_SIZE);

  const { token: uploadToken } = await getUploadId(token, file.name, presentationTitle);
  const { signedURLs } = await getPartSignedURLs(uploadToken, partCounts);

  const promises = [];
  const partProgress: PartProgress[] = [];

  const limit = pLimit(4);

  for (let i = 0; i < partCounts; i++) {
    const part = i;

    partProgress[part] = { uploadedBytes: 0 };

    promises.push(
      limit(() => {
        const slice = getSlice(file, i * FILE_CHUNK_SIZE, (part + 1) * FILE_CHUNK_SIZE);

        console.log('Starting slice', part, slice.size, slice);

        return uploadPart(slice, part, signedURLs[i], (loadedBytes) => {
          partProgress[part].uploadedBytes = loadedBytes;

          const totalProgress = calculateProgress(partProgress);

          onProgress(totalProgress);
        });
      }),
    );
  }

  try {
    const completedParts = await Promise.all(promises);
    console.log('completedParts', completedParts);
    await completeUpload(uploadToken, completedParts);
  } catch (err) {
    console.log('Abandoning because', err);
    await abandonUpload(uploadToken);
  }
};
