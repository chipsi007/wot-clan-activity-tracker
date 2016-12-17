(function () {
    "use strict";

    var moment = require("moment"),
        responses = require("../responses"),
        db = require("../db");

    require("moment-range");

    var getActivityFromPeriod = function (clan, start, end, interval, intervalUnit, showPlayers, cb) {
        var moments = {
            start: moment(start),
            end: moment(end)
        };

        console.log("Start: " + start);
        console.log("End: " + end);

        var intervals = moments.end.diff(moments.start, intervalUnit) / interval;
        var activity = [];

        for (var i = 0; i < intervals; i++) {
            var date = moment(moments.start).add(interval * i, intervalUnit);
            activity.push({
                date: date,
                online: []
            });
        }

        db.query("SELECT * FROM Activity WHERE clan = ?;", clan, function (err, log) {
            if (!err) {
                log.forEach(function (entry) {
                    activity.forEach(function (activityInterval) {
                        var range = moment.range(activityInterval.date, moment(activityInterval.date)
                            .add(interval, intervalUnit));

                        if (range.contains(moment(entry.timestamp))) {
                            if (entry.online_count > 0) {
                                entry.online.split(",").forEach(function (player) {
                                    if (activityInterval.online.indexOf(player) === -1) {
                                        activityInterval.online.push(player);
                                    }
                                });
                            }
                        }
                    });
                });

                activity.forEach(function (entry) {
                    entry.date = entry.date.toDate();
                    if (!showPlayers) {
                        entry.online = entry.online.length;
                    }
                });

                cb(activity);
            } else {
                cb(false);
            }
        });
    };

    module.exports = function (req, res) {
        console.log(req.user);
        getActivityFromPeriod(req.user.clan, req.query.start,
            req.query.end, req.query.interval, req.query.intervalUnit, req.query.showPlayers, function (activity) {
                responses.success("Success", activity, res);
            });
    }
}());
