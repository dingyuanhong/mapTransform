var vtpbf = require('vt-pbf')
var geojsonVt = require('geojson-vt')
var vt2geojson = require('vt2geojson');
var fs = require('fs')
var zlib = require('zlib')

function processJson(options,buffer){
	var x = options["x"],
    y = options["y"],
    z = options["z"];

    var orig = JSON.parse(buffer)

    var vectorLayers = {};
    for(var i in orig){
        var data = orig[i];
        var tileindex = geojsonVt(data,{maxZoom:24,indexMaxZoom:24,extent:4096})
        var tile = tileindex.getTile(z, x, y)
        if(tile == null){
            continue;
        }
        vectorLayers[i] = tile;
    }
    // pass in an object mapping layername -> tile object
    var buff = new Buffer(vtpbf.fromGeojsonVt(vectorLayers,{"version":2}))
    return buff;
}

function transfrom(options,buff,callback){
	if(options.gzip){
	    zlib.gzip(buff,function(err,result){
	        if(err){
	            callback(err);
	            return;
	        }
	        buff = new Buffer(result);
	        callback(null,buff);
	    })
	}else{
	    callback(null,buff);
	}
}

var orig = fs.readFileSync(process.argv[2])

var defaultOptions = {"z":1,"x":0,"y":0}
var options = defaultOptions;
var options = {"z":19,"x":428006,"y":228450}

transfrom(
	{"gzip":true},
	processJson(options,orig),
	function(err,buff){
		if(err) return;
		fs.writeFileSync(process.argv[3], buff)
	}
)