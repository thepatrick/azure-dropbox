export type UploadIdResponse = { uploadId: string };

export type GetPartSignedURLsResponse = { signedURLs: string[] };

export interface Part {
  ETag: string;
  PartNumber: number;
}

export interface PartProgress {
  uploadedBytes: number;
  ofBytes: number;
  state: 'pending' | 'started' | 'done';
}
