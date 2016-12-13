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

    router.get("/*", function (req, res) {
        responses.success(req.cookies.token, null, res);
    });

    module.exports = router;
}());