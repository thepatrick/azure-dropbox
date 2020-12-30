import { getUploadId } from './getUploadId';
import { getPartSignedURLs } from './getPartSignedURLs';
import { abandonUpload } from './abandonUpload';
import { completeUpload } from './completeUpload';
import { uploadPart } from './uploadPart';
import { getSlice } from './getSlice';
import { PartProgress } from './types';

import pLimit from 'p-limit';

const FILE_CHUNK_SIZE = 10_000_000;

const calculateProgress = (allParts: { uploadedBytes: number }[]): number =>
  allParts.reduce((prev, curr) => prev + curr.uploadedBytes, 0);

export const upload = async (
  roomName: string,
  speakerName: string,
  talkTitle: string,
  file: File,
  onProgress: (loadedBytes: number) => void,
): Promise<void> => {
  const { uploadId } = await getUploadId(roomName, speakerName, talkTitle, file.name);

  const partCounts = Math.ceil(file.size / FILE_CHUNK_SIZE);

  const { signedURLs } = await getPartSignedURLs(uploadId, partCounts);
  console.log('signedURLs', signedURLs);

  const promises = [];
  const partProgress: PartProgress[] = [];

  const limit = pLimit(4);

  for (let i = 0; i < partCounts; i++) {
    const part = i;
    const slice = getSlice(file, i * FILE_CHUNK_SIZE, (part + 1) * FILE_CHUNK_SIZE);

    partProgress[part] = { uploadedBytes: 0, ofBytes: slice.size, state: 'pending' };

    console.log('Pushing slice', part, slice.size, slice);

    promises.push(
      limit(() =>
        uploadPart(slice, part, signedURLs[i], (loadedBytes) => {
          partProgress[part].uploadedBytes = loadedBytes;

          const totalProgress = calculateProgress(partProgress);

          // console.log('Part', part, loadedBytes, JSON.stringify(partProgress), totalProgress);

          onProgress(totalProgress);
        }),
      ),
    );
  }

  try {
    const completedParts = await Promise.all(promises);
    console.log('completedParts', completedParts);
    await completeUpload(uploadId, completedParts);
  } catch (err) {
    console.log('Abandoning because', err);
    await abandonUpload(uploadId);
  }
};
