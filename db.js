var mjs = require("mongojs");
console.log("Connecting DB to " + dbUrl);
var db = mjs.connect(dbUrl, ["users", "problems"]);
var ObjectId = mjs.ObjectId;

var query = function(table, query, returnFields, cb, first){
    console.log("Received query: ");
    console.log(query);
    db[table].find(query, function(err, data){
        console.log("err: " + err + ", data: " + data);
        if(err){
            cb([]);
        }
        var ret = [];
        for(var i = 0; i < data.length; i++){
            console.log("abc");
            ret.push(format(data[i], returnFields));
        }
        if(first){
            ret = ret[0];
        }
        cb(ret);
    });
}

var format = function(data, template){
    var ret = {};
    
    if(template.$all == true){
        return data;
    }
    
    for(var key in template){
        if(typeof(template[key]) == "object"){
            ret[key] = format(data[key], template[key]);
        } else if(template[key] == true){
            ret[key] = data[key];
        }
    }
    
    return ret;
}

var insert = function(table, data, cb, needData){
    console.log("Received insert: ");
    console.log(data);
    db[table].save(data, function(err, data){
        if(err){
            return cb({result: "failed"});
        }
        return cb(needData ? data : {result: "ok"});
    });
}

var update = function(table, query, data, cb){
    console.log("Received update: ");
    console.log(data);
    db[table].update(query, data, function(err, data){
        if(err){
            return cb({result: "failed"});
        }
        return cb({result: "ok"});
    });
}

var auth = function(id, token, success, failure){
    console.log("Received auth token: (" + id + ", " + token + ")");
    query("users",
          {
              _id: ObjectId(id),
              auth: token
          },
          {
              $all: true
          },
          function(data){
              if(data.length != 1){
                  failure("Failed auth check.");
              } else {
                  update("users",
                         {
                             _id: ObjectId(id),
                             auth: token
                         },
                         {
                             $set: {
                                 expires: new Date().getTime() + 30*60*1000
                             }
                         },
                         function(data){
                             success();
                         })
              }
          });
}

module.exports = {
    query: query,
    insert: insert,
    update: update,
    auth: auth,
    ObjectId: ObjectId
}