(function () {
    "use strict";

    var config = require("./config"),
        db = require("./db"),
        request = require("request"),
        Promise = require("promise");

    function nullifyToken(clan) {
        db.query("UPDATE Clan SET wot_access_token = NULL, expires = NULL WHERE id = ?;",
            clan, function (err, result) {
                if (!err && result.affectedRows === 1) {
                    console.log("Access token of clan " + clan + " was set to NULL.");
                } else {
                    console.log("Error while setting clan " + clan + " token as NULL.");
                }
            });
    }

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
        getClanDetails: function (clan, fields, access_token) {
            return new Promise(function (resolve, reject) {
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
                            resolve({
                                method: "getClanDetails",
                                data: res.data[clan]
                            });
                        } else {
                            nullifyToken(clan);
                            reject(res.error);
                        }
                    } else {
                        reject(response);
                    }
                });
            });
        },
        getClanWarsData: function (clan) {
            return new Promise(function (resolve, reject) {
                var query = 'https://api.worldoftanks.eu/wot/globalmap/claninfo/' +
                    '?application_id=' + config.appId +
                    '&clan_id=' + clan;

                request(query, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var res = JSON.parse(body);

                        if (res.status === "ok") {
                            resolve({
                                method: "getClanWarsData",
                                data: res.data[clan]
                            });
                        } else {
                            reject(res.error);
                        }
                    } else {
                        reject(response);
                    }
                });
            });
        },
        getSkirmishData: function (clan, access_token) {
            return new Promise(function (resolve, reject) {
                var query = 'https://api.worldoftanks.eu/wot/stronghold/info/' +
                    '?application_id=' + config.appId +
                    '&clan_id=' + clan +
                    '&access_token=' + access_token +
                    '&fields=private.skirmish,skirmish';

                request(query, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var res = JSON.parse(body);

                        if (res.status === "ok") {
                            resolve({
                                method: "getSkirmishData",
                                data: res.data[clan]
                            });
                        } else {
                            reject(res.error);
                        }
                    } else {
                        reject(response);
                    }
                });
            });
        },
        renewAccessToken: function (clan) {
            console.log("Attempting to renew access token for clan " + clan + ".");
            db.query("SELECT * FROM Clan WHERE id = ?;", clan, function (err, clanDetails) {
                if (!err && clanDetails.length === 1) {
                    var content = 'application_id=' + config.appId +
                        '&access_token=' + clanDetails[0].wot_access_token;

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
                                console.log("Token successfully renewed for clan " + clan + ", updating db.");

                                var tokenDetails = {
                                    wot_access_token: res.data.access_token,
                                    expires: new Date(res.data.expires_at * 1000)
                                };

                                db.query("UPDATE Clan SET ? WHERE id = ?;",
                                    [tokenDetails, clan], function (err, result) {
                                        if (err || result.affectedRows !== 1) {
                                            console.log("ERROR: DB update unsuccessful!");
                                        }
                                    });

                                db.query("UPDATE Session SET ? WHERE wot_access_token = ?;",
                                    [tokenDetails, clanDetails[0].wot_access_token]);
                            } else {
                                console.log("Token renewal of clan " + clan + " failed! API query error.");
                                console.log(res.error);

                                db.query("UPDATE Clan SET wot_access_token = NULL, expires = NULL WHERE id = ?;",
                                    clan, function (err, result) {
                                        if (!err && result.affectedRows === 1) {
                                            console.log("Token was set as NULL to db.");
                                        }
                                    });
                            }
                        } else {
                            console.log("Token renewal of clan " + clan + " failed! API Query unsuccessful.");
                            console.log(response);
                        }
                    });
                } else {
                    console.log("Renewal error! Clan not found from DB!")
                }
            });
        }
    }
}());
