#!/usr/bin/env node

var http = require("http");
//var exec = require("child_process").exec;

var POST = "POST";
var GET = "GET";

var apiMethods = [];

var args = process.argv;

var HASH_COUNT = 1024;

dbUrl = "mongodb://submitter:thisisasecurepassword@ds061620.mongolab.com:61620/heroku_app32406169";

port = process.env.PORT || 1337;

var db = require("./db");

var routes = {
    "/": "/index.html",
    "/problems": "/problems.html",
    "/css/style.css": "/css/style.css"
};

var __dir = "web";

http.createServer(function(req,res) {
    console.log("Request: " + req.method + " " + req.url);
    var cookies = parseCookie(res.headers.cookie);
    if(req.method == GET){
        if(req.url in routes){
            getFile(__dir + routes[req.url], function(data){
                res.write(data);
                res.end();
            });
        } else {
            res.write(404);
            res.end();
        }
    }
}).listen(port, "0.0.0.0");

console.log("Server running on port: " + port);

var getFile = function(url, cb) {
    url = url.split("..")
    url = __dir + url;
    fs.readFile(url, function(err, data) {
        if (err || !data) {
            cb("404")
            console.log("Error on "+url);
            return
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