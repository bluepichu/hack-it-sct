#!/usr/bin/env node

var http = require("http");

var POST = "POST";
var GET = "GET";

var apiMethods = [];

var args = process.argv;

var HASH_COUNT = 1024;

dbUrl = "mongodb://rescueapi:apipw@dogen.mongohq.com:10002/app31342165";

if(args[2] == "-l"){
    console.log("LOCAL");
    dbUrl = "mongodb://localhost:27017/rescue";
}

port = process.env.PORT || 1337;

var db = require("./db");

http.createServer(function(req,res) {
    console.log("RECEIVED REQUEST");
    console.log("\tMethod: " + req.method);
    console.log("\tURL:    " + req.url);
    for(var i = 0; i < apiMethods.length; i++){
        if(apiMethods[i].check(req.method, req.url)){
            console.log("\tFound match: " + apiMethods[i].pattern);
            res.setHeader("Content-Type", "application/json");
            try{
                result = apiMethods[i].execute(req, res);
            } catch(error) {
                console.log("caught: " + error);
                cb(res)({result: "failed", error: "Server error.  Are you missing required fields?"});
            }
            return;
        }
    }
    console.log("Returning 404.");
    res.writeHead(404);
    res.end();
}).listen(port, "0.0.0.0");

console.log("Server running on port: " + port);


function RestMethod(method, pattern, exec){
    this.method = method;
    this.pattern = pattern;
    this.exec = exec;
    
    this.check = function(reqMethod, reqUrl){
        return this.method == reqMethod && reqUrl.match(this.pattern);
    }
    
    this.execute = function(req, res){
        return exec(req, res);
    }
}

function cb(res){
    return function(data){
        res.write(JSON.stringify(data));
        res.end();
        console.log("sent " + data);
    }
}

function getPostData(req, res, cb){
    body = "";
    
    req.on("data", function(chunk){
        body += chunk;
    });
    
    req.on("end", function(){
        body = JSON.parse(body);
        cb(req, res, body);
    });
}