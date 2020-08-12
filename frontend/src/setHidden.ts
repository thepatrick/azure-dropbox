export type SetHidden = (hidden: boolean) => void;

export const setHidden = (el: HTMLElement): SetHidden => (hidden) => {
  if (hidden) {
    el.classList.add('d-none');
  } else {
    el.classList.remove('d-none');
  }
};
