const schedule = require("node-schedule");
const {
  me,
  my_email,
  partner_email,
  clientId,
  clientSecret
} = require("./config.js");
const fs = require("fs");
const { get, post } = require("request");
var unirest = require("unirest");
const SpotifyWebApi = require("spotify-web-api-node");

// Create the api object with the credentials
var spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret
});

let recommend = function() {
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.getPlaylistTracks("1reu8sDXrwYmZS7hhdmbrN", {}, function(
        err,
        data
      ) {
        if (err) {
          console.log(err);
          return;
        }
        let tracks = data.body.items;
        //data.body.items[0].track.external_urls.spotify
        me_track = tracks.filter(
          song =>
            song["added_by"]["id"] == me &&
            !recommended.includes(song["track"]["id"])
        )[0];
        partner_track = tracks.filter(
          song =>
            song["added_by"]["id"] != me &&
            !recommended.includes(song["track"]["id"])
        )[0];

        recommended.push(me_track.track.id);
        recommended.push(partner_track.track.id);

        fs.writeFile(
          "recommended.json",
          JSON.stringify(recommended, null, 2),
          () => {}
        );

        // send email with links to tracks
        send_email(my_email, partner_track.track.external_urls.spotify);
        send_email(partner_email, me_track.track.external_urls.spotify);
      });
    },
    function(err) {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
};

let send_email = async function(to, recommendation) {
  var req = unirest("POST", "https://fapimail.p.rapidapi.com/email/send");

  req.headers({
    "x-rapidapi-host": "fapimail.p.rapidapi.com",
    "x-rapidapi-key": "b82cfb314dmsh950f6794c8e24a0p1e3eecjsn458608eb9f5f",
    "content-type": "application/json",
    accept: "application/json"
  });

  req.type("json");
  req.send({
    recipient: to,
    sender: "sanchitcop19@gmail.com",
    subject: "Here's your recommendation for the day!",
    message: recommendation
  });

  req.end(function(res) {
    if (res.error) throw new Error(res.error);
  });
};

recommend();
