import { GetPartSignedURLsResponse } from './types';

export const abandonUpload = async (uploadId: string): Promise<GetPartSignedURLsResponse> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}/abandon`, {
    method: 'POST',
    body: JSON.stringify({ uploadId }),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<GetPartSignedURLsResponse>;
};
