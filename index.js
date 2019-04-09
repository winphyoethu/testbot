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
    // var messageData = {
    //     "setting_type":"call_to_actions",
    //     "thread_state":"new_thread",
    //     "call_to_actions":[
    //         {
    //             "payload":"USER_DEFINED_PAYLOAD"
    //         }
    //         ]
    // };
    var messageData = {
        "get_started":{
            "payload":"get started"
        }
    };
    // Start the request
    request({
        url: 'https://graph.facebook.com/v2.9/me/messenger_profile?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
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

app.get('/getDataFromRgo', function(req, res){
    getDataFromRgo();
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        console.log("LOG :: ",event);
        if (event.message && event.message.text) {
            if (!kittenMessage(event.sender.id, event.message.text)) {
                if(event.message.text.split('#').length == 2) {
                    request({
                        url: 'https://graph.facebook.com/v2.9/'+event.sender.id+'?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
                                method: 'GET'
                    },function(error, response, body) {
                        if(!error) {
                            var userProfileJson = JSON.parse(body)
                            var orderConfirmAry = event.message.text.split('#');
                            request({
                                url: 'http://54.255.170.78/rgo47/public/api/messenger/checkout',
                                method: 'POST',
                                headers: {
                                    'x-language' : 'en',
                                    'x-api-secret-key' : '7KG2D00LQrG1tKlTruzbujKCGVME0M3aOHN0yhsdEUNyLE6NVhS',
                                    'x-device-id' :'messenger',
                                    'x-app-version' : '7.0',
                                    'x-user-id' : '0',
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                                form : {
                                    'cart_id' : orderConfirmAry[0],
                                    'fb_id' : userProfileJson.id,
                                    'phone_number' : orderConfirmAry[1],
                                }
                            }, function (error,response, body) {
                                if(!error) {
                                    sendMessage(event.sender.id, {text: "Thank you so much for your order.\n-----------------\nCustomer service will contact you very soon."});
                                }
                            });
                            sendMessage(event.sender.id, quickReplyMessage);
                        }
                    });
                } else if(event.message.text.toLowerCase().includes("confirm buy")){
                    sendMessage(event.sender.id, {text: "Dear Csutomer, please type in this format to order.\n\n-----------------\nOrdercode#PhoneNo\n-----------------\nEg.51245#0943134123"});
                } else if(event.message.text.toLowerCase().includes("buy")) {
                    request({
                        url: 'https://graph.facebook.com/v2.9/'+event.sender.id+'?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
                                method: 'GET'
                    },function(error, response, body) {
                        console.log("PROFILE :: ", body)

                        var userProfileJson = JSON.parse(body)

                        var quickReplyMessage = {
                            "text" : userProfileJson.first_name+" "+userProfileJson.last_name+", please choose option to buy",
                            "quick_replies":[
                              {
                                "content_type":"text",
                                "title":"Confirm Buy",
                                "payload":"",
                              },
                              {
                                "content_type":"text",
                                "title":"Cancel",
                                "payload":"",
                              }
                            ]
                        };
                        sendMessage(event.sender.id, quickReplyMessage);
                    });
                } else {
                    sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
                }
            }
        } else if (event.postback) {
            console.log("POSTBACK :: ",event.postback);
            if(event.postback.referral) {
                urlResponseMessage(event.sender.id, event.postback.referral.ref);
            } else {
                console.log("cancer :: ", event);
                if(event.postback.payload.toLowerCase().includes("get started")) {
                    sendMessage(event.sender.id, {text: "Thank you for contacting with us. Please leave anything you would like to know. Customer service will reach you very soon!"});
                } else {
                    sendMessage(event.sender.id, {text: "Of course you will like it and i know it"});
                }
            }
        } else if(event.referral) {
            urlResponseMessage(event.sender.id, event.referral.ref);
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

    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);
            var message = {
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

    request({
        url: 'https://graph.facebook.com/v2.9/'+recipientId+'?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
        method: 'GET'
    }, function(error, response, body) {
        if(!error) {
            console.log("userprofile :: ", body);
            var userProfileJson = JSON.parse(body);

            request({
                url: 'http://54.255.170.78/rgo47/public/api/v2/messenger-cart',
                method: 'POST',
                headers: {
                    'x-language' : 'en',
                    'x-api-secret-key' : '7KG2D00LQrG1tKlTruzbujKCGVME0M3aOHN0yhsdEUNyLE6NVhS',
                    'x-device-id' :'messenger',
                    'x-app-version' : '7.0',
                    'x-user-id' : values[4],
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    'customer_id' : values[3],
                    'customer_phone' : values[4],
                    'fb_id' : userProfileJson.id,
                    'fb_username': userProfileJson.first_name+" "+userProfileJson.last_name,
                    'product_id': values[1]
                }
            }, function(error, response, body) {
                var checkOutJson = JSON.parse(body);
                console.log("post checkout :: ", body);
                if(!error) {
                    sendMessage(recipientId, {text: "Order has been placed. Thanks for using messenger check out!"});
                    sendMessage(recipientId, {text: "Customer service will reach you soon. Thank you for your interest"});
                    sendMessage(recipientId, {text: "To confrim check out, please use this order code - "+checkOutJson.data.cart_id});

                    request({
                        url: 'http://54.255.170.78/rgo47/public/api/v2/product/'+values[1]+'/show',
                        method: 'GET',
                        headers: {
                            'x-language' : 'en',
                            'x-api-secret-key' : '7KG2D00LQrG1tKlTruzbujKCGVME0M3aOHN0yhsdEUNyLE6NVhS',
                            'x-device-id' :'messenger',
                            'x-app-version' : '7.0',
                            'x-user-id' : values[4]
                        }
                    }, function(error, response, body) {
                        console.log("show error :: ", body);
                        if(!error) {
                            if(values.length === 5) {
                                var productUrl = "https://www.rgo47.com/api/v2/product/"+values[2];
                                var jsonData = JSON.parse(body);

                                var message = {
                                    "attachment": {
                                        "type": "template",
                                        "payload": {
                                            "template_type": "generic",
                                                "elements": [{
                                                    "title": "Rgo47",
                                                    "subtitle": jsonData.data.name,
                                                    "image_url": jsonData.data.feature_image,
                                                    "default_action": {
                                                        "type": "web_url",
                                                        "url": jsonData.data.feature_image,
                                                        "webview_height_ratio": "tall",
                                                    },
                                                    "buttons": [{
                                                        "type": "web_url",
                                                        "url": productUrl,
                                                        "title": "Show Products",
                                                        "webview_height_ratio": "tall"
                                                        }, {
                                                        "type": "element_share",
                                                        "share_contents": { 
                                                            "attachment": {
                                                            "type": "template",
                                                            "payload": {
                                                                    "template_type" : "generic",
                                                                    "elements": [{
                                                                        "title": "Rgo47",
                                                                        "subtitle": jsonData.data.name,
                                                                        "image_url": jsonData.data.feature_image,
                                                                        "default_action": {
                                                                            "type": "web_url",
                                                                            "url": jsonData.data.feature_image,
                                                                            "webview_height_ratio": "tall",
                                                                        },
                                                                        "buttons" : [{
                                                                            "type": "web_url",
                                                                            "url": productUrl,
                                                                            "title": "Show Products",
                                                                            "webview_height_ratio": "tall"
                                                                        }]
                                                                    }]
                                                                }
                                                            }
                                                        }
                                                    }]
                                                }]
                                        }
                                    }
                                };
                                sendMessage(recipientId, message);
                                return true;
                            }
                            return false;                           
                        } else {
                            console.log("ERROR :: ", error);
                        }
                    });  
                }
            });
        }
    });

}
