// convert csv to json
const csv = require("csv-parser");
// to access physical file and doing I/O operations we use fs.
const fs = require("fs");
const $rdf = require("rdflib");

//graph db to store triples
const store = $rdf.graph();
var results = [];

// file path
const filePath = "./top50.csv";

// prefixes
var RDF = new $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var SCHEMA = new $rdf.Namespace("http://schema.org/");
var DBO = new $rdf.Namespace("http://dbpedia.org/ontology/");
var DBR = new $rdf.Namespace("http://dbpedia.org/resource/");
var DBP = new $rdf.Namespace("http://dbpedia.org/property/");
var PURL = new $rdf.Namespace("http://purl.org/ontology/mo/");
var EMOCA = new $rdf.Namespace("http://ns.inria.fr/emoca/");
var AF = $rdf.Namespace(
  "http://motools.sourceforge.net/doc/audio_features.html#"
);

// A made up URI for those properties which there was no ontology for them
var NEW_MO = new $rdf.Namespace("http://music.org/properties/");

// new properties or classes
const energy = $rdf.sym(NEW_MO("energy"));
store.add(energy, RDF("type"), RDF("property"));

const danceAbility = $rdf.sym(NEW_MO("danceAbility"));
store.add(danceAbility, RDF("type"), RDF("property"));

const loudness = $rdf.sym(NEW_MO("loudness"));
store.add(loudness, RDF("type"), RDF("property"));

const liveness = $rdf.sym(NEW_MO("liveness"));
store.add(liveness, RDF("type"), RDF("property"));

const acousticness = $rdf.sym(NEW_MO("acousticness"));
store.add(acousticness, RDF("type"), RDF("property"));

fs.createReadStream(filePath)
  .pipe(
    csv({
      separator: ",",
    })
  )
  .on("data", (data) => {
    results.push(data);
    let musicURI = $rdf.sym(`http://Muzix.com/${data.id}`);

    // create triples for each row
    store.add(musicURI, RDF("type"), DBO("Song"));

    // based on a song sample on dbpedia
    store.add(musicURI, DBP("name"), data["Track.Name"]);
    store.add(musicURI, DBO("artist"), data["Artist.Name"]);

    store.add(musicURI, PURL("genre"), data.Genre);
    store.add(musicURI, PURL("bpm"), data["Beats.Per.Minute"]);
    store.add(musicURI, energy, data.Energy);
    store.add(musicURI, danceAbility, data.Danceability);
    store.add(musicURI, loudness, data.Loudness);
    store.add(musicURI, liveness, data.Liveness);
    store.add(musicURI, EMOCA("Valence"), data.Valence);
    store.add(musicURI, SCHEMA("duration"), data.Length);
    store.add(musicURI, acousticness, data.Acousticness);
    store.add(musicURI, AF("SpeechSegment"), data.Speechiness);
    store.add(musicURI, DBO("rank"), data.Popularity);
  })
  .on("end", () => {
    console.log(store.toNT());
    //generate a turtle text from the store and write the text to .ttl file
    fs.writeFile(
      "songs.ttl",
      $rdf.serialize(null, store, `http://Muzix.com/#`, "text/turtle"),
      function (err) {
        if (err) {
          return console.log(err);
        }
      }
    );
  });
