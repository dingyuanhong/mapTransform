var fs = require('fs')
var through = require('through2')
var parse = require('pbf2json')

parse.createReadStream({
	file:process.argv[2],
	leveldb: '/tmp'
})
.pipe(through.obj(function(items,enc,next){
	console.log(items)
    next();
}))