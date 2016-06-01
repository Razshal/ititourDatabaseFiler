var http = require('http');
var fs = require('fs');

var mongo = require('mongodb').MongoClient;
var serverAddress = "mongodb://192.168.0.37:27017/Ititour";

var basicPassword = "laboheme55";

function sendLastDatas(socket, items){
    socket.emit('lastDatas', {datas: items});
}



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
                sendLastDatas(socket,items);
                return;
            }
        );
        socket.on('datasToPush', function (data) {

            if (data.password == "laboheme55") {
                if (data.note > 0 && data.note <=5) {
                    var date = new Date();
                    if (data.type == "Departement") {
                        console.log('revieved data');
                        db.collection('ititourContent', function (err, col) {
                            col.insert({
                                type: data.type,
                                name: data.name,
                                note: data.note,
                                keywords: data.keywords,
                                villes: data.villes,
                                desc: data.desc,
                                date: date
                            });
                        });
                    }
                    else if (data.type == "Ville") {
                        db.collection('ititourContent', function (err, col) {
                            col.insert({
                                type: data.type,
                                name: data.name,
                                note: data.note,
                                keywords: data.keywords,
                                departement: data.departement,
                                sites: data.sites,
                                desc: data.desc,
                                date: date
                            });
                        });
                    }
                    else if (data.type == "Site") {
                        db.collection('ititourContent', function (err, col) {
                            col.insert({
                                type: data.type,
                                name: data.name,
                                note: data.note,
                                keywords: data.keywords,
                                linkedVilles: data.linkedVilles,
                                desc: data.desc,
                                date: date
                            });
                        });
                    }
                    db.collection('ititourContent').find().limit(1).toArray().then(function(items){
                        sendLastDatas(socket,items);
                    });

                }

            }
            else
                socket.emit('logForApp',{err:"Mot de passe non valide"});
        });
    });

});