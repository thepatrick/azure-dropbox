# azure-dropbox frontend

A very simple, and not particularly pretty, front end for uploading files to Azure Blob Storage.

## Getting started

1. You'll need the functions from `../backend` deployed on Azure or running locally

2. Create a `.env` in this directory with `UPLOAD_API_SERVER=https://YOUR_APP_NAME.azurewebsites.net/api` for Azure, or `UPLOAD_API_SERVER=http://localhost:7071/api`

3. `npm install && npm start` will run a dev version, you should then be able to open http://localhost:1234 in your browser.

## Build a release version

1. `npm install && rm -r dist && npm run build`

2. The output is in `dist/`
