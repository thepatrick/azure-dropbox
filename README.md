# azure-dropbox

A very simple, and not particularly pretty, web app for uploading files to Azure Blob Storage.

Features:

* Serverless API thing (see `backend/`) that vends credentials that allow uploading a single file to Azure Storage (see here, especially if you want to add authentication on who can upload)

* A single page app (see `frontend/`) that obtains credentials from the API and uploads files directly to Azure Storage.
