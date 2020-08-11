import { AzureFunction, Context } from "@azure/functions"
import fetch from 'node-fetch';

type FileCreatedEvent = {
  data: {
    api: string;
    contentType: string;
    contentLength: string;
    url: string;
  }
  eventTime: string;
};

const eventGridTrigger: AzureFunction = async function (context: Context, eventGridEvent: FileCreatedEvent): Promise<void> {
    context.log(typeof eventGridEvent);
    context.log(eventGridEvent);

    context.log('Sending to', process.env.SLACK_NOTIFY);

    const urlBits = new URL(eventGridEvent.data.url);

    const [container, ...fileNameParts] = urlBits.pathname.substring(1).split('/');
    const fileName = fileNameParts.join('/');

    try {
      const d = await fetch(
        process.env.SLACK_NOTIFY,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            text: `A new file was uploaded: ${fileName}`,
            color: 'good',
            fields: [
              {
                "title": "Bytes",
                "value": eventGridEvent.data.contentLength,
                "short": true
              },
              {
                "title": "container",
                "value": container,
                "short": true
              }
            ]
          })
        }
      );
      context.log(`Slack said: ${await d.text()}`);
    } catch (err) {
      context.log(`Talking to slack failed: ${err.message}`);
    }

};

export default eventGridTrigger;
