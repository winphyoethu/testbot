var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

app.get('/setup', function(req, res){
    setupGetStartedButton(res)
});

function setupGetStartedButton(res){
    var messageData = {
        "setting-type":"call_to_actions",
        "thread_state":"new_thread",
        "get_started":
            {
                "payload":"USER_DEFINED_PAYLOAD"
            }
    };
    // Start the request
    request({
        url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        form: messageData
    },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            console.log("RESPONSE :: ", response)
            res.send(body);
        } else { 
            // TODO: Handle errors
            res.send(body);
        }
    });
}

function getDataFromRgo(callback) {
    request({
        url: 'http://13.250.4.112/rgo47/public/api/web-api/product/AST8N003169_AST8N003119',
        method: 'GET',
        headers: {
            'x-language' : 'en',
            'x-api-secret-key' : '7KG2D00LQrG1tKlTruzbujKCGVME0M3aOHN0yhsdEUNyLE6NVhS',
            'x-device-id' :'1234567',
            'x-app-version' : '1.1.1',
            'x-user-id' : '83596'
        }
    },
    function(error, response, body) {
        if(!error) {
            // res.send(body);
            // console.log("RGO47 1 :: ", body)
            // return body
            callback(body)
        } else {
            // res.send(error);
        }
    });
}

app.get('/getDataFromRgo', function(req, res){
    getDataFromRgo();
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        console.log("LOG :: ",event)
        if (event.message && event.message.text) {
            if (!kittenMessage(event.sender.id, event.message.text)) {
                sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
            }
        } else if (event.postback) {
            console.log("POSTBACK :: ",event.postback);
            if(event.postback.referral) {
                urlResponseMessage(event.sender.id, event.postback.referral.ref);
            } else {
                sendMessage(event.sender.id, {text: "Of course you will like it and i know it"});
            }
        } else if(event.referral) {
            urlResponseMessage(event.sender.id, event.referral.ref)
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

var rgoData;

// send rich message with kitten
function kittenMessage(recipientId, text) {
    text = text || "";
    var values = text.split(' ');

    var getData = function(callback) {
        request({
            url: 'http://13.250.4.112/rgo47/public/api/web-api/product/AST8N003169_AST8N003119',
            method: 'GET',
            headers: {
                'x-language' : 'en',
                'x-api-secret-key' : '7KG2D00LQrG1tKlTruzbujKCGVME0M3aOHN0yhsdEUNyLE6NVhS',
                'x-device-id' :'1234567',
                'x-app-version' : '1.1.1',
                'x-user-id' : '83596'
            }
        },
        function(error, response, body) {
            if(!error) {
                console.log("RGO47 1 :: ", body);
                callback(null, body);
                rgoData = body;
            } else {
                // res.send(error);
            }
        });
    };

    console.log("RGO47 1.5 :: ", rgoData);

    var rgoData = getData(function(err, data) {
        if(err) return err;
        console.log("RGO47 2 :: ",data);
        return data;
    });

    console.log("RGO47 :: ", rgoData);

    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Kitten",
                            "subtitle": "Cute kitten picture",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show kitten"
                                }, {
                                "type": "postback",
                                "title": "I like this",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
            sendMessage(recipientId, message);
            return true;
        }
    }
    return false;
}

function urlResponseMessage(recipientId, text) {
    var values = text.split(',');

    if(values.length === 2) {
        var imageUrl = "https://d2jm25mmsa5fa0.cloudfront.net/public/uploads/products/2018/07/product_1532930733.jpg";
        var productUrl = "https://www.rgo47.com/product/"+values[1];

        message = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                        "elements": [{
                            "title": "Rgo47",
                            "subtitle": "Men Clothings",
                            "image_url": imageUrl ,
                            "default_action": {
                                "type": "web_url",
                                "url": imageUrl,
                                "webview_height_ratio": "tall",
                            },
                            "buttons": [{
                                "type": "web_url",
                                "url": productUrl,
                                "title": "Show Products",
                                "webview_height_ratio": "tall"
                                }, {
                                "type": "postback",
                                "title": "I like this",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                }
            }
        };
        sendMessage(recipientId, message);
        return true;
    }
    return false;
}
