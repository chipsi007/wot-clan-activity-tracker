(function () {
    "use strict";

    var config = require("./config"),
        request = require("request");

    module.exports = {
        getPlayerDetails: function (account, fields, cb) {
            var query = 'https://api.worldoftanks.eu/wot/account/info/' +
                '?application_id=' + config.appId +
                '&account_id=' + account;

            if (fields) {
                query += '&fields=' + fields.join();
            }

            request(query, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var res = JSON.parse(body);

                    if (res.status === "ok") {
                        cb(null, res.data[account]);
                    } else {
                        cb(res.error);
                    }
                } else {
                    cb(response);
                }
            });
        },
        getClanDetails: function (clan, fields, access_token, cb) {
            var query = 'https://api.worldoftanks.eu/wgn/clans/info/' +
                '?application_id=' + config.appId +
                '&clan_id=' + clan;

            if (access_token) {
                query += '&access_token=' + access_token +
                    '&extra=private.online_members';
            }

            if (fields) {
                query += '&fields=' + fields.join();
            }

            request(query, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var res = JSON.parse(body);

                    if (res.status === "ok") {
                        cb(null, res.data[clan]);
                    } else {
                        cb(res.error);
                    }
                } else {
                    cb(response);
                }
            });
        },
        renewAccessToken: function (token, cb) {
            var content = 'application_id=' + config.appId +
                '&access_token=' + token;

            request({
                headers: {
                    'Content-Length': content.length,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: 'https://api.worldoftanks.eu/wot/auth/prolongate/',
                body: content,
                method: 'POST'
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var res = JSON.parse(body);

                    if (res.status === "ok") {
                        console.log("Token successfully renewed");
                        cb(null, res.data.access_token);
                    } else {
                        console.log("Token renewal failed!");
                        cb(res.error);
                    }
                } else {
                    cb(response);
                }
            });
        }
    }
}());
