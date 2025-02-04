const express = require('express');
const https = require('node:https');
const app = express();
const port = 3040;

app.get('/get', (req, res) => {
  let originalUrl = req.query.url;
  if(originalUrl.startsWith('https://plugins.gradle.org/m2/')) {
    https.request(originalUrl, function (response) {
      res.setHeader('Access-Control-Allow-Origin','*');
      response.pipe(res);
  }).on('error', function (e) {
      res.sendStatus(500);
  }).end();
  } else {
    res.sendStatus(404);
  }
})

app.listen(port, () => {
  console.info(`CORS Proxy started on port ${port}`)
});