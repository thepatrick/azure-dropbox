import { setHidden } from './setHidden';

export type ProgressBar = {
  setProgress: (value: number) => void;
  setHidden: (hidden: boolean) => void;
};

export const createProgressBar = (el: HTMLElement): ProgressBar => ({
  setProgress: (value) => {
    el.style.width = `${value.toFixed(0)}%`;
    el.setAttribute('aria-valuenow', value.toFixed(0));
  },
  setHidden: setHidden(el.parentElement),
});
