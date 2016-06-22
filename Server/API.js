var app = require('express');

var data = require('./Iti.json');
var dataa = require('./itiAlternative.json');

/*
for (var i=0, x = data.days.length; i < x; i++){
    console.log(data.days[i]);
    for (var z = 0, w = data.days[i].length; z < w ; z++){
        var tab = data.days[i][z];
        console.log(`Première étape ! Rendez vous au ${tab[0]} en suite ${tab[1]}`)
    }
}
*/

for(var i=1, x = dataa.daysNumber; i <= x; i++ ){
    var day = dataa.days["day" + i.toString()];
    for(var step in day){
        var stepObj = day[step];
        console.log(`Pour commencer ${stepObj.desc} pour rejoindre le ${stepObj.site}`);
    }
}
