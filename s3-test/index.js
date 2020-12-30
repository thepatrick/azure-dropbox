const express = require('express');
const cors = require('cors');
const { S3, Endpoint } = require('aws-sdk');

const app = express();

const client = new S3({
  signatureVersion: 'v4',
  region: 'ap-southeast-2', // same as your bucket
  endpoint: new Endpoint('browsertest-thepatrick-cloud.s3-accelerate.amazonaws.com'),
  useAccelerateEndpoint: true,
});

app.use(cors());

app.use(express.json()); //Used to parse JSON bodies

const sanitizeFileNames = (input) => input.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-');

app.post('/begin', async (req, res) => {
  const { UploadId } = await client.createMultipartUpload({
    Bucket: 'browsertest-thepatrick-cloud',
    Key: 'my-awesome-object.webm',
  }).promise();

  return res.json({ uploadId: UploadId });
});

app.post('/sign', async (req, res) => {
  const { uploadId, parts } = req.body;

  const promises = [];

  console.log('Parts:', parts);

  for (let i = 0; i < parts; i++) {
    promises.push(
      client.getSignedUrlPromise('uploadPart', {
        Bucket: 'browsertest-thepatrick-cloud',
        Key: 'my-awesome-object.webm',
        Expires: 30 * 60, // 30 minutes
        UploadId: uploadId,
        PartNumber: i + 1,
      })
    );
  }

  const signedURLs = await Promise.all(promises);

  console.log('Signed URLs:', signedURLs);

  return res.json({ signedURLs });
});

// interface Part {
//   ETag: string
//   PartNumber: number
// }

app.post('/finish', async (req, res) => {
  const { uploadId, parts } = req.body;

  console.log('Completing:', uploadId, parts);

  const x = await client.completeMultipartUpload({
    Bucket: 'browsertest-thepatrick-cloud',
    Key: 'my-awesome-object.webm',
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts
    },
  }).promise();


  console.log('x', x);

  res.json({ ok: true });

});

app.post('/abandon', async (req, res) => {
  const { uploadId } = req.body;

  await client.abortMultipartUpload({
    Bucket: 'browsertest-thepatrick-cloud',
    Key: 'my-awesome-object.webm',
    UploadId: uploadId,
  }).promise();

  res.json({ ok: true });
})

app.listen(3000);
