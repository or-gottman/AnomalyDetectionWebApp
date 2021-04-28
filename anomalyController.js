const express = require("express");
const router = express.Router(); // add this controller as router.

// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

router.route("/")
    // POST "/api/anomaly"
    .post(function (req, res) {
        res.send("/api/anomaly POST request");
    })


module.exports = router; // mapping a router and logic required to map /anomaly