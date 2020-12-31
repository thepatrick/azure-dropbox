interface Part {
  ETag: string;
  PartNumber: number;
}

/** @see {isBeginBody} ts-auto-guard:type-guard */
export interface BeginBody {
  presentationTitle: string;
  fileName: string;
}

/** @see {isSignBody} ts-auto-guard:type-guard */
export interface SignBody {
  parts: number;
}

/** @see {isFinishBody} ts-auto-guard:type-guard */
export interface FinishBody {
  parts: Part[];
}

/** @see {isVeypearResponse} ts-auto-guard:type-guard */
export interface VeypearResponse {
  name: string;
}

/** @see {isDecodedBeginJWT} ts-auto-guard:type-guard */
export interface DecodedBeginJWT {
  iss: string;
  aud: string;
  sub: string;
  name: string;
}

/** @see {isDecodedUploadJWT} ts-auto-guard:type-guard */
export interface DecodedUploadJWT {
  iss: string;
  aud: string;
  sub: string;
  objectName: string;
}
