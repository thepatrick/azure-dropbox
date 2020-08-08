# azure-dropbox backend

A very simple, and not particularly pretty, backend to support uploading files to Azure Blob Storage.

**Note** files do not pass through these functions - the frontend uploads directly to Azure. The backend simply determines a filename the frontend is allowed to upload, and provides SAS credentials that the frontend uses to authenticate to Azure.

**Warning** Nothing about this should be considred best practice - the author had not used Azure Storage or Azure Functions before writing this code. They're actually kinda suprised it works at all.

## Azure Pre-requisites

You will need

1. An Azure Storage Account

2. A Container within the Azure Storage Account (the author picked `uploads`, which was not particularly creative)

3. A storage access key for the Azure Storage Account.

## Testing locally

1. Start by reading up on Azure Functions & Visual Studio Code.

2. Copy `local.settings.json.example` to `local.settings.json` and update the values for each entry in `Values` (except for `AzureWebJobsStorage` which should be left blank, and `FUNCTIONS_WORKER_RUNTIME` which should remain at `node`)

## Deploy

From scatch? 🤷🏻

Start by creating an Azure App Service (target Linux, node.js 12), and then open this folder in VS Code, installing the "Azure Functions" extension if required. From there you can `Deploy to Function App` to update - the first time you'll be prompted to authenticate, and then choose your application to deploy to.

## TODO

Link to Azure Functions info, especially getting started stuff.

Deployment instructions.
