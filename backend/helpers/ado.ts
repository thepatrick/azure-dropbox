import { sequenceS } from 'fp-ts/lib/Apply';
import { either } from 'fp-ts/lib/Either';

export const ado = sequenceS(either);
