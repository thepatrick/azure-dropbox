import { tryCatch, toError, Either } from 'fp-ts/lib/Either';

export const parseURL = (possibleURL: string): Either<Error, URL> => tryCatch(() => new URL(possibleURL), toError);
