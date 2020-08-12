import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { map, bimap, chain } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { sign } from 'jsonwebtoken';
import { extname } from 'path';
import { ado } from '../helpers/ado';
import { recordFromUnknown } from '../helpers/recordFromUnknown';
import { stringFromUnknown } from '../helpers/stringFromUnknown';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sanitizeFileNames = (input: string) => input.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');

const httpTrigger: AzureFunction = (context: Context, req: HttpRequest) => {
  pipe(
    req.body,
    recordFromUnknown('body'),
    chain(({ speaker, talk, name }) =>
      ado({
        speaker: pipe(speaker, stringFromUnknown('speaker'), map(sanitizeFileNames)),
        talk: pipe(talk, stringFromUnknown('talk'), map(sanitizeFileNames)),
        extension: pipe(name, stringFromUnknown('name'), map(extname)),
      }),
    ),
    map(({ speaker, talk, extension }) => speaker + '-' + talk + '-' + Date.now().toFixed(0) + extension),
    bimap(
      (err) => {
        context.res = {
          status: 400,
          body: JSON.stringify({
            error: err.message,
          }),
        };
      },
      (objectName) => {
        context.res = {
          body: JSON.stringify({
            object: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${objectName}`,
            token: sign(
              {
                iss: jwtAudience,
                aud: jwtAudience,
                sub: `${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`,
              },
              jwtPrivateKey,
              { expiresIn: '24h', algorithm: 'HS256' },
            ),
          }),
        };
      },
    ),
  );
};

export default httpTrigger;
