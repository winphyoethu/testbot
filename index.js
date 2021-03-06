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
                                },
                                form : {
                                    'cart_id' : orderConfirmAry[0],
                                    'fb_id' : userProfileJson.id,
                                    'phone_number' : orderConfirmAry[1],
                                }
                            }, function (error,response, body) {
                                if(!error) {
                                    var responseJson = JSON.parse(body)

                                    if(responseJson.response.code == 200) {
                                        sendMessage(event.sender.id, {text: "​ေအာ္ဒါတင္ျပီးပါျပီ။"});
                                        sendMessage(event.sender.id, {text: "rgo မွမွာယူမွုအတြက္ အထူး​ေက်းဇူးတင္ပါတယ္။\n-----------------\nCustomer Service မွအျမန္ဆံုးဆက္သြယ္ပါလိမ့္မယ္။"});
                                    } else {
                                        sendMessage(event.sender.id, {text: "သင္မွာယူထား​ေသာ ​ေအာ္ဒါမရွိပါ။"});
                                    }
                                } else {
                                    sendMessage(event.sender.id, {text: "သင္မွာယူထား​ေသာ ​ေအာ္ဒါမရွိပါ။"});
                                }
                            });
                        }
                    });
                } else if(event.message.text.toLowerCase().includes("confirm buy")){
                    sendMessage(event.sender.id, {text: "Messenger မွ ​ေအာ္ဒါတင္ရန္​ ​ေအာက္ပါပံုစံအတိုင္း ရိုက္ထည့္ပါ\n-----------------\nOrdercode#PhoneNo\n-----------------\nEg.51245#0943134123"});
                } else if(event.message.text.toLowerCase().includes("buy") || event.message.text.toLowerCase().includes("ဝယ္") || event.message.text.toLowerCase().includes("ဝယ်") || event.message.text.toLowerCase().includes("၀ယ်") || event.message.text.toLowerCase().includes("၀ယ္")) {
                    request({
                        url: 'https://graph.facebook.com/v2.9/'+event.sender.id+'?access_token=EAAZAZCwz2xNCMBAPBQz6Bd8Y99G3RSUHZBYJuJdxULV2E4DIfk37ZBkgMpDzyXGj1NnWWeHxHFgX7SEsGRTc65RxuZBZCIDLXidZCSC7BZCZAGwxspyY1jXHIcIv4jAHXgn6ZBArPyhoUOjqCDPIg5L3PrYyEXZApw8fW88Vj3ZBHNbEfA6ZBeznW1KSZA',
                                method: 'GET'
                    },function(error, response, body) {
                        console.log("PROFILE :: ", body)

                        var userProfileJson = JSON.parse(body)

                        var quickReplyMessage = {
                            "text" : userProfileJson.first_name+" "+userProfileJson.last_name+",\nဝယ္မည္ဆိုပါက Confirm Buy ကိုႏွိပ္ပါ။\n-----------------\nမ​ဝယ္​ေတာ့ဘူးဆိုပါက Confirm Cancel ကိုႏွိပ္ပါ။",
                            "quick_replies":[
                              {
                                "content_type":"text",
                                "title":"Confirm Buy",
                                "payload":"",
                              },
                              {
                                "content_type":"text",
                                "title":"Confirm Cancel",
                                "payload":"",
                              }
                            ]
                        };
                        sendMessage(event.sender.id, quickReplyMessage);
                    });
                } else if(event.message.text.toLowerCase().includes("confirm cancel")) {
                    sendMessage(event.sender.id, {text: "သင့္​ေအာ္ဒါကို ပယ္​ဖ်က္ျပီးပါျပီ။"});
                } 
            }
        } else if (event.postback) {
            console.log("POSTBACK :: ",event.postback);
            if(event.postback.referral) {
                urlResponseMessage(event.sender.id, event.postback.referral.ref);
            } else {
                console.log("cancer :: ", event);
                if(event.postback.payload.toLowerCase().includes("get started")) {
                    sendMessage(event.sender.id, {text: "rgo47 ကိုစိတ္ဝင္စားျခင္းအတြက္ ​ေက်းဇူးတင္ပါတယ္။ သိခ်င္တာ​ေလးမ်ား​ ​ေမးထားလုိ့ရပါတယ္။ Customer Service မွမျကာမီ ​အ​ေျကာင္းျပန္ပါလိမ့္မယ္"});
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
        url: 'https://graph.facebook.com/v2.9/me/messages',
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
                    sendMessage(recipientId, {text: "rgo47 မွမွာယူျခင္းအတြက္ အထူးေက်းဇူးတင္ပါတယ္။"});
                    sendMessage(recipientId, {text: "Customer Service မွအျမန္ဆံုး စာျပန္ပါလိမ့္မယ္။ စိတ္ဝင္စားမွုအတြက္​ေက်းဇူးတင္ပါတယ္။"});
                    sendMessage(recipientId, {text: "Messenger မွ ေအာ္ဒါတင္ရန္ ေအာက္ပါ ကုဒ္ကို အသုံးျပဳပါ - "+checkOutJson.data.cart_id});

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
