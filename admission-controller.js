const express = require('express');
const https = require('https');
const fs = require('fs');
const k8s = require('@kubernetes/client-node');

const admissionReviewVersion = 'admission.k8s.io/v1';

const tlsOptions = {
  key: fs.readFileSync('./tls.key'),
  cert: fs.readFileSync('./tls.crt'),
};

const app = express();
const port = 8080;

// Create a Kubernetes CoreV1Api instance
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

// Admission controller logic
app.use(express.json());

app.post('/mutate', async (req, res) => {
  const admissionReview = req.body;
  const pod = admissionReview.request.object;
  console.log("hai called.")
  console.log(req.body)
  if (admissionReview.request.operation === 'CREATE' || admissionReview.request.operation === 'UPDATE') {
    // Add a custom label to the pod
    pod.metadata.labels = pod.metadata.labels || {};
    pod.metadata.labels['custom-label'] = 'sample-value';
  }

  const admissionResponse = {
    apiVersion: admissionReviewVersion,
    kind: 'AdmissionReview',
    response: {
      uid: admissionReview.request.uid,
      allowed: true,
      patchType: 'JSONPatch',
      patch: [],
    },
  };

  res.json(admissionResponse);
});


app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

// Start the server
https.createServer(tlsOptions, app).listen(port, () => {
  console.log(`Admission controller listening on port ${port}`);
});

