import '@fortawesome/fontawesome-free/css/all.css';
// main.js
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css'; // Import precompiled Bootstrap css
import { createShowAlert } from './createShowAlert';
import './css/frontend.css';
import { createProgressBar } from './ProgressBar';
import { setHidden, SetHidden } from './setHidden';
import { createUploadFiles } from './upload';

document.addEventListener('DOMContentLoaded', () => {
  const speakerName = <HTMLInputElement>document.getElementById('speaker-name');
  const talkTitle = <HTMLInputElement>document.getElementById('talk-title');
  const fileInput = <HTMLInputElement>document.getElementById('file-input');
  const formEl = <HTMLFormElement>document.getElementById('upload-form');

  const progressBar = createProgressBar(document.getElementById('upload-progress'));
  const showAlert = createShowAlert(formEl);

  const setSpinnerHidden = setHidden(document.getElementById('upload-spinner'));

  const setSpeakerHidden = setHidden(speakerName.parentElement);
  const setTalkHidden = setHidden(talkTitle.parentElement);
  const setFileHidden = setHidden(fileInput.parentElement);
  const setSubmitHidden = setHidden(<HTMLInputElement>document.getElementById('submit-button'));
  const setFormBeingProcessed: SetHidden = (hidden: boolean) => {
    [setSpeakerHidden, setTalkHidden, setFileHidden, setSubmitHidden].forEach((setElHidden) => setElHidden(hidden));
  };

  const uploadFiles = createUploadFiles(progressBar, setFormBeingProcessed, showAlert, setSpinnerHidden);

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

    const speakerNameTrimmed = speakerName.value.trim();
    const talkTitleTrimmed = talkTitle.value.trim();
    const file = fileInput.files[0];

    await uploadFiles(file, speakerNameTrimmed, talkTitleTrimmed);
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
});
