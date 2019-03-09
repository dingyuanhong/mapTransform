package main

import ( 
	"fmt" 
	// "net/http"
	"log"
	// "time"
	"io/ioutil"
	"io"
	"os"
	"flag"
	// "crypto/tls"
	// "crypto/md5"
	// "encoding/hex"
	"regexp"
	// "strings"
	"encoding/json"
	"reflect"
	"runtime"
	"compress/gzip"
	// "github.com/issue9/mux"
	//"github.com/gorilla/mux"
	"github.com/qedus/osmpbf"
	// "github.com/paulmach/orb"
	"github.com/paulmach/orb/encoding/mvt"
)

func dumpPBF(name string){
	// name := "./cache/0a10a343df0d68cf9deedc20cb48684e.vector.pbf";
	file,err := os.Open(name)
	if (err != nil){
		return;
	}
	defer file.Close()

	decode,_ := gzip.NewReader(file)

	d := osmpbf.NewDecoder(decode)
	d.SetBufferSize(32*1024)

	err = d.Start(runtime.GOMAXPROCS(-1))
	if err != nil {
		log.Println(err);
		log.Fatal(err)
	}

	var nc, wc, rc uint64
	for {
	    if v, err := d.Decode(); err == io.EOF {
	        break
	    } else if err != nil {
	        log.Fatal(err)
	    } else {
	        switch v := v.(type) {
	        case *osmpbf.Node:
	            // Process Node v.
	            nc++
	        case *osmpbf.Way:
	            // Process Way v.
	            wc++
	        case *osmpbf.Relation:
	            // Process Relation v.
	            rc++
	        default:
	            log.Fatalf("unknown type %T\n", v)
	        }
	    }
	}
	// fmt.Println(tree);
	fmt.Printf("Nodes: %d, Ways: %d, Relations: %d\n", nc, wc, rc)
}

func Layers(name string,decompress bool) mvt.Layers {
	file,err := os.Open(name)
	if (err != nil){
		fmt.Println(err);
		return nil;
	}
	defer file.Close()

	var data []byte = nil;
	if (decompress) {
		unzip,err := gzip.NewReader(file)
		if (err != nil){
			fmt.Println(err);
			return nil;
		}
		defer unzip.Close();

		data,err = ioutil.ReadAll(unzip);
		if (err != nil){
			fmt.Println(err);
			return nil;
		}
	} else{
		data,err = ioutil.ReadAll(file);
		if (err != nil){
			fmt.Println(err);
			return nil;
		}
	}
	
	layers,err := mvt.Unmarshal(data)

	if (err != nil){
		fmt.Println(err);
		return nil;
	}
	return layers
}

func exportPBF(name string,decompress bool,save string){
	layers := Layers(name,decompress);
	if layers == nil {
		return;
	}

	data,err := mvt.Marshal(layers)
	if (err != nil){
		fmt.Println(err);
		return;
	}
	err = ioutil.WriteFile(save,data,os.ModePerm);
	if(err != nil){
		fmt.Println(err);
	}
}

func exportJSON(name string,decompress bool,save string){
	layers := Layers(name,decompress);
	if layers == nil {
		return;
	}

	fc := layers.ToFeatureCollections();
	data,err := json.Marshal(fc)
	if (err != nil){
		fmt.Println(err);
		return;
	}
	err = ioutil.WriteFile(save,data,os.ModePerm);
	if(err != nil){
		fmt.Println(err);
	}
}

func dumpMVT(name string,decompress bool){
	layers := Layers(name,decompress);
	if layers == nil {
		return;
	}

	for i := 0 ; i < len(layers);i++ {
		// fmt.Println(layers[i]);
		// fmt.Println(layers[i].Features[0]);
		name := layers[i].Name;
		// fmt.Println(name)
		features := layers[i].Features;
		for j := 0;j<len(features);j++{
			feature := features[j];
			
			fmt.Println(name,feature.Geometry)
		}
	}
}

func main(){
	var typeDo string
    flag.StringVar(&typeDo,"type", "", "type: dump export test")
    var src string
    flag.StringVar(&src, "src", "", "source file")
    var format string
    flag.StringVar(&format,"format", "", "format: pbf mvt json")
    var decompress bool
    flag.BoolVar(&decompress,"decompress",false,"decompress: bool");
    var out string
    flag.StringVar(&out,"out","","output file");

    flag.Parse()

    if typeDo == "dump" {
    	if format == "pbf" {
    		dumpPBF(src)
    	} else if format == "mvt" {
    		dumpMVT(src,decompress)
    	} else {
    		fmt.Println("dump no support " + format);
    	}
    } else if typeDo == "export" {
    	flag.Parse()
    	if format == "pbf" {
    		exportPBF(src,decompress,out)
    	} else if format == "json" {
    		exportJSON(src,decompress,out)
    	} else {
    		fmt.Println("export no support " + format);
    	}
    } else {
    	flag.Usage()
    }
}