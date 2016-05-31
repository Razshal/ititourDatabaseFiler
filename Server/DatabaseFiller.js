var http = require('http');
var fs = require('fs');

var mongo = require('mongodb').MongoClient;
var serverAddress = "mongodb://192.168.43.206:27017/ititourContent";

mongo.connect(serverAddress, function (err, db) {
    if (err)
        console.log("Impossible de se connecter ", err);
    else
        console.log("Connection to database:  OK");

    //On crée le serveur web après avoir réussit à se connecter à la base de données
    var webServer = http.createServer(function(request,response){
        fs.readFile('../Views/DatabaseFillerPageView.html', 'utf-8', function(err, data)
        {
            if (err)
                console.log(err);

            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
        });
    }).listen(8080);



    db.collection('site', function (err, col) {
        col.insert({
            name: arrays.toString(),
            //temperature: parseFloat(message.toString()),  OLD
            temperature: parseFloat(valueBuffer[actualBuffer][arrays].message).toFixed(2),
            time: dateForDatabase
        });



    });
});