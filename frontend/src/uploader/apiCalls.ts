export type UploadIdResponse = { token: string };

export type GetPartSignedURLsResponse = { signedURLs: string[] };

export interface Part {
  ETag: string;
  PartNumber: number;
}

export const apiCall = async <T>(remoteURL: string, body: unknown, token?: string): Promise<T> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}${remoteURL}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + token,
    },
  });

  return response.json() as Promise<T>;
};

export const getUploadId = async (
  token: string,
  fileName: string,
  presentationTitle: string,
): Promise<UploadIdResponse> => apiCall('/begin', { fileName, presentationTitle }, token);

export const getPartSignedURLs = (token: string, parts: number): Promise<GetPartSignedURLsResponse> =>
  apiCall('/sign', { parts }, token);

export const abandonUpload = async (token: string): Promise<{ ok: boolean }> => apiCall('/abandon', {}, token);

export const completeUpload = async (token: string, parts: Part[]): Promise<{ ok: boolean }> =>
  apiCall('/finish', { parts }, token);

export interface PortalDetails {
  ok: boolean;
  name: string;
  token: string;
}

export const getPortalDetails = async (presenterId: string): Promise<PortalDetails> =>
  apiCall(`/portal/${encodeURIComponent(presenterId)}`, {});
