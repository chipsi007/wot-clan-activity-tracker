/**
 * Created by vili on 06/12/2016.
 */
(function () {
    "use strict";

    var config = require("./config"),
        moment = require("moment"),
        request = require("request"),
        db = require("./db"),
        utils = require("./utils");

    module.exports.start = function () {
        setInterval(function () {
            db.query("SELECT * FROM Clan WHERE wot_access_token IS NOT NULL;", function (err, clans) {
                clans.forEach(function (clan) {
                    utils.getClanDetails(clan.id, ["private"], clan.wot_access_token, function (err, clanData) {
                        if (!err) {
                            console.log(clanData);
                        }

                        var expiresIn = moment(clan.expires).diff(moment(), "hours");

                        console.log("Expires in: " + expiresIn + " hours.");

                        if (expiresIn < 350) {
                            utils.renewAccessToken(clan.id);
                        }
                    });
                });
            });
        }, config.updateInterval * 1000); // minutes to milliseconds
    };
}());