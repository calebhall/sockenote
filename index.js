const fs = require("fs");
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        server: server
    }),
    port = process.env.PORT || 5000;

// var configFile;
// configFile = __dirname + "/config.js";
// var config = JSON.parse(
//     fs.readFileSync(configFile));



app.use(express.static(__dirname + "/public"));
server.listen(port, function() {
    console.log("listening on port", port);
});
var Twit = require("twit"),
    T = new Twit({
        consumer_key: process.env.CONSUMER_KEY || config.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET || config.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN || config.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET || config.ACCESS_TOKEN_SECRET
    });

var Client = require("instagram-private-api").V1;
var device = new Client.Device("sockenote");
var storage = new Client.CookieFileStorage(__dirname + "/cookies/someuser.json");

function login_to_igrm_and_upload_image(stream, caption) {
    var username = process.env.INSTAGRAM_USERNAME;
    var password = process.env.INSTAGRAM_PASSWORD;
    Client.Session.create(device, storage, username, password)
        .then(function(session) {
            return [session, Client.Account.searchForUser(session, "instagram")]
        })
        .spread(function(session, account) {
            upload_photo_to_ingrm(session, stream, caption)
        })
}

function upload_photo_to_ingrm(session, stream, caption){
    var path = __dirname +"/test.jpg";
    fs.writeFile(path, stream, "base64", function(writeErr){
        Client.Upload.photo(session, path)
        .then(function(upload){
            return Client.Media.configurePhoto(session, upload.params.uploadId, caption);
        })
        .then(function(medium){
            fs.unlinkSync(path);
        })
    })
}
wss.on("connection", function(ws) {
    console.log("YOU SHOULDNT BE READING THIS");

    ws.on("message", function incoming(message) {
        console.log("received:", message);

        var data = JSON.parse(message);

        if (!data.hasOwnProperty("event")) {
            console.log("no event");
            ws.send("no event");
            return;

        }

        if (data.event == "share") {
            if (data.hasOwnProperty("image") && data.hasOwnProperty("tweet")) {

                T.post("media/upload", {
                    media_data: data.image
                }, function(err, res, response) {
                    var params = {
                        status: data.tweet,
                        media_ids: [res.media_id_string]
                    }
                    T.post("statuses/update", params, function(err, res, response) {})
                })
            } else
                ws.send("no image")
        } else
            ws.send("no share event")
    });
});