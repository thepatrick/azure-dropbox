import { upload } from './upload';

const speakerName = <HTMLInputElement>document.getElementById('speaker-name');
const talkTitle = <HTMLInputElement>document.getElementById('talk-title');
const selectButton = <HTMLInputElement>document.getElementById("select-button");
const fileInput = <HTMLInputElement>document.getElementById("file-input");
const status = document.getElementById("status");

const reportStatus = message => {
  status.innerHTML += `${message}<br/>`;
  status.scrollTop = status.scrollHeight;
}

const uploadFiles = async () => {
  const file = fileInput.files[0];
  const speakerNameValue = speakerName.value.trim();
  const talkNameValue = talkTitle.value.trim();

  if (!file) {
    reportStatus('Please choose a file');
    return;
  }

  if(speakerNameValue.length === 0 || talkNameValue.length === 0) {
    reportStatus('Please fill in both Speaker Name and Talk Title');
    return;
  }


  try {
    reportStatus(`Uploading ${speakerNameValue} ${talkNameValue} ${file.name}...`);
    await upload(speakerNameValue, talkNameValue, file, loadedBytes => reportStatus(`Uploaded ${((loadedBytes / file.size) * 100).toFixed(0)}%`));
    reportStatus("Done.");

      fileInput.value = "";
      speakerName.value = "";
      talkTitle.value = "";
  } catch (error) {
    reportStatus(error.message);
  }
}

selectButton.addEventListener("click", uploadFiles);
