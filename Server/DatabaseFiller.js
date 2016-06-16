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
function modifiedDataConfirmation(socket, confirmationType, dataId){
    socket.emit('confirmation', {
        dataId: dataId,
        confirmationType: confirmationType});
}
function passwordCheck(data, socket){
    var check = data.password == basicPassword;
    if (!check) sendLogForClient(socket, "Erreur : mot de passe non valide");
    return check;
}
function prepareAndSendLastDatasForNewConnection(socket, collectionToSend){
    collectionToSend.find().sort({"date":-1}).limit(7).toArray().then((items) => {
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
        var doc = db.collection('ititourContent'),
            departementColl = db.collection('Departement'),
            villeColl = db.collection('Ville'),
            siteColl = db.collection('Site'),
            colls = [departementColl,villeColl,siteColl];

        console.log("Connexion depuis l'adresse : " + socket.request.connection.remoteAddress);

        for(var i=0, x = colls.length; i < x; i++) {
            prepareAndSendLastDatasForNewConnection(socket, colls[i]);
        }

        socket.on('datasToPush', (data) => {
            if (passwordCheck(data, socket)) {
                if (data.note > 0 && data.note <=5) {
                    var date = new Date(),
                        dataToPush = {
                        name: data.name, note: data.note,
                        desc: data.desc, date
                    },
                        type = data.type,
                        lastCollModified;
                    
                    if(type == "Departement") {
                        db.collection(type, (err, col) => {
                            dataToPush.villes = data.villes;
                            col.insert(dataToPush);
                            lastCollModified = type;
                        });
                    } else if(type == "Ville") {
                        db.collection(type, (err, col) => {
                            dataToPush.keywords = data.keywords;
                            dataToPush.departement = data.departement;
                            dataToPush.sites = data.sites;
                            col.insert(dataToPush);
                            lastCollModified = type;
                        });
                    } else if (type == "Site") {
                        db.collection(type, (err, col) => {
                            dataToPush.keywords = data.keywords;
                            dataToPush.linkedVilles = data.linkedVilles;
                            col.insert(dataToPush);
                            lastCollModified = type;
                        });
                    }
                    
                    if (lastCollModified) {
                        var newData = db.collection(lastCollModified).find({"date": -1}).limit(1);
                        newData.type = data.type.toString();
                        sendLastDatas(newData);
                        console.log(`J'ai envoyé un(e) ${type} qui contenait ${newData.name}`);
                    }
                } else
                    sendLogForClient(socket, "Données non valides (vérifiez l'orthographe et les champs saisits)");
            }
        });

        socket.on('askForDeletion', (data) => {
            if (passwordCheck(data, socket) && data.type != undefined) {
                var idToDelete = (data.id).toString(),
                    collectionDesired = (data.type).toString();
                console.log(idToDelete);
                db.collection(collectionDesired).deleteOne({"_id": mongodb.ObjectID(idToDelete)}, (err, results) => { //... here is the problem : no deletion
                    console.log(`Request success : ${results.result.ok}, documents deleted : ${results.result.n}`);
                    //Request success : 1, documents deleted : 0, so the document is still on my database
                    if (results.result && results.result.n > 0) {
                        modifiedDataConfirmation(socket, "deletion", idToDelete);
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
