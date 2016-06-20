/**
 * Created by Mathieu on 17/06/2016.
 */

var exports = module.exports = {};

exports.sendLastDatas =  (socket, items)=>{
        socket.emit('lastDatas', {datas: items});
        console.log("Données récentes envoyées");
};
exports.sendLogForClient =  (socket, log) =>{
        socket.emit('logForApp', {err:log});
};

exports.sendConfirmationForModifiedData =  (socket, confirmationType, dataId)=>{
        socket.emit('confirmation', {
            dataId: dataId,
            confirmationType: confirmationType});
};
exports.prepareAndSendLastDatasForClient =  (socket, collectionToSend, limit, precision)=>{
        var dataLimit = limit ? limit : 7;
        if (precision){
            setTimeout(()=>{
                collectionToSend.find({"name":precision}).sort({"date": -1}).limit(dataLimit).toArray().then((items) => {
                    for (var item in items) {
                        if (!items.hasOwnProperty(item)) continue;
                        items[item].type = collectionToSend.collectionName.toString();
                    }
                    exports.sendLastDatas(socket, items);
                });
            },1000);
        } else {
            collectionToSend.find().sort({"date": -1}).limit(dataLimit).toArray().then((items) => {
                for (var item in items) {
                    if (!items.hasOwnProperty(item)) continue;
                    items[item].type = collectionToSend.collectionName.toString();
                }
                exports.sendLastDatas(socket, items);
            });
        }
};
