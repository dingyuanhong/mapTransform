var request = require("request");
const osm2geojson = require('osm2geojson-lite');
var parse = require("fast-osm-json").parse
const xml2geojson = require('xml2geojson-lite');

var XmlParser = require("osm2geojson-lite/lib/xmlparser")

console.log(XmlParser)

function osmTransform(data){
	let geojson = osm2geojson(data,{
		completeFeature :true,
		allFeatures:true,
		renderTagged:true,
		suppressWay :true
	});
	console.log(geojson);

	for(var i in geojson.features){
		// console.log(geojson.features[i])
	}
}

function fastTransform(data){
	const result = parse(data)
	console.log(result);
}

function xmlTransform(data){
	console.log(data);
	let geojson = xml2geojson(data,{
		allFeatures:true
	});
	console.log(geojson);
}

request("http://10.30.200.73:3000/api/0.6/map?bbox=113.8897705078125,22.527779798694564,113.89526367187499,22.53285370752713",
function(err,data){
	osmTransform(data.body);
	// fastTransform(data.body);
	// xmlTransform(data.body);
})
