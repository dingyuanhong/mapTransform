var vtpbf = require('vt-pbf')
var geojsonVt = require('geojson-vt')
var vt2geojson = require('vt2geojson');
var fs = require('fs')

var _ = require('lodash');
var zlib = require('zlib')
var Pbf = require('pbf')
var VectorTile = require('vector-tile').VectorTile

function processMVT(buffer,options,callback){
	var x = options["x"],
    y = options["y"],
    z = options["z"];
    var gzip = options["unzip"];

    (function(callback){
        if(gzip){
            zlib.gunzip(buffer,function(err,result){
                if(err){
                    callback(error)
                    return;
                }
                processTile(result,callback)
            });
        }else{
            processTile(buffer,callback)
        }
    }(function(err,json){
        var data = new Buffer.from(JSON.stringify(json));
        callback(null,data)
    }))
    
    function processTile(tiledata,callback){
        var vt = new VectorTile(new Pbf(tiledata))

        var geojson = {};
        var layers = _.keys(vt.layers)
        for (var j = 0; j < layers.length; j++) {
            var ln = layers[j]
            if (options.layers && _.indexOf(options.layers,ln) < 0) continue;
            
            var layer = vt.layers[ln]
            var features = [];
            for (var i = 0; i < layer.length; i++) {
                try {
                    var feat = layer.feature(i).toGeoJSON(x, y, z)
                    console.log(layer.feature(i));
                    console.log(feat);
                    features.push(feat);
                } catch (e) {
                    var error = new Error(
                    'Error reading feature ' + i + ' from layer ' + ln + ':' + e.toString()
                    )
                    if (options.strict) {
                        callback(error)
                        return;
                    }
                    console.log(error);
                }
            }
            if(features.length > 0){
                geojson[ln] = {
                    "type": "FeatureCollection",
                    "features":features,
                };
            }
        }
        callback(null,geojson)
    }
}

var defaultOptions = {"z":1,"x":0,"y":0,"unzip":true}
var options = defaultOptions;
var options = {"z":19,"x":428006,"y":228450,"unzip":true}

var orig = fs.readFileSync(process.argv[2]);
processMVT(orig,options,function(err,data){
    fs.writeFileSync(process.argv[3], data)
})