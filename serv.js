#!/usr/bin/env node

var http = require("http");
var fs = require("fs");
var hbs = require("handlebars");
var spawn = require("win-spawn");
var sha = require("sha1");
var crypto = require("crypto");

var POST = "POST";
var GET = "GET";

var apiMethods = [];

var args = process.argv;

var HASH_COUNT = 4;

var START_TIME = 1418412600000;

dbUrl = "mongodb://submitter:thisisasecurepassword@ds061620.mongolab.com:61620/heroku_app32406169";

port = process.env.PORT || 1337;

if(args[2] == "-l"){
    console.log("LOCAL");
    dbUrl = "mongodb://localhost:27017/hack-it";
}

var db = require("./db");

var routes = {
    "/": "/index.html",
    "/problems": "/problems.html",
    "/rules": "/rules.html",
    "/scoreboard": "/scoreboard.html"
};

var __dir = "web";

http.createServer(function(req,res) {
    console.log("Request: " + req.method + " " + req.url);
    url = req.url;
    var cookies = parseCookie(req.headers.cookie);
    if(req.method == GET){
        if(url in routes){
            url = routes[url]; 
        }

        if(url == "/index.html"){
            getHbs(__dir + url, {}, function(data){
                res.writeHead(200, {"Content-Type": "text/html"});
                res.write(data);
                res.end();
            });
        } else if(url == "/problems.html"){
            db.query("problems", {}, {$all: true}, function(dat){
                if(new Date() < START_TIME){
                    dat = [];
                }
                getHbs(__dir + url, {problems: dat, loginRequired: !cookies.token || !cookies.username}, function(data){
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.write(data);
                    res.end();
                });
            });
        } else if(url == "/scoreboard.html"){
            db.query("users", {}, {
                username: true,
                sum: true,
                scores: true
            },
                     function(dat){
                dat.sort(function(a, b){
                    return b.sum - a.sum;
                });
                getHbs(__dir + url, {users: dat}, function(data){
                    res.writeHead(200, {"Content-Type": "text/html"});
                    res.write(data);
                    res.end();
                });
            });
        } else {
            try{
                getFile(__dir + url, function(data){
                    if(data == "404"){
                        res.writeHead(404, {});
                        res.end();
                    } else {
                        res.writeHead(200, {"Content-Type": "text/html"});
                        res.write(data);
                        res.end();
                    }
                });
            } catch(e){
                res.writeHead(404, {});
                res.end();
            }
        }
    } else if(req.method == "POST"){
        getPostData(req, res, function(req, res, postData){
            if(url == "/register"){
                if(!postData.username || !postData.password){
                    res.writeHead(500, {});
                    res.write("Username and/or password not provided.");
                    res.end();
                }
                db.query("users", {username: postData.username}, {$all: true}, function(userMatch){
                    if(userMatch.length > 0){
                        console.log(userMatch);
                        res.writeHead(500, {});
                        res.write("User with that username already exists.");
                        res.end();
                    } else {
                        salt = crypto.randomBytes(256).toString("base64");
                        hash = body.password;
                        token = crypto.randomBytes(16).toString("base64");

                        for(var i = 0; i < HASH_COUNT; i++){
                            hash = sha(hash + salt);
                        }

                        db.insert("users", 
                                  {
                            username: body.username,
                            password: hash,
                            salt: salt,
                            auth: token,
                            sum: 0,
                            scores: [{score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}, {score: 0, failed: 0}]
                        },
                                  function(){
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.write(JSON.stringify({ok: true, token: token}));
                            res.end();
                        });
                    }
                });
            } else if(url == "/login"){
                db.query("users", {username: postData.username}, {$all: true}, function(userMatch){
                    if(userMatch.length != 1){
                        res.writeHead(200, {"Content-Type": "application/json"});
                        res.write(JSON.stringify({ok: false, message: "User not found."}));
                        res.end();
                        return;
                    }

                    salt = userMatch[0].salt;
                    hash = body.password;
                    token = crypto.randomBytes(16).toString("base64");

                    for(var i = 0; i < HASH_COUNT; i++){
                        hash = sha(hash + salt);
                    }

                    if(userMatch[0].password == hash){
                        db.update("users", {username: postData.username}, {$set: {token: token}}, function(){
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.write(JSON.stringify({ok: true, token: token}));
                            res.end();
                        });
                    }
                });
            } else if(url == "/submit"){
                db.query("users", {username: cookies.username, token: cookies.token}, {$all: true}, function(data){
                    if(data.length != 1){
                        res.writeHead(500, {});
                        res.write("Invalid credentials.");
                        res.end();
                        return;
                    }

                    validate(postData.problem + "Validator", postData.test, function(exitCode){
                        if(exitCode == 0){
                            test(postData.problem + "Correct", postData.test, function(modelOutput, modelErr){
                                test(postData.problem + "Incorrect", postData.test, function(incorrectOutput, incorrectErr){
                                    console.log(exitCode + " " + modelOutput + " " + incorrectOutput);
                                    var correct = false;
                                    if(incorrectErr || modelOutput != incorrectOutput){
                                        correct = true;
                                    }
                                    db.query("problems", {file: postData.problem}, {$all: true}, function(problemData){
                                        console.log(problemData);
                                        console.log(cookies);
                                        if(correct){
                                            console.log(data);
                                            var incorrect = data[0].scores[problemData.index].failed;
                                            var score = 1 - (new Date() - START_TIME) * 3.33333333e-7 - .1 * incorrect;
                                            score = parseFloat(score.toFixed(4));
                                            var set = {};
                                            set["scores." + problemData.index + ".score"] = score;
                                            set["sum"] = data[0].sum + score;
                                            db.update("users", {username: cookies.username, token: cookies.token}, {$set: set}, function(){});
                                        } else {
                                            var inc = {};
                                            inc["scores." + problemData.index + ".failed"] = 1;
                                            db.update("users", {username: cookies.username, token: cookies.token}, {$inc: inc}, function(){});
                                        }
                                    }, true);
                                    res.write(JSON.stringify({correct: correct}));
                                    res.end();
                                });
                            });
                        } else {
                            res.end();
                        }
                    });
                });
            } else {
                res.writeHead(404, {});
                res.end();
            }
        });
    } else {
        console.log("404ing");
        res.writeHead(404, {});
        res.end();
    }
}).listen(port, "0.0.0.0");

