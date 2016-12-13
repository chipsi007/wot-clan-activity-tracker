(function () {
    "use strict";

    var config = require("./config"),
        mysql = require("mysql");

    // Pool makes sure we always have a valid connection to db.
    module.exports = mysql.createPool({
        host: config.dbHostname,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName
    });
}());