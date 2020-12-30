import { Part } from './types';

export type UploadIdResponse = { uploadId: string };

export type GetPartSignedURLsResponse = { signedURLs: string[] };

export interface Part {
  ETag: string;
  PartNumber: number;
}

export const apiCall = async <T>(remoteURL: string, body: unknown): Promise<T> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}${remoteURL}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<T>;
};

export const getUploadId = async (
  roomName: string,
  speakerName: string,
  talkTitle: string,
  fileName: string,
): Promise<UploadIdResponse> =>
  apiCall('/sign', {
    room: roomName,
    speaker: speakerName,
    talk: talkTitle,
    name: fileName,
  });

export const getPartSignedURLs = (uploadId: string, parts: number): Promise<GetPartSignedURLsResponse> =>
  apiCall('/sign', { uploadId, parts });

export const abandonUpload = async (uploadId: string): Promise<{ ok: boolean }> => apiCall('/abandon', { uploadId });

export const completeUpload = async (uploadId: string, parts: Part[]): Promise<{ ok: boolean }> =>
  apiCall('/finish', { uploadId, parts });
