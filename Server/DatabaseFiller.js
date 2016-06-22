var serverAddress = "mongodb://192.168.0.37:27017/Ititour",
    basicPassword = "laboheme55",
    dataManip = require('./DataManipulation'),
    express = require('express'),
    app = express(),
    mongo = require('mongodb').MongoClient,
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);

server.listen(8080);

const mongodb = require('mongodb');


function passwordCheck(data, socket){
    var check = data.password == basicPassword;
    if (!check) dataManip.sendLogForClient(socket, "Erreur : mot de passe non valide");
    return check;
}

mongo.connect(serverAddress, (err, db) => {
    if (err) console.log("Impossible de se connecter ", err);
    else console.log(`Connection to database "${db.databaseName}" successful`);

    app.get('/', (request, response)=> {
        response.sendFile('DatabaseFillerPageView.html', {root:'../Views'})
    });


    io.sockets.on('connection', (socket) => {
        var departementColl = db.collection('Departement'),
            villeColl = db.collection('Ville'),
            siteColl = db.collection('Site'),
            colls = [departementColl,villeColl,siteColl];

        console.log("Connexion depuis l'adresse : " + socket.request.connection.remoteAddress);

        for(var i=0, x = colls.length; i < x; i++) {
            dataManip.prepareAndSendLastDatasForClient(socket, colls[i]);
        }

        socket.on('datasToPush', (data) => {
            if (passwordCheck(data, socket)) {
                if (data.note > 0 && data.note <=5) {
                    var date = new Date(),
                        dataToPushIntoDB = {
                        name: data.name, note: data.note,
                        desc: data.desc, date
                        },
                        dataReceivedType = data.type,
                        lastCollModified;
                    
                    if(dataReceivedType == "Departement") {
                        db.collection(dataReceivedType, (err, col) => {
                            dataToPushIntoDB.villes = data.villes;
                            col.insert(dataToPushIntoDB);
                            lastCollModified = dataReceivedType;
                        });
                    } else if(dataReceivedType == "Ville") {
                        db.collection(dataReceivedType, (err, col) => {
                            dataToPushIntoDB.keywords = data.keywords;
                            dataToPushIntoDB.departement = data.departement;
                            dataToPushIntoDB.sites = data.sites;
                            col.insert(dataToPushIntoDB);
                            lastCollModified = dataReceivedType;
                        });
                    } else if (dataReceivedType == "Site") {
                        db.collection(dataReceivedType, (err, col) => {
                            dataToPushIntoDB.keywords = data.keywords;
                            dataToPushIntoDB.linkedVilles = data.linkedVilles;
                            dataToPushIntoDB.address = data.address;
                            col.insert(dataToPushIntoDB);
                            lastCollModified = dataReceivedType;
                        });
                    }
                    
                    if (lastCollModified){
                        var collectionToStream = db.collection(lastCollModified);
                        dataManip.prepareAndSendLastDatasForClient(socket, collectionToStream, 1, data.name);

                    }
                } else
                    dataManip.sendLogForClient(socket, "Données non valides (vérifiez l'orthographe et les champs saisits)");
            }
        });

        socket.on('askForDeletion', (data) => {
            if (passwordCheck(data, socket) && data.type != undefined) {
                var idToDelete = (data.id).toString(),
                    collectionDesired = (data.type).toString();
                console.log(`User wants to delete : ${idToDelete}`);

                db.collection(collectionDesired).deleteOne({"_id": mongodb.ObjectID(idToDelete)}, (err, results) => {
                    console.log(`Request success : ${results.result.ok}, documents deleted : ${results.result.n}`);
                    if (results.result && results.result.n != undefined && results.result.n > 0) {
                        dataManip.sendConfirmationForModifiedData(socket, "deletion", idToDelete);
                    } else {
                        dataManip.sendLogForClient(socket, "No matches found");
                        console.log(err);
                    }
                });
            }
        });

        /*
        if (socket.request.connection.remoteAddress == "::ffff:192.168.0.27")
            setTimeout(function () {
                sendLogForClient(socket,"Bonjour Valentin !");
            }, 2000);

        if (socket.request.connection.remoteAddress == "::ffff:192.168.0.32")
            setTimeout(function () {
                sendLogForClient(socket,"Bonjour Mathieu !");
            }, 2000);
        */
    });
});