console.log("Server running on port: " + port);

var getHbs = function(url, data, cb){
    getFile(url, function(dat){
        if(dat == "404"){
            return "404";
        } else {
            template = hbs.compile("" + dat);
            cb(template(data));
        }
    });
}

var getFile = function(url, cb) {
    console.log(url);
    fs.readFile(url, function(err, data) {
        if (err || !data) {
            cb("404");
            console.log("Error on "+url);
            return;
        }
        cb(data);
    })
}

var parseCookie = function(cookieString) {
    if (!cookieString) {
        return {}
    }
    var spl = cookieString.split(";");
    var ret = {}
    for (var i in spl) {
        var sple = spl[i].split("=");
        var key = sple[0];
        var value = spl[i].split(key+"=")[1];
        if (key[0] == " ") {
            key = key.substr(1)
        }
        ret[key] = value;
    }
    return ret;
}

var getMime = function(str) {
    if (!str) {
        return "text/plain";
    }
    str = str.toLowerCase();
    switch (str) {
        case "html":
            return "text/html"
            case "txt":
            return "text/plain"
            case "js":
        case "min":
        case "json":
            return "application/javascript"
            case "gif":
            return "image/gif"
            case "jpeg":
        case "jpg":
            return "image/jpeg"
            case "png":
        case "bmp":
        case "ico":
            return "image/png"
            case "css":
            return "text/css"
            case "xml":
            return "text/xml"
            default:
            return "text/html"

    }
}

hbs.registerHelper("decimal", function(data){
    if(data == 0 || typeof(data) != "number"){
        return "--";
    } else {
        return data.toFixed(4);
    }
});

var getPostData = function(req, res, cb){
    body = "";

    req.on("data", function(chunk){
        body += chunk;
    });

    req.on("end", function(){
        body = JSON.parse(body);
        cb(req, res, body);
    });
}

var validate = function(file, test, cb){
    console.log("Validating " + file);
    var proc = spawn("java -cp solutions " + file, [], {stdio: "pipe"});
    proc.stdin.write(test);
    proc.stdin.end();

    proc.on('close', function (code) {
        cb(code);
    });
}

var test = function(file, test, cb){
    console.log("Testing " + file);
    var proc = spawn("java -cp solutions " + file, [], {stdio: "pipe"});
    proc.stdin.write(test);
    proc.stdin.end();

    var model = "";

    proc.stdout.on('data', function (data) {
        model += data;
    });

    proc.stderr.on('data', function (data) {
        console.log("err");
        console.log(data.toString());
        model = "ERROR";
    });

    proc.on('close', function (code) {
        cb(model);
    });
}