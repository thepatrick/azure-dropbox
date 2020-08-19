import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { sign } from 'jsonwebtoken';
import { extname } from 'path';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sanitizeFileNames = (input: string) => input.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const version = Date.now();

  const room = sanitizeFileNames(req.body.room);
  const speaker = sanitizeFileNames(req.body.speaker);
  const talk = sanitizeFileNames(req.body.talk);

  if (room.length === 0 || speaker.length === 0 || talk.length === 0 || req.body.name.length === 0) {
    context.res = {
      status: 403,
      body: 'Access Denied'
    }
    return;
  }

  const objectName = `${room}-${speaker}-${talk}-${version}${extname(req.body.name)}`;

  context.res = {
    body: JSON.stringify({
      object: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${objectName}`,
      token: sign(
        {
          iss: jwtAudience,
          aud: jwtAudience,
          sub: `${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`
        },
        jwtPrivateKey,
        {
          expiresIn: '24h'
        }
      )
    })
  };

};

export default httpTrigger;
