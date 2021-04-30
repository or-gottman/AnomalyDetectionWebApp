const express = require("express");
const router = express.Router(); // add this controller as router.
const modelController = require("./modelController");
const DataBaseUtils = require("./utilsDB");
const collectionModel = require("./modelsModel")
const clients = modelController.clients;   // obtain the map of the clients.
const ERROR_400 = 400;

class FeaturesWrapper {
    constructor(features) {
        this.features = features;
    }
    // returns true if and only if this.features is a subset of other
    isSubsetOf(other) {
        return this.features.every(function(val) {
            return other.indexOf(val) >= 0;
        });
    }
}

class Span
{
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

/**
 * function returns a map such that: <feature,spans>
 * each feature maps to the spans that were calculated by the algorithm.
 * @param timeSteps
 */
const createAnomalies = function(timeSteps){
    // ********* need to implement according to the given format *************
    let map = new Map();
    return map;
};


class Anomaly {
    constructor(map, reason) {
        this.anomalies = map;
        this.reason = reason;
    }
}

// parser a given request, get access to request's fields.
let bodyParser = require("body-parser");
// router.use(bodyParser.urlencoded({extended: false}));
router.use(bodyParser.json())

router.route("/")
    // POST "/api/anomaly"
    .post( function (req, res) {
        let modelId = req.query.model_id;       // obtain id from query
        //let client = clients.get(modelId);      // get client from the clients map. use later in the code to connect to the algo server !
        let predictData = req.body.predict_data;        // obtain clients data from request
        let model = DataBaseUtils.find(modelId);        // obtain model from the database
       // console.log(model);
        let modelStatus = model.status;     // extract the status of the model
        let ready = modelStatus === "ready";        // verify model status
        let requestFeatures = Object.keys(predictData);      // obtain the names of the attributes from the request
        let trainedFeatures = new FeaturesWrapper(model.features);      // parse the trained features to an array and wrap it in a wrapper class
        let specifiedCorrectFeatures = trainedFeatures.isSubsetOf(requestFeatures);
        if (!specifiedCorrectFeatures) {        // verify that the request contains the feature   s that were trained when the model was uploaded
            res.sendStatus(ERROR_400);
        }
        if (ready)      // if model was trained and data from the algorithm is ready to be used.
        {
            //......................................................................
            // need to receive a string/array of time steps back from the algoServer
            let timeStepsAnswerFromServer = ""
            //.......................  //  probably need to change !!!!...........................................
            let timeSteps = timeStepsAnswerFromServer.split("\n");      // need to check with Yahel what is the correct format
            //....................................................................................................
            let anomalies = createAnomalies(timeSteps);       // do according to given format
            let anomaly = new Anomaly(anomalies, "Any");       // create JSON object to return to the client
            res.send(JSON.stringify(anomaly));
        }
        // model is still pending -> error
        else{
            // need to check how to use redirect
            res.redirect("/api/model?model_id=${modelId}");
        }
    });



module.exports = router; // mapping a router and logic required to map /anomaly