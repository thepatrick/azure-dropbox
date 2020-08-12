import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';

const isString = (input: unknown): input is string => typeof input == 'string';

export const stringFromUnknown = (prop: string) => (input: unknown): E.Either<Error, string> =>
  pipe(
    O.fromNullable(input),
    E.fromOption(() => new Error(`${prop}: not set`)),
    E.chain((value) => {
      if (isString(value)) {
        return E.right(value);
      } else {
        return E.left(new Error(`${prop} is not a string`));
      }
    }),
  );
