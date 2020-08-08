import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { sign } from 'jsonwebtoken';
import { extname } from 'path';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sanitizeFileNames = (input: string) => input.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const version = Date.now();

  const objectName = sanitizeFileNames(req.body.speaker) + '-' + sanitizeFileNames(req.body.talk) + '-' + version + extname(req.body.name);

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
