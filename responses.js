(function () {
    "use strict";

    module.exports = {
        INVALID_PARAMETERS: {
            status: 400,
            message: "Some or all of the parameters entered were invalid."
        },
        TOKEN_INVALID: {
            status: 401,
            message: "Token missing or invalid. Please login again."
        },
        TOKEN_EXPIRED: {
            status: 401,
            message: "Token has expired, please retrieve a new token through login."
        },
        INTERNAL_ERROR: {
            status: 500,
            message: "Something went wrong. Server encountered an error while processing your request."
        },
        WGAPI_ERROR: {
            status: 500,
            message: "Error occured while requesting data from WG API."
        },
        WGAUTH_ERROR: {
            status: 500,
            message: "Something went wrong with the authentication process."
        },
        error: function (code, res) {
            res.status(code.status);
            res.json({
                status: code.status,
                message: code.message
            });
        },
        success: function (message, data, res) {
            if (data) {
                res.json({
                    status: 200,
                    message: message,
                    result: data
                });
            } else {
                res.json({
                    status: 200,
                    message: message
                });
            }
        }
    };
}());