/*TODO :
 *- Request for itineraries
 *- Request for
*/

var express = require('express'),
    fs = require('fs'),
    hskey = fs.readFileSync('keys/hacksparrow-key.pem'),
    hscert = fs.readFileSync('keys/hacksparrow-cert.pem'),
    options = {key: hskey, cert: hscert},
    app = express(),
    data = require('./itiAlternative.json'),
    http = require('http').createServer(app).listen(8080);
var name = [];

app.use(express.static('../Views/Assets'));
app.param('name', (request, response, next)=>{
    //this method intercept all requests with "name" args before the app.get
    name.push(request.params.name);
    console.log(name);
    next();
});


app.get('/api', (request, response)=>{
   response.json(data);
});
app.get('/', (request, response)=>{
   response.redirect('/api');
});
app.get('/test/:name', (request, response)=>{
   var nameParam = request.params.name;
   console.log(nameParam);
   response.send(nameParam);
});
app.get('/login',(request, response)=>{

});
app.listen(http);