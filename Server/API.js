var express = require('express'),
    app = express(),
    dataa = require('./itiAlternative.json'),
    http = require('http').createServer(app).listen(8080);

app.use(express.static('../Views/Assets'));

app.get('/api',function (request, response) {
   response.json(dataa);
});
app.get('/',function (request, response) {
   response.redirect('/api');
});
app.listen(http);