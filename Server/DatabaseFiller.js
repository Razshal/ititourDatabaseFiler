var http = require('http');
var fs = require('fs');

var mongo = require('mongodb').MongoClient;
var serverAddress = "mongodb://192.168.0.37:27017/Ititour";


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
    var io = require('socket.io').listen(webServer);

    io.sockets.on('connection', function(socket){
        console.log("Connexion depuis l'adresse : " + socket.request.connection.remoteAddress);
        db.collection('ititourContent').find().limit(10).toArray().then(
            function (items) {
                socket.emit('lastDatas', {datas: items});
                return;
            }
        );
        socket.on('datasToPush', function (data) {

            if(data.type == "Departement"){
                console.log('revieved data');
                db.collection('ititourContent', function(err, col){
                   col.insert({
                       type: data.type,
                       name: data.name,
                       note: data.note,
                       keywords: data.keywords,
                       villes: data.villes,
                       desc: data.desc
                   });
                    console.log(err);
                });
            }
            else if(data.type == "Ville"){
                db.collection('ititourContent', function(err, col) {
                    col.insert({
                        type: data.type,
                        name: data.name,
                        note: data.note,
                        keywords: data.keywords,
                        departement: data.departement,
                        desc: data.desc
                    });
                });
            }
            else if(data.type == "Site"){
                db.collection('ititourContent', function(err, col) {
                    col.insert({
                        type: data.type,
                        name: data.name,
                        note: data.note,
                        keywords: data.keywords,
                        linkedVilles: data.linkedVilles,
                        desc: data.desc
                    });
                });
            }
        });
    });

});