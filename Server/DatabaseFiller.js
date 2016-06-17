var http = require('http');
var fs = require('fs');
var mongo = require('mongodb').MongoClient;
const mongodb = require('mongodb');
var serverAddress = "mongodb://192.168.0.37:27017/Ititour";
var basicPassword = "laboheme55";

function sendLastDatas(socket, items){
    socket.emit('lastDatas', {datas: items});
}
function sendLogForClient(socket, log){
    socket.emit('logForApp', {err:log});
}
function sendConfirmationForModifiedData(socket, confirmationType, dataId){
    socket.emit('confirmation', {
        dataId: dataId,
        confirmationType: confirmationType});
}
function passwordCheck(data, socket){
    var check = data.password == basicPassword;
    if (!check) sendLogForClient(socket, "Erreur : mot de passe non valide");
    return check;
}
function prepareAndSendLastDatasForClient(socket, collectionToSend, limit){
    var dataLimit = limit ? limit : 7;
    collectionToSend.find().sort({"date":-1}).limit(dataLimit).toArray().then((items) => {
        for(var item in items){
            if(!items.hasOwnProperty(item)){continue;}
            items[item].type = collectionToSend.collectionName.toString();
        }
        sendLastDatas(socket,items);
    });
    console.log("Données récentes envoyées");
}

mongo.connect(serverAddress, (err, db) => {
    if (err) console.log("Impossible de se connecter ", err);
    else console.log("Connection to database:  OK");

    //On crée le serveur web après avoir réussit à se connecter à la base de données
    var webServer = http.createServer( (request,response) => {
        fs.readFile('../Views/DatabaseFillerPageView.html', 'utf-8', (err, data) => {
            if (err) console.log(err);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
        });
    }).listen(8080);
    
    var io = require('socket.io').listen(webServer);
    io.sockets.on('connection', (socket) => {
        var departementColl = db.collection('Departement'),
            villeColl = db.collection('Ville'),
            siteColl = db.collection('Site'),
            colls = [departementColl,villeColl,siteColl];

        console.log("Connexion depuis l'adresse : " + socket.request.connection.remoteAddress);

        for(var i=0, x = colls.length; i < x; i++) {
            prepareAndSendLastDatasForClient(socket, colls[i]);
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
                            col.insert(dataToPushIntoDB);
                            lastCollModified = dataReceivedType;
                        });
                    }
                    
                    if (lastCollModified){
                        var collectionToStream = db.collection(lastCollModified);
                        prepareAndSendLastDatasForClient(socket, collectionToStream, 1);

                    }
                } else
                    sendLogForClient(socket, "Données non valides (vérifiez l'orthographe et les champs saisits)");
            }
        });

        socket.on('askForDeletion', (data) => {
            if (passwordCheck(data, socket) && data.type != undefined) {
                var idToDelete = (data.id).toString(),
                    collectionDesired = (data.type).toString();
                console.log(`User wants to delete : ${idToDelete}`);

                db.collection(collectionDesired).deleteOne({"_id": mongodb.ObjectID(idToDelete)}, (err, results) => {
                    console.log(`Request success : ${results.result.ok}, documents deleted : ${results.result.n}`);
                    if (results.result && results.result.n > 0) {
                        sendConfirmationForModifiedData(socket, "deletion", idToDelete);
                    } else {
                        sendLogForClient(socket, "No matches found");
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
