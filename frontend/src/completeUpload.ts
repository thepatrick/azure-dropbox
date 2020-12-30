import { GetPartSignedURLsResponse, Part } from './types';

export const completeUpload = async (uploadId: string, parts: Part[]): Promise<GetPartSignedURLsResponse> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}/finish`, {
    method: 'POST',
    body: JSON.stringify({ uploadId, parts }),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<GetPartSignedURLsResponse>;
};
