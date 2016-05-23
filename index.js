var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        server: server
    }),
    port = process.env.PORT || 5000;

app.use(express.static(__dirname + "/public"));
server.listen(port, function() {
    console.log("listening on port", port);
});
var Twit = require("twit"),
    T = new Twit({
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
    })
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
        }else
        ws.send("no share event")
    });
});