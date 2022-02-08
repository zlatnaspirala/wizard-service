var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

const forceSecure = (req, res, next) => {
  if (req.secure)
     return next(); // https -- Continue

  res.redirect('https://' + req.hostname + req.url)
}

/**
* This will force
* ALL HTTP requests ( GET, POST, OPTIONS, etc. )
* on ALL route handlers to be
* redirected to https 
*/
app.all('*', forceSecure);

app.get('/', (req, res, next) => {
  console.log('example');
  res.end();
});

app.ws('/', (ws, req) => {
  ws.on('message', msg => {
    console.log(msg);
  });
  console.log('socket', req.example);
});

app.listen(3000);