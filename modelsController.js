const express = require("express");
const router = express.Router(); // add this controller as router.

let modelsModel = require("./modelsModel");




// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

router.route("/")
    // GET "/api/models"
    .get(function (req, res) {
        let models = [];
        modelsModel.find().then(foundModels => {
            foundModels.forEach(foundModel => {
                // render every model in database to MODEL structure
                let model = {
                    model_id: foundModel.model_id,
                    upload_time: foundModel.date,
                    status: foundModel.status
                };
                models.push(model);
            });
            // send all models stored in the database.
            res.send(JSON.stringify(models));
        })
    });

module.exports = router; // mapping a router and logic required to map /models