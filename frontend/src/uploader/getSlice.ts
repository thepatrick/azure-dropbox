export const getSlice = (file: File, start: number, end: number): Blob => {
  let blob: Blob;

  if (end > file.size) {
    blob = file.slice(start);
  } else {
    blob = file.slice(start, end);
  }

  return blob;
};
