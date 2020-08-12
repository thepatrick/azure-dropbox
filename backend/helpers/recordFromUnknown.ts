import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';

const isRecord = (input: unknown): input is Record<string, unknown> => input != null && typeof input === 'object';

export const recordFromUnknown = (prop: string) => (input: unknown): E.Either<Error, Record<string, unknown>> =>
  pipe(
    O.fromNullable(input),
    E.fromOption(() => new Error(`${prop}: not set`)),
    E.chain((value) => {
      if (isRecord(value)) {
        return E.right(value);
      } else {
        return E.left(new Error(`${prop} is not an object`));
      }
    }),
  );
