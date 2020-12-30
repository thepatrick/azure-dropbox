import { UploadIdResponse } from './types';

export const getUploadId = async (
  roomName: string,
  speakerName: string,
  talkTitle: string,
  fileName: string,
): Promise<UploadIdResponse> => {
  const response = await fetch(`${process.env.AWS_UPLOAD_API_SERVER}/begin`, {
    method: 'POST',
    body: JSON.stringify({
      room: roomName,
      speaker: speakerName,
      talk: talkTitle,
      name: fileName,
    }),
    headers: {
      'content-type': 'application/json',
    },
  });

  return response.json() as Promise<UploadIdResponse>;
};
