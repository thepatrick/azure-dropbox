import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { sign } from 'jsonwebtoken';
import { extname } from 'path';

const jwtPrivateKey = process.env.UPLOADER_JWT_PRIVATE_KEY;
const jwtAudience = process.env.UPLOADER_JWT_AUDIENCE;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

const sanitizeFileNames = (input: string) => input.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');
  // const name = (req.query.name || (req.body && req.body.name));
  // const responseMessage = name
  //   ? "Hello, " + name + ". This HTTP triggered function executed successfully."
  //   : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  // context.res = {
  //   // status: 200, /* Defaults to 200 */
  //   body: responseMessage
  // };

  const version = Date.now();

  const objectName = sanitizeFileNames(req.body.speaker) + '-' + sanitizeFileNames(req.body.talk) + '-' + version + extname(req.body.name);

  context.res = {
    body: JSON.stringify({
      object: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${objectName}`,
      token: sign(
        {
          iss: jwtAudience,
          aud: jwtAudience,
          sub: `${process.env.AZURE_STORAGE_ACCOUNT_NAME}/${containerName}/${objectName}`
        },
        jwtPrivateKey,
        {
          expiresIn: '24h'
        }
      )
    })
  };

};

export default httpTrigger;
