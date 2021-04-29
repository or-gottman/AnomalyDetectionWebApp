const express = require("express");
const nid = require('nid');
const converter = require("hex2dec");
const dateFormat = require("dateformat");
const rateLimit = require("express-rate-limit");

const router = express.Router(); // add this controller as router.

// limits 20 requests in 2000 miliseconds
const apiLimiter = rateLimit({
  windowMs: 2000, // miliseconds
  max: 20
});

// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

// mapping every model to a specific client
let clients = new Map();
// export clients
exports.clients = clients;

// creates a new client (open TCP/IP connection with server). Returns modelID.
const createClient = function () {
    // SOME CODE TO OPEN A SOCKET WITH SERVER
    let client;
    let modelID = converter.hexToDec(nid({hex:1, length: 16})()); // create a 16-number unique id as modelID
    // add new client to clients-map use "modelID" as key
    clients[modelID] = client;
    return modelID; // return unique id as modelID
}

// uses given client and start training it, with trainData.
const requestTrainModel = function (client, modelType, trainData) {
    // client uses server to request a train by a given trainData.
    // NEED TO ADD CODE TO USE TRAIN FUNCTION

    let result = true; // RESULT FROM TRAIN FUNCTION SHOULD BE 1 (TRUE) OR 0 (FALSE)
    // when request ended, return status
    if (result) {
        return "ready";
    }
    return "error";
}

// asked to train a given modelID with trainData, asynchronously.
const train = async function (modelID, modelType, trainData) {
    // get client object from map, based on given modelID
    let client = clients.get(modelID);
    let answer = await requestTrainModel(client, modelType, trainData); // train model asynchronously
    if (answer === "ready") {
        // SET STATUS OF REQUEST WITH answer (UPDATE DB)
    }
    // WHAT SHOULD IT DO IN CASE TRAIN FUNCTION (IN SERVER) SENT BACK ERROR?!
}


// main route here is: /api/model
router.route("/")
    // GET "/api/model"
    .get(function (req, res) {
        // get model-id
        let modelID = req.query.model_id;

        let isExist = true; // CHECK IF THERE IS ID LIKE modelID IN DB IF THERE IS ENTER TO IF
        if (isExist) {
            // FIND IN DB THE DATA ABOUT THE GIVEN modelID AND INSERT IT INTO THE FOLLOWING OBJECT

            // generate MODEL object
            let model = {
                model_id: modelID,
                upload_time: 1111, // GET FROM DB
                status: "default" // GET STATUS FROM DB
            };

            // return model as JSON to the client
            res.send(JSON.stringify(model));
        } else {
            // there is no such modelID
            res.sendStatus(404);
        }
    })
    // POST "/api/model"
    .post(apiLimiter, function (req, res) {
        // set upload time as current time in the following format: "YYYY-MM-DDTHH:mm:ssZ"
        let uploadTime = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ssp");

        // create client and get modelID
        let modelID = createClient();

        // get model-type
        let modelType = req.query.model_type;
        // verify support for requested model-type
        if (modelType === "hybrid" || modelType === "regression") {
            // get train_data as JS object
            let trainData = JSON.parse(req.body.train_data);
            // extract every property-name from trainData
            let propertyNames = Object.keys(trainData);

            // INSERT NEW modelID WITH RELEVANT DATA TO DB (STATUS WILL BE "pending")

            // send a train request to server, asynchronously
            let result = train(modelID, modelType, trainData);

            // generate MODEL object
            let model = {
                model_id: modelID,
                upload_time: uploadTime,
                status: "default"// GET STATUS FROM DB
            };

            // return model as JSON to the client
            res.send(JSON.stringify(model));
        } else {
            // model-type requested is not supported
            res.sendStatus(400);
        }
    })
    // DELETE "/api/model"
    .delete(function (req, res) {
        // get model-id
        let modelID = req.query.model_id;

        let isExist = true; // CHECK IF THERE IS ID LIKE modelID IN DB IF THERE IS ENTER TO IF
        if (isExist) {
            // FIND IN DB THE DATA ABOUT THE GIVEN modelID AND DELETE IT
            // CLOSE CLIENT IN clients[modelID].

            // delete modelID from clients
            clients.delete(modelID);

            // send success status to client
            res.sendStatus(200);
        } else {
            // there is no such modelID
            res.sendStatus(404);
        }
    })

module.exports = router; // mapping a router and logic required to map /model