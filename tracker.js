/**
 * Created by vili on 06/12/2016.
 */
(function () {
    "use strict";

    var config = require("./config"),
        moment = require("moment"),
        db = require("./db"),
        utils = require("./utils"),
        Promise = require("promise");

    module.exports.start = function () {
        setInterval(function () {
            db.query("SELECT * FROM Clan WHERE wot_access_token IS NOT NULL;", function (err, clans) {
                clans.forEach(function (clan) {
                    var expiresIn = moment(clan.expires).diff(moment(), "hours");

                    var promises = [];
                    promises.push(utils.getClanDetails(clan.id, ["private"], clan.wot_access_token));
                    promises.push(utils.getClanWarsData(clan.id));
                    promises.push(utils.getSkirmishData(clan.id, clan.wot_access_token));

                    Promise.all(promises).then(function (results) {
                        var log = {
                            clan: clan.id
                        };

                        results.forEach(function (result) {
                            switch (result.method) {
                                case "getClanDetails":
                                    log.online = result.data.private.online_members.join();
                                    log.online_count = result.data.private.online_members.length;
                                    break;
                                case "getSkirmishData":
                                    var skirmish = result.data.skirmish;

                                    log.skirmish_battles_total = skirmish.battles_count;
                                    log.skirmish_wins_total = skirmish.battles_wins;
                                    log.skirmish_boxes_total = skirmish.total_resource_capture;

                                    var skirmish_private = result.data.private.skirmish;

                                    log.skirmish_battles_10 = skirmish_private.absolute_battles_count;
                                    log.skirmish_boxes_10 = skirmish_private.absolute_resource_capture;

                                    log.skirmish_battles_8 = skirmish_private.champion_battles_count;
                                    log.skirmish_boxes_8 = skirmish_private.champion_resource_capture;

                                    log.skirmish_battles_6 = skirmish_private.middle_battles_count;
                                    log.skirmish_boxes_6 = skirmish_private.middle_resource_capture;
                                    break;
                                case "getClanWarsData":
                                    var ratings = result.data.ratings;

                                    log.cw_elo_10 = ratings.elo_10;
                                    log.cw_elo_8 = ratings.elo_8;
                                    log.cw_elo_6 = ratings.elo_6;

                                    var stats = result.data.statistics;

                                    log.cw_provinces = stats.provinces_count;
                                    log.cw_battles_total = stats.battles;
                                    log.cw_wins_total = stats.wins;

                                    log.cw_battles_10 = stats.battles_10_level;
                                    log.cw_wins_10 = stats.wins_10_level;

                                    log.cw_battles_8 = stats.battles_8_level;
                                    log.cw_wins_8 = stats.wins_8_level;

                                    log.cw_battles_6 = stats.battles_6_level;
                                    log.cw_wins_6 = stats.wins_6_level;
                                    break;
                            }
                        });

                        db.query("INSERT INTO Activity SET ?;", log, function (err, result) {
                            if (!err) {
                                console.log("Activity log entry for clan " + clan.id + " created. " +
                                    "Token expires in " + expiresIn + " hours.");
                            } else {
                                console.log("Error while inserting clan " + clan.id + " activity log to db");
                            }
                        });
                    }, function (err) {
                        console.log("Error occured while logging clan " + clan.id + " activity:");
                        console.log(err);
                    });

                    if (expiresIn < 24) {
                        utils.renewAccessToken(clan.id);
                    }
                });
            });
        }, config.updateInterval * 1000 * 60); // minutes to milliseconds
    };
}());