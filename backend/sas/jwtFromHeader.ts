import { HttpRequest } from '@azure/functions';
import { tryCatch, left, Either, map, chain, toError } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/function';
import { verify } from 'jsonwebtoken';
import { ado } from '../helpers/ado';
import { recordFromUnknown } from '../helpers/recordFromUnknown';
import { stringFromUnknown } from '../helpers/stringFromUnknown';

const extractBearer = (token: string) => token.substring('Bearer '.length);

const verifyJWT = (privateKey: string) => (token: string) =>
  tryCatch(() => verify(token, privateKey, { algorithms: ['HS512'] }), toError);

const isValue = (expected: string, prop: string) => (actual: string): Either<Error, string> => {
  if (actual !== expected) {
    return left(new Error(`Unexpected ${prop}: ${actual}`));
  }
};

export type DecodedJWT = {
  iss: string;
  sub: string;
  aud: string;
};

export const jwtFromHeader = (privateKey: string, headerName: string, audience: string) => (
  req: HttpRequest,
): Either<Error, DecodedJWT> =>
  pipe(
    req[headerName],
    stringFromUnknown(headerName),
    map(extractBearer),
    chain(verifyJWT(privateKey)),
    chain(recordFromUnknown(headerName)),
    chain(({ iss, aud, sub }) =>
      ado({
        iss: pipe(iss, stringFromUnknown('iss'), chain(isValue(audience, 'iss'))),
        aud: pipe(aud, stringFromUnknown('aud'), chain(isValue(audience, 'aud'))),
        sub: pipe(sub, stringFromUnknown('sub')),
      }),
    ),
  );
