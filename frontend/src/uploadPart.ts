import axios from 'axios';
import { Part } from './types';

export const uploadPart = async (
  blob: Blob,
  partNumber: number,
  uploadUrl: string,
  onProgress: (loadedBytes: number, ofBytes: number) => void,
): Promise<Part> => {
  console.log('Part', partNumber, 'Starting....');

  const output = await axios.put(uploadUrl, blob, {
    onUploadProgress: (loadedBytes: ProgressEvent) => onProgress(loadedBytes.loaded, loadedBytes.total),
  });

  const etag = (output.headers as { etag: string }).etag;

  console.log('Part', partNumber, 'Done.');

  return { ETag: etag, PartNumber: partNumber + 1 };
};
