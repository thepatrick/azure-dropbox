import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { chain, Either, fold, left, right, toError, tryCatch } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { ado } from '../helpers/ado';
import { BlobBody, blobFromBody } from './blobFromBody';
import { jwtFromHeader } from './jwtFromHeader';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT_NAME,
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY,
);

const isCorrectContainer = (expectedContainer: string) => ({ containerFromBlob, objectName }: BlobBody) => {
  if (containerFromBlob !== expectedContainer) {
    return left(new Error(`Unexpected container ${containerFromBlob}`));
  }

  return right(objectName);
};

const generateSAS = (containerName: string, sharedKeyCredential: StorageSharedKeyCredential) => (blobName: string) =>
  tryCatch(
    () =>
      generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse('cw'), // r(ead), a(dd) c(reate) w(rite) d(elete) x(deleteVersion) t(ag)
          expiresOn: new Date(Date.now() + 60 * 5 * 1000),
        },
        sharedKeyCredential,
      ).toString(),
    toError,
  );

const httpTrigger: AzureFunction = (context: Context, req: HttpRequest) => {
  context.res = pipe(
    ado({
      user: pipe(req, jwtFromHeader(jwtPrivateKey, 'authorization', jwtAudience)),
      objectName: pipe(blobFromBody(req), chain(isCorrectContainer(containerName))),
    }),
    chain(
      ({ user: { sub }, objectName }): Either<Error, string> => {
        if (sub !== `${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`) {
          return left(new Error(`Unexpected ${sub}`));
        }

        return right(objectName);
      },
    ),
    chain(generateSAS(containerName, sharedKeyCredential)),
    fold(
      (err) => {
        context.log(`Error when validating request: ${err.message}`);

        return {
          status: 403,
          body: 'Access Denied',
        };
      },
      (sas) => ({
        body: JSON.stringify({ sas }),
      }),
    ),
  );
};

export default httpTrigger;
