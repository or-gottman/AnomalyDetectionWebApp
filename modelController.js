const express = require("express");
const nid = require("nid");
const net = require("net");
const converter = require("hex2dec");
const dateFormat = require("dateformat");
const rateLimit = require("express-rate-limit");
const modelsCollection = require("./modelsModel");
const csvConverter = require("./DataConverter");

const router = express.Router(); // add this controller as router.

// limits 20 requests in 1000 miliseconds
const apiLimiter = rateLimit({
  windowMs: 1000, // miliseconds
  max: 20
});

// parser a given request, get access to request's fields.
let bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extended: false}));

// mapping every model to a specific client
let clients = new Map();
// export clients
exports.clients = clients;

// creates a new client (open TCP/IP connection with algoServer). Returns modelID.
const createClient = function () {
    // create a 16-number unique id as modelID
    let modelID = converter.hexToDec(nid({hex:1, length: 16})());

    // create socket to communicate with algoServer
    let client = new net.Socket();
    let port = 5000;
    let host = "3.142.220.63";

    // add new client to clients-map use "modelID" as key
    clients.set(modelID, client.connect(port, host));

    return modelID; // return unique id as modelID
}

// disconnect from algoServer for given client
const disconnectClient = function (client) {
    // let algoServer know the client is about to close the connection
    client.write("6\n");
    client.end();
    console.log("disconnected from algoServer");
};

// uses given client and start training it, with trainData.
const requestTrainModel = function (client, modelType, trainData) {
    // client uses algoServer to request a train by a given trainData.
    client.write("1\n"); // a way to write algoServer using socket
    // send algoServer data to train model
    for (let row in trainData) {
        console.log(row);
        client.write(row + "\n"); // write trainData row by row to algoServer
    }

    let train_result = 0;
    // get back result of train function
    client.on("data", function (data) {
        train_result = data;
    });
    // when request ended, return status
    return train_result;
}

// asked to train a given modelID with trainData, asynchronously.
const train = async function (modelID, modelType, trainData) {
    // get client object from map, based on given modelID
    let client = clients.get(modelID);
    let answer = await requestTrainModel(client, modelType, trainData); // train model asynchronously
    if (answer) {
        // update status of request with "answer" to models collection in modelID document
        modelsCollection.updateOne({model_id: modelID}, {$set: {status: "ready"}}, function (err) {
            // WHAT SHOULD IT DO IN CASE IT CANT UPDATE STATUS IN DB?!
        });
    }
    // WHAT SHOULD IT DO IN CASE TRAIN FUNCTION (IN algoServer) SENT BACK ERROR?!
}

// main route here is: /api/model
router.route("/")
    // GET "/api/model"
    .get(function (req, res) {
        // get model-id
        let modelID = req.query.model_id;

        // check if there is any record with modelID as "model_id"
        modelsCollection.findOne({model_id: modelID}, function (err, foundModel) {
            if (foundModel) {
                // generate MODEL object
                let model = {
                    model_id: modelID,
                    upload_time: foundModel.date,
                    status: foundModel.status
                };
                // return model as JSON to the client
                res.send(JSON.stringify(model));
            } else {
                // there is no such modelID
                res.sendStatus(404);
            }});
    })
    // POST "/api/model"
    .post(apiLimiter, function (req, res) {
        // set upload time as current time in the following format: "YYYY-MM-DDTHH:mm:ssZ"
        let uploadTime = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ssp");

        // get model-type
        let modelType = req.query.model_type;
        // verify support for requested model-type
        if (modelType === "hybrid" || modelType === "regression") {
            // create client and get modelID
            let modelID = createClient();

            // get train_data as JS object
            let trainData = csvConverter.toCsvFormat(req.body.train_data);
            console.log(trainData);
            // let trainData = JSON.parse(req.body.train_data);

            // extract every property-name from trainData
            let propertyNames = Object.keys(trainData);
            let currentStatus = "pending"; // default value

            // create new model document for models collection, with "pending" as status
            let addModel = new modelsCollection({
                model_id: modelID,
                model_type: modelType,
                date: uploadTime,
                features: propertyNames,
                status: currentStatus,
            });

            // insert "addModel" to models collection
            addModel.save()
                .then(() => {
                    // send a train request to algoServer, asynchronously
                    let result = train(modelID, modelType, trainData);

                    modelsCollection.findOne({model_id: modelID}, function (err, foundModel) {
                        if (foundModel) {
                            currentStatus = foundModel.status;
                        }
                    });

                    // generate MODEL object
                    let model = {
                        model_id: modelID,
                        upload_time: uploadTime,
                        status: currentStatus
                    };

                    // return model as JSON to the client
                    res.send(JSON.stringify(model));
                })
                .catch(() => {
                    // couldn't store required data in DB
                    res.sendStatus(507);
                })
        } else {
            // model-type requested is not supported
            res.sendStatus(400);
        }
    })
    // DELETE "/api/model"
    .delete(function (req, res) {
        // get model-id
        let modelID = req.query.model_id;

        // check if there is any document with modelID as "model_id"
        modelsCollection.findOne({model_id: modelID}, function (err, foundModel) {
            if (foundModel) {
                // delete it from models collection
                modelsCollection.deleteOne({model_id: modelID}, function (err) {
                    if (!err) {
                        // ends modelID's client
                        let client = clients.get(modelID);
                        disconnectClient(client);

                        // delete modelID' entity from clients
                        clients.delete(modelID);

                        // successfully deleted requested model
                        res.sendStatus(200);
                    }});
            } else {
                // there is no such modelID
                res.sendStatus(404);
            }
        });
    })

module.exports = router; // mapping a router and logic required to map /model