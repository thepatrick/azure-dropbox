export type ShowAlert = (message: string, level: 'danger' | 'success') => void;

export const createShowAlert = (within: HTMLElement): ShowAlert => (message, level) => {
  const base = document.createElement('div');

  base.classList.add('alert', `alert-${level}`);
  base.setAttribute('role', 'alert');

  const text = document.createTextNode(message);
  base.appendChild(text);

  within.append(base);
};
