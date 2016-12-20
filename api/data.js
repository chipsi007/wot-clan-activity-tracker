/**
 * Created by vili on 20/12/2016.
 */

(function () {
    "use strict";

    var db = require("../db"),
        responses = require("../responses"),
        moment = require("moment");

    require("moment-range");

    function getDataFromPeriod(clan, column, interval, diff, cb) {
        var moments = {
            start: moment.utc(interval.start),
            end: moment.utc(interval.end)
        };

        if (diff) {
            moments.start.subtract(interval.interval, interval.unit);
        }

        var intervals = moments.end.diff(moments.start, interval.unit) / interval.interval;
        var activity = [];

        for (var i = 0; i < intervals; i++) {
            var date = moment(moments.start).add(interval.interval * i, interval.unit);
            activity.push({
                date: date,
                value: 0
            });
        }

        db.query("SELECT * FROM Activity WHERE clan = ?;", clan, function (err, log) {
            if (!err) {
                log.forEach(function (entry) {
                    activity.forEach(function (activityInterval) {
                        var range = moment.range(activityInterval.date, moment(activityInterval.date)
                            .add(interval.interval, interval.unit));

                        if (range.contains(moment(entry.timestamp))) {
                            if (entry[column] > activityInterval.value) {
                                activityInterval.value = entry[column];
                            }
                        }
                    });
                });

                var diffArray = [];

                activity.forEach(function (entry, index) {
                    entry.date = entry.date.toDate();
                    if (diff && index !== 0) {
                        diffArray.push({
                            date: entry.date,
                            value: entry.value - activity[index - 1].value
                        });
                    }
                });

                if (diff) {
                    console.log(diffArray);
                    cb(diffArray);
                } else {
                    console.log(activity);
                    cb(activity);
                }
            } else {
                cb(false);
            }
        });
    }


    module.exports = function (req, res) {
        var interval = {
            start: req.query.start,
            end: req.query.end,
            interval: req.query.interval,
            unit: req.query.unit
        };

        getDataFromPeriod(req.user.clan, req.query.column, interval, req.query.diff, function (activity) {
                responses.success("Success", activity, res);
            });
    }

}());
