import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";
import { verify } from 'jsonwebtoken';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.AZURE_STORAGE_ACCOUNT_NAME,
  process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY
);

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

  const token = (req.headers['authorization'] || '').substring('Bearer '.length);

  let decodedToken;
  try {
    decodedToken = verify(token, jwtPrivateKey);
  } catch (err) {
    context.log(`Error decoding JWT: ${err} for ${token}`);
    context.res = {
      status: 403,
      body: 'Access Denied',
    };
    return;
  }

  if (decodedToken.iss !== jwtAudience ||
      decodedToken.aud !== jwtAudience) {
    context.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
    context.res = {
      status: 403,
      body: 'Access Denied',
    };
    return;
  }

  const blob = new URL(req.body.blob);

  const path = blob.pathname.substring(1);
  const containerFromBlob = path.substring(0, path.indexOf('/'));
  const objectName = path.substring(containerFromBlob.length + 1);

  if (containerFromBlob !== containerName) {
    context.log(`Unexpected container ${containerFromBlob}`);
    context.res = {
      status: 403,
      body: 'Access Denied',
    };
    return;
  }

  if (decodedToken.sub !== `${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`) {
    context.log(`Unexpected ${decodedToken.sub}, should be ${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`);
    context.res = {
      status: 403,
      body: 'Access Denied',
    };
    return;
  }

  context.res = {
    body: JSON.stringify({
      sas: generateBlobSASQueryParameters({
        containerName,
        blobName: objectName,
        permissions: BlobSASPermissions.parse('cw'), // r(ead), a(dd) c(reate) w(rite) d(elete) x(deleteVersion) t(ag)
        expiresOn: new Date(Date.now() + (60 * 5 * 1000)),
        startsOn: new Date(Date.now() - (60 * 5 * 1000)),
      }, sharedKeyCredential).toString()
    })
  }
};

export default httpTrigger;
