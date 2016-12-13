/**
 * Created by vili on 06/12/2016.
 */
(function () {
    "use strict";

    var config = require("../config"),
        moment = require("moment"),
        express = require("express"),
        router = express.Router(),
        request = require("request"),
        db = require("../db"),
        utils = require("../utils"),
        jwt = require("jwt-simple"),
        responses = require("../responses");

    router.get("/start", function (req, res) {
        db.query("INSERT INTO Session VALUES();", function (err, result) {
            if (!err) {
                var authUrl = "https://api.worldoftanks.eu/wot/auth/login/" +
                    "?application_id=" + config.appId +
                    "&redirect_uri=" + config.rootAddress + "/auth/finish/?session=" +
                    result.insertId;

                res.redirect(authUrl);
            } else {
                responses.error(responses.INTERNAL_ERROR, res);
            }
        });
    });

    router.get("/finish", function (req, res) {
        if (req.query.status === "ok") {
            utils.getPlayerDetails(req.query.account_id, ["clan_id"], function (err, result) {
                if (!err) {
                    var expires = moment().add(7, "days").toDate();

                    var token = jwt.encode({
                        session: req.query.session,
                        expires: expires
                    }, config.tokenSecret);

                    var session = {
                        clan: result.clan_id,
                        wot_access_token: req.query.access_token,
                        account: req.query.account_id,
                        player: req.query.nickname,
                        token: token,
                        expires: expires
                    };

                    db.query("UPDATE Session SET ? WHERE id = ?;", [session, req.query.session],
                        function (err, result) {
                            if (!err && result.affectedRows === 1) {
                                var cookieConfig = {maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true};
                                res.cookie('token', session.token, cookieConfig);
                                res.redirect(config.rootAddress);

                                db.query("SELECT * FROM Clan WHERE id = ?;", session.clan, function (err, results) {
                                    if (!err && results.length === 1 && !results[0].wot_access_token) {
                                        db.query("UPDATE Clan SET ? WHERE id = ?",
                                            [{
                                                wot_access_token: session.wot_access_token,
                                                expires: session.expires
                                            }, session.clan]);
                                    } else if (!err && results.length === 0) {
                                        utils.getClanDetails(session.clan, ["name", "tag"], null, function (err, details) {
                                            if (!err) {
                                                db.query("INSERT INTO Clan SET ?;", {
                                                    id: session.clan,
                                                    wot_access_token: session.wot_access_token,
                                                    tag: details.tag,
                                                    name: details.name,
                                                    expires: session.expires
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                responses.error(responses.INTERNAL_ERROR, res);
                            }
                        });
                } else {
                    responses.error(responses.WGAPI_ERROR, res);
                }
            });
        } else {
            responses.error(responses.WGAUTH_ERROR, res);
        }
    });

    module.exports = router;
}());