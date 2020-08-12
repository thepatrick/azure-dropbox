import { HttpRequest } from '@azure/functions';
import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { recordFromUnknown } from '../helpers/recordFromUnknown';
import { stringFromUnknown } from '../helpers/stringFromUnknown';
import { parseURL } from '../helpers/parseURL';

export type BlobBody = {
  containerFromBlob: string;
  objectName: string;
};

export const blobFromBody = (req: HttpRequest): E.Either<Error, BlobBody> =>
  pipe(
    req.body,
    recordFromUnknown('body'),
    E.chain(({ blob }) => stringFromUnknown('blob')(blob)),
    E.chain(parseURL),
    E.map((blob) => {
      const path = blob.pathname.substring(1);
      const containerFromBlob = path.substring(0, path.indexOf('/'));
      const objectName = path.substring(containerFromBlob.length + 1);

      return { containerFromBlob, objectName };
    }),
  );
