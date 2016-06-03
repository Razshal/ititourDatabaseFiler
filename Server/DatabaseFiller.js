var http = require('http');
var fs = require('fs');
var mongo = require('mongodb').MongoClient;
var serverAddress = "mongodb://192.168.0.37:27017/Ititour";
var basicPassword = "laboheme55";

function sendLastDatas(socket, items){
    socket.emit('lastDatas', {datas: items});
}
function sendLogForClient(socket, log){
    socket.emit('logForApp', {err:log});
}
function sendBadPassword(socket){
    socket.emit('logForApp', {err:"Mot de passe non valide"});
}
function modifiedDataConfirmation(socket, confirmationType, dataId){
    socket.emit('confirmation', {
        dataId: dataId,
        confirmationType: confirmationType});
}
function passwordCheck(data){
    return data.password == basicPassword;
}

mongo.connect(serverAddress, function (err, db) {
    if (err) console.log("Impossible de se connecter ", err);
    else console.log("Connection to database:  OK");

    //On crée le serveur web après avoir réussit à se connecter à la base de données
    var webServer = http.createServer(function(request,response){
        fs.readFile('../Views/DatabaseFillerPageView.html', 'utf-8', function(err, data)
        {
            if (err) console.log(err);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
        });
    }).listen(8080);
    
    var io = require('socket.io').listen(webServer);
    io.sockets.on('connection', function(socket){
        var doc = db.collection('ititourContent');

        console.log("Connexion depuis l'adresse : " + socket.request.connection.remoteAddress);

        doc.find().sort({"date":-1}).limit(20).toArray().then(
            function (items) {
                sendLastDatas(socket,items);
            }
        );
        socket.on('datasToPush', function (data) {
            if (passwordCheck(data)) {
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
                    db.collection('ititourContent').find().sort({date:-1}).limit(1).toArray().then(function(items){
                        sendLastDatas(socket,items);
                    });

                }
                else
                    sendLogForClient(socket, "Données non valides (vérifiez l'orthographe et les champs saisits)");

            }
            else sendBadPassword(socket);
        });

        socket.on('askForDeletion', function(data){
            if (passwordCheck(data)) {
                var idToDelete = data.id;
                console.log(idToDelete);

                doc.findOneAndDelete({"_id":idToDelete}, function (err, results) {
                    console.log(results);
                    if (results.result.n > 0) {
                        modifiedDataConfirmation(socket, "deletion", idToDelete);
                    } else {
                        sendLogForClient(socket, "Aucune correspondance trouvée");
                        console.log(err);
                    }
                });
            }
            else sendBadPassword(socket);
        });

        if (socket.request.connection.remoteAddress == "::ffff:192.168.0.27")
            setTimeout(function () {
                sendLogForClient(socket,"Bonjour Valentin !");
            }, 2000);

        if (socket.request.connection.remoteAddress == "::ffff:192.168.0.32")
            setTimeout(function () {
                sendLogForClient(socket,"Bonjour Mathieu !");
            }, 2000);
    });
});