const express = require('express');
const bodyParser = require('body-parser');
const fs = require('node:fs');
const app = express();
const port = 3030;

app.use(bodyParser.text());
app.post('/doc', (req, res) => {
  console.log('received request');
  let doc = JSON.parse(req.body);
  let path = ('./public/docs/'+doc.path).replace('//','/');
  fs.writeFile(path,doc.content, err => {
    if (err) {
      console.error(err);
    }
  });
  let responseText = `Created document at path: ${path}`;
  res.send({result:responseText});
});

app.listen(port, () => {
  console.log(`Doc generator started on port ${port}`)
});