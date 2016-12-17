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

    router.use(function (req, res, next) {
        if (req.cookies.token) {
            db.query("SELECT * FROM Session WHERE token = ?;", req.cookies.token,
                function (err, result) {
                    if (!err && result.length === 1) {
                        if (result[0].expires > new Date()) {
                            next();
                        } else {
                            responses.error(responses.TOKEN_EXPIRED, res);
                        }
                    } else {
                        responses.error(responses.TOKEN_INVALID, res);
                    }
                });
        } else {
            responses.error(responses.TOKEN_INVALID, res);
        }
    });

    router.get("/online", function (req, res) {
        responses.success("IM IN!", null, res);
    });

    module.exports = router;
}());