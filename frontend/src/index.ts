// main.js

import '@fortawesome/fontawesome-free/css/all.css';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css'; // Import precompiled Bootstrap css
import './css/frontend.css';

import { createShowAlert } from './createShowAlert';
import { createProgressBar } from './ProgressBar';
import { setHidden, SetHidden } from './setHidden';
import { createUploadFile } from './createUploadFile';
import { getPortalDetails } from './uploader/apiCalls';

const setup = async () => {
  const presenterInput = <HTMLInputElement>document.getElementById('presenter-name');
  const presentationTitle = <HTMLInputElement>document.getElementById('presentation-title');

  const fileInput = <HTMLInputElement>document.getElementById('file-input');
  const formEl = <HTMLFormElement>document.getElementById('upload-form');

  const progressBar = createProgressBar(document.getElementById('upload-progress'));
  const showAlert = createShowAlert(formEl);

  const setSpinnerHidden = setHidden(document.getElementById('upload-spinner'));

  const setPresenterNameHidden = setHidden(presenterInput.parentElement);
  const setPresentationTitleHidden = setHidden(presentationTitle.parentElement);

  const setFileHidden = setHidden(fileInput.parentElement);
  const setSubmitHidden = setHidden(<HTMLInputElement>document.getElementById('submit-button'));
  const setFormBeingProcessed: SetHidden = (hidden: boolean) => {
    [setPresenterNameHidden, setPresentationTitleHidden, setFileHidden, setSubmitHidden].forEach((setElHidden) =>
      setElHidden(hidden),
    );
  };

  setFormBeingProcessed(true);
  setSpinnerHidden(false);

  try {
    const presenter = new URLSearchParams(window.location.search).get('presenter');
    const portalDetails = await getPortalDetails(presenter);
    presenterInput.value = portalDetails.name;

    const uploadFiles = createUploadFile(
      progressBar,
      setFormBeingProcessed,
      showAlert,
      setSpinnerHidden,
      portalDetails.token,
    );

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileInput.parentElement.querySelector('label').textContent = fileInput.files[0].name;
      }
    });

    const submitForm = async (): Promise<void> => {
      if (formEl.checkValidity() === false) {
        formEl.classList.add('was-validated');
        return;
      }

      setFormBeingProcessed(true);

      const file = fileInput.files[0];

      await uploadFiles(file, presentationTitle.value);
    };

    formEl.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        void submitForm();
      },
      false,
    );

    setFormBeingProcessed(false);
    setSpinnerHidden(true);
  } catch (error) {
    showAlert((error as Error).message, 'danger');
    setSpinnerHidden(true);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  void setup();
});
