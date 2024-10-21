const express = require('express')
const https = require('node:https')
const app = express()
const port = 3040

app.get('/get', (req, res) => {
  let originalUrl = req.query.url;
  https.request(originalUrl, function (response) {
      res.setHeader('Access-Control-Allow-Origin','*');
      response.pipe(res);
  }).on('error', function (e) {
      res.sendStatus(500);
  }).end();
})

app.listen(port, () => {
  console.log(`CORS Proxy started on port ${port}`)
});