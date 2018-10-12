const http = require('http');
const request = require("request");
const cheerio = require('cheerio');
const fs = require('fs');
var nodemailer = require('nodemailer');
const port = process.env.PORT || 8080;

var email = process.env.email ;
var password = process.env.password;



http.createServer(async function (req, res) {

}).listen(port);

//check(dummyModel.sites[0]);
init(JSON.parse(process.env.inputModel)); //

function init(model){

    for(var i = 0;i<model.sites.length;i++){
        check(model.sites[i]);
        setInterval(check.bind(null, model.sites[i]), model.sites[i].interval*60000);
        console.log("Started " + model.sites[i].name + " checker with " + model.sites[i].interval + " minute interval");
    }
}

function check(siteModel) {

    var text = "";
    var emailText = "";
    request(siteModel, function (error, response, html) {
        switch (siteModel.variant) {
            case 0:
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    // Get text
                    //console.log("------- with request module -------")
                    //console.log($.text());
                    text = $.text();
                    // Get HTML
                    //console.log($.html());
                    emailText = "The content of the site appear to have changed.";
                }else{
                    text = "Error: " + response.statusCode;
                    emailText = text;
                }
                break;
            case 1:
                text = response.statusCode;
                emailText = "The new status Code is " + response.statusCode;
                break;
        }
        doneChecking(siteModel, text, emailText);
    });

}

function doneChecking(siteModel, text, emailText){
    let path = "/pageSaves/" + siteModel.name + ".txt";
    if (fs.existsSync(path)) {
        fs.readFile(path, function(err, data) {
            var content = data.toString('utf8');
            if(content === text){

            }else{
                fs.writeFile(path, text, function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });
                console.log("A change was detected on " + siteModel.name);
                sendMail(siteModel, emailText);
            }
        });

    }else{
        if (!fs.existsSync("/pageSaves/")) {
            fs.mkdirSync("/pageSaves/");
        }
        fs.writeFile(path, text, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file " + path + " was saved for the first time!");
        });
        sendMail(siteModel, "Started monitoring");
    }
}


function sendMail(siteModel, emailText) {

    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: email,
            pass: password
        }
    });
    let mailOptions = {
        from: '"Website Change Detector" <' + email + '>', // sender address
        to: siteModel.recipient,
        subject: siteModel.name + ' changed',
        html: 'A change of <a href=' + siteModel.url + '>' + siteModel.name + '</a> has been detected! <br />' + emailText,
        text: 'A change of ' + siteModel.name + ' ( ' + siteModel.url + ' ) has been detected! \n ' + emailText, // plain text body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
}