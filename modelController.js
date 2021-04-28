const express = require("express");
const router = express.Router(); // add this controller as router.

// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

// main route here is: /api/model
router.route("/")
    // GET "/api/model"
    .get(function (req, res) {
        res.send("/api/model GET request");
    })
    // POST "/api/model"
    .post(function (req, res) {
        // get train_data as JS object
        let trainData = JSON.parse(req.body.train_data);
        res.send("/api/model POST request");
    })
    // DELETE "/api/model"
    .delete(function (req, res) {

    })

module.exports = router; // mapping a router and logic required to map /model