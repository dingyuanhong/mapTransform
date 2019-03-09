var _ = require('lodash');
var async = require("async")
var reqeust =  require("request")
var fs = require("fs")
var stream = require("stream")

var cover = require('tile-cover')
var vtGeoJson = require('vt-geojson')
var geoJsonVT = require('geojson-vt')

var zlib = require('zlib')
var Pbf = require('pbf')
var VectorTile = require('vector-tile').VectorTile

async.auto({
"local":function(callback){
    fs.readFile("./t.pbf",callback);
},
provider:function(callback){
    reqeust.get("http://10.30.200.73:8080/a/16/19293/24641/t.pbf")
    .on("error",function(err){
        callback(err);
    })
    .on("data",function(data){
        callback(null,data);
    })
},
"transform-vt":['local',function(result,callback){
    var rawdata = result["local"];
    
    async.auto({
        empty:function(callback){
            callback(null);
        },
        data:function(callback){
            callback(null,rawdata);
        },
        unzip:["data",function(data,callback){
            data = data["data"];
            if(!data){
                callback(null);
                return;
            }
            zlib.gunzip(data,function(err,buffer){
                callback(err,buffer);
            });
        }],
        tile:["unzip",function(data,callback){
            var tiledata = data["unzip"]
            var vt = new VectorTile(new Pbf(tiledata))

            var geojson = {};
            var layers = Object.keys(vt.layers)
            console.log(layers.length);
            for (var j = 0; j < layers.length; j++) {
                var ln = layers[j]
                var layer = vt.layers[ln]
                var features = [];
                geojson[ln] = {
                    "type": "FeatureCollection",
                    "features":features,
                };
                for (var i = 0; i < layer.length; i++) {
                    try {
                        var feat = layer.feature(i).toGeoJSON(0, 0, 0)
                        // self.push(feat)
                        features.push(feat);
                    } catch (e) {
                        var error = new Error(
                        'Error reading feature ' + i + ' from layer ' + ln + ':' + e.toString()
                        )
                        if (options.strict) {
                            // return next(error)
                        } else {
                            // tileError(tile, error)
                        }
                        console.log(error);
                    }
                }
            }
            callback(null,geojson);
        }]
    },function(err,results){
        if(err){
            callback(err);
        }else{
            callback(null,results["tile"]);
        }
    })
}],
// "transform-json":['transform-vt',function(result,callback){
    // callback(null);
// }],
"output":["transform-vt",function(data,callback){
    var json = data["transform-vt"]
    var data = JSON.stringify(json);
    fs.writeFile("t.json",data,callback);
}]
},function(err,results){
    if(err){
        console.log("error:",err);
        return;
    }
    console.log(results);
})
