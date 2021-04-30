const express = require("express");
const router = express.Router(); // add this controller as router.

let modelsModel = require("./modelsModel");




// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

router.route("/")
    // GET "/api/models"
    .get(function (req, res) {
        modelsModel.find().then(model => {
            res.send(JSON.stringify(model));
        })
    });

module.exports = router; // mapping a router and logic required to map /models