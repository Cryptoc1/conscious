// Organize this piece of shit later
var http    = require('http'),
    express = require('express'),
    agent   = require('superagent'),
    Promise = require('promise'),
    app     = express();

var port = process.env.PORT || 8080
var router = express.Router();

var urls = {
  // "instagram"  : "",
  // "tumblr"     : "",
  "lastfm"   : "http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
            "&user=ltrlly&api_key=" + process.env.LASTFM_KEY + "&format=json",
  "github"   : "https://api.github.com/users/lwwws",
}

// asssssynchronous  mMMMMMM good shit
function get(url) {
  return new Promise(function(resolve, reject) {
    agent.get(url).end(function(err, res) {
      if (err) return reject(err)
      resolve(res.body)
    });
  })
}

var json = {
  "sleeping":true, // manual AF
  "responses":{}
}

router.get('/', function(req, res) {
  Promise.all(
    Object.keys(urls).map(function(key) {
      return get(urls[key]).then(function(data) {
        switch(key) {
          case 'lastfm':
            var lastfm = data.recenttracks.track[0]
            json.responses.lastfm = {
              time: lastfm.date['#text'],
              title: lastfm.name,
              artist: lastfm.artist['#text'],
              energy: json.responses.song_energy
            }
            break;
          case 'github':
            json.responses[key] = data.updated_at
            break;
        }
      })
    })
  ).then(function() {
    var encodedArtist = encodeURIComponent(json.responses.lastfm.artist['#text'])
    var encodedSong    = encodeURIComponent(json.responses.lastfm.name)
    var url = "http://developer.echonest.com/api/v4/song/search?api_key=" +
                  process.env.ECHONEST_KEY + "&title=" + encodedSong +
                  "&artist=" + encodedArtist + "&results=1&sort=duration-desc" +
                  "&bucket=audio_summary"
    return get(url).then(function(data) {
      json.responses.lastfm.energy = data.response.songs[0].audio_summary.energy
    })
  }).then(function() {
    res.json(json)
  })
})

app.use('/', router)
app.listen(port)
