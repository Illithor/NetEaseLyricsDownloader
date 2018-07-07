'use strict';
const request = require('request');
const Promise = require('bluebird');
const fs = require('fs');

async function main() {
	let ALBUM_ID = '38673892'; // Insomnium - The Candlelight Years
	let song_and_artist_names = await get_song_and_artist_names_from_album(ALBUM_ID);
	await Promise.each(song_and_artist_names, (song_and_artist_name) => { download_lyrics(song_and_artist_name); });
	console.log('SUCCESS!');
}

function get_song_and_artist_names_from_album(id) {
	return new Promise(function (resolve, reject) {
    request.get({
	    url: `http://localhost:3000/album?id=${id}`,
	    json: true,
	  },
	  (err, res, data) => {
	    if (err || res.statusCode !== 200) {
	      reject(err);
	    } else {
	    	let songs_arr = Object.values(data.songs);
	      let re = songs_arr.map((elem, index) => {
	      	let bundle = {};
	      	bundle.song_name = elem.name;
	      	bundle.artist_name = elem.ar[0].name;
	    		return bundle;
	      });
	      resolve(re);
	    }
		})
  });
}

async function download_lyrics(song_and_artist_name) {
	let song_name = song_and_artist_name.song_name;
	let artist_name = song_and_artist_name.artist_name;
	let search_name = song_name.replace(/\s/g, '%20').concat('%20').concat(artist_name.replace(/\s/g, '%20'));
	let id = await get_song_id_by_name(search_name);
	console.log(`${song_name}'s id is ${id}`);
	let lyrics = await get_lyrics_by_id(song_name, id);
}

function get_song_id_by_name(song_name) {
	return new Promise(function (resolve, reject) {
    request.get({
	    url: `http://localhost:3000/search?keywords=${song_name}`,
	    json: true,
	  },
	  (err, res, data) => {
	    if (err || res.statusCode !== 200) {
	      reject(err);
	    } else {
	    	let song_id = data.result.songs[0].id;
	      resolve(song_id);
	    }
		})
  });
}

function get_lyrics_by_id(song_name, id) {
	return new Promise(function (resolve, reject) {
    request.get({
	    url: `http://localhost:3000/lyric?id=${id}`,
	    json: true,
	  },
	  (err, res, data) => {
	    if (err || res.statusCode !== 200) {
	      reject(err);
	    } else if (data.hasOwnProperty('uncollected') || data.hasOwnProperty('nolyric')) {
	    	console.log(`${song_name} does not have lyrics on the server.`)
	    } else {
	    	let lyrics = data.lrc.lyric;
	    	lyrics = lyrics.replace(/\[.*\]/, ''); // remove the uploader
	    	lyrics = lyrics.replace(/\[/g, '\r\n[').split('\r\n').slice(1).join('\r\n');
	    	fs.writeFile(`./${song_name}.lrc`, lyrics, function(err) {
				  if(err) {
				    return console.log(err);
				  }
				  console.log(`${song_name}.lrc was saved!`);
				}); 
	      resolve(song_name);
	    }
		})
  });
}

main();