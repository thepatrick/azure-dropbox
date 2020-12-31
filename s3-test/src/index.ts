import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import { S3, Endpoint } from 'aws-sdk';
import {
  isBeginBody,
  isDecodedBeginJWT,
  isDecodedUploadJWT,
  isFinishBody,
  isSignBody,
  isVeypearResponse,
} from './FinishBody.guard';
import fetch from 'node-fetch';
import { sign, verify } from 'jsonwebtoken';
import { extname } from 'path';

const app = express();

const bucket = process.env.UPLOADER_BUCKET;
const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;

if (bucket === undefined) {
  throw new Error('UPLOADER_BUCKET not set');
}
if (jwtPrivateKey === undefined) {
  throw new Error('UPLOADER_JWT_PRIVATE_KEY not set');
}
if (jwtAudience === undefined) {
  throw new Error('UPLOADER_JWT_AUDIENCE not set');
}

const client = new S3({
  signatureVersion: 'v4',
  region: 'ap-southeast-2', // same as your bucket
  endpoint: new Endpoint(`${bucket}.s3-accelerate.amazonaws.com`),
  useAccelerateEndpoint: true,
});

app.use(cors());

app.use(express.json()); //Used to parse JSON bodies

const sanitizeFileNames = (input: string) =>
  input
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

type AsyncRequestHandler<Params, ResBody = unknown> = (
  req: ExpressRequest<Params, ResBody, unknown>,
) => Promise<ResBody>;

const asyncHandler = <Params = { [key: string]: string }, ResBody = unknown>(
  fn: AsyncRequestHandler<Params, ResBody>,
) => (req: ExpressRequest<Params, ResBody>, res: ExpressResponse, next: NextFunction) => {
  fn(req)
    .then((value) => res.json(value))
    .catch(next);
};

app.post(
  '/portal/:presenter',
  asyncHandler(async (req) => {
    const presenter = req.params.presenter;

    const request = await fetch(`https://portal2.nextdayvideo.com.au/virtual/presenter/${presenter}.json`);

    const data = (await request.json()) as unknown;

    if (!isVeypearResponse(data)) {
      throw new Error('Invalid input');
    }

    return {
      ok: true,
      name: data.name,
      token: sign(
        {
          iss: jwtAudience,
          aud: jwtAudience,
          sub: presenter,
          name: data.name,
        },
        jwtPrivateKey,
        {
          expiresIn: '24h',
        },
      ),
    };
  }),
);

app.post(
  '/begin',
  asyncHandler(async (req) => {
    const token = (req.headers['authorization'] || '').substring('Bearer '.length);
    let decodedToken;
    try {
      decodedToken = verify(token, jwtPrivateKey);
    } catch (err) {
      console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (!isDecodedBeginJWT(decodedToken)) {
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (decodedToken.iss !== jwtAudience || decodedToken.aud !== jwtAudience) {
      console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    const body = req.body;

    if (!isBeginBody(body, 'body')) {
      throw new Error('Invalid input');
    }

    const version = Date.now();
    const presenterName = sanitizeFileNames(decodedToken.name);
    const presentationTitle = sanitizeFileNames(body.presentationTitle);

    const objectName = `${presenterName}-${presentationTitle}-${version}${extname(body.fileName)}`;

    const { UploadId } = await client
      .createMultipartUpload({
        Bucket: bucket,
        Key: objectName,
      })
      .promise();

    return {
      token: sign(
        {
          iss: jwtAudience,
          aud: jwtAudience,
          sub: UploadId,
          objectName: objectName,
        },
        jwtPrivateKey,
        {
          expiresIn: '24h',
        },
      ),
    };
  }),
);

app.post(
  '/sign',
  asyncHandler(async (req) => {
    const token = (req.headers['authorization'] || '').substring('Bearer '.length);
    let decodedToken;
    try {
      decodedToken = verify(token, jwtPrivateKey);
    } catch (err) {
      console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (!isDecodedUploadJWT(decodedToken)) {
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (decodedToken.iss !== jwtAudience || decodedToken.aud !== jwtAudience) {
      console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    const uploadId = decodedToken.sub;

    const body = req.body;

    if (!isSignBody(body, 'body')) {
      throw new Error('Invalid input');
    }

    const { parts } = body;

    const promises = [];

    console.log('Parts:', parts);

    for (let i = 0; i < parts; i++) {
      promises.push(
        client.getSignedUrlPromise('uploadPart', {
          Bucket: bucket,
          Key: decodedToken.objectName,
          Expires: 30 * 60, // 30 minutes
          UploadId: uploadId,
          PartNumber: i + 1,
        }),
      );
    }

    const signedURLs = await Promise.all(promises);

    console.log('Signed URLs:', signedURLs);

    return { signedURLs };
  }),
);

app.post(
  '/finish',
  asyncHandler(async (req) => {
    const token = (req.headers['authorization'] || '').substring('Bearer '.length);
    let decodedToken;
    try {
      decodedToken = verify(token, jwtPrivateKey);
    } catch (err) {
      console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (!isDecodedUploadJWT(decodedToken)) {
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (decodedToken.iss !== jwtAudience || decodedToken.aud !== jwtAudience) {
      console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    const uploadId = decodedToken.sub;
    const objectName = decodedToken.objectName;

    const body = req.body;

    if (!isFinishBody(body, 'body')) {
      throw new Error('Invalid input');
    }

    const { parts } = body;

    await client
      .completeMultipartUpload({
        Bucket: bucket,
        Key: objectName,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
      .promise();

    return { ok: true };
  }),
);

app.post(
  '/abandon',
  asyncHandler(async (req) => {
    const token = (req.headers['authorization'] || '').substring('Bearer '.length);
    let decodedToken;
    try {
      decodedToken = verify(token, jwtPrivateKey);
    } catch (err) {
      console.log(`Error decoding JWT: ${(err as Error).message} for ${token}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (!isDecodedUploadJWT(decodedToken)) {
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    if (decodedToken.iss !== jwtAudience || decodedToken.aud !== jwtAudience) {
      console.log(`Unexpected iss ${decodedToken.iss} or aud ${decodedToken.aud}`);
      return {
        status: 403,
        body: 'Access Denied',
      };
    }

    const uploadId = decodedToken.sub;
    const objectName = decodedToken.objectName;

    await client
      .abortMultipartUpload({
        Bucket: bucket,
        Key: objectName,
        UploadId: uploadId,
      })
      .promise();

    return { ok: true };
  }),
);

app.listen(3000);
