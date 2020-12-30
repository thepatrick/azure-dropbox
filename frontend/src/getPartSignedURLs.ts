import { GetPartSignedURLsResponse } from './types';

export const getPartSignedURLs = async (uploadId: string, parts: number): Promise<GetPartSignedURLsResponse> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}/sign`, {
    method: 'POST',
    body: JSON.stringify({ uploadId, parts }),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<GetPartSignedURLsResponse>;
};
