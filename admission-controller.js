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

  //label base 64
  /*[{"op": "add","path": "/metadata/labels/datadog","value": "krishna123" }  ]*/
  /*"W3sib3AiOiAiYWRkIiwicGF0aCI6ICIvbWV0YWRhdGEvbGFiZWxzL2RhdGFkb2ciLCJ2YWx1ZSI6ICJrcmlzaG5hMTIzIiB9ICBd"*/

  // add secrets base 64

/*  {
    "op": "add",
      "path": "/spec/template/spec/containers/0/envFrom/-",
      "secretRef": {
    "name": "sample-pod-dev"
  }
  }

  W3sib3AiOiAiYWRkIiwicGF0aCI6ICIvc3BlYy90ZW1wbGF0ZS9zcGVjL2NvbnRhaW5lcnMvMC9lbnZGcm9tLy0iLCJzZWNyZXRSZWYiOiB7ICJuYW1lIjogInNhbXBsZS1wb2QtZGV2IiB9IH1d
  */






  const admissionResponse = {
    apiVersion: admissionReviewVersion,
    kind: 'AdmissionReview',
    response: {
      uid: admissionReview.request.uid,
      allowed: true,
      patchType: 'JSONPatch',
      patch: "W3sib3AiOiAiYWRkIiwicGF0aCI6ICIvc3BlYy90ZW1wbGF0ZS9zcGVjL2NvbnRhaW5lcnMvMC9lbnZGcm9tLy0iLCJzZWNyZXRSZWYiOiB7ICJuYW1lIjogInNhbXBsZS1wb2QtZGV2IiB9IH1d"
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

