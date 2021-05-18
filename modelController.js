const express = require("express");
const nid = require("nid");
const net = require("net");
const converter = require("hex2dec");
const dateFormat = require("dateformat");
const rateLimit = require("express-rate-limit");
const DataBaseUtils = require("./utilsDB");
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
function getClient (modelID) {
    return clients.get(modelID);
}

// creates a new client (open TCP/IP connection with algoServer). Returns modelID.
const createClient = function (callback) {
    // create a 16-number unique id as modelID
    let modelID = converter.hexToDec(nid({hex:1, length: 16})());

    // create socket to communicate with algoServer
    let client = new net.Socket();
    let port = 5000;
    let host = "127.0.0.1";

    let response = false;

    // add new client to clients-map use "modelID" as key
    clients.set(modelID, client.connect(port, host));

    clients.get(modelID).on("connect", function (connection) {
        if (!response) {
            response = true;
            callback(modelID);
        }
    });

    clients.get(modelID).on("error", function (error) {
        console.log("Failure connection with algoServer (IP: " + host + "). Please check it soon.");
        clients.delete(modelID); // delete record from clients
        if (!response) {
            response = true;
            callback(-1);
        }
    });
}

// disconnect from algoServer for given client
const disconnectClient = function (client) {
    // let algoServer know the client is about to close the connection
    client.write("8\n");
    client.end();
    console.log("disconnected from algoServer");
};

// uses given client and start training it, with trainData.
const requestTrainModel = function (client, modelType, trainData, callback) {
    // client uses algoServer to request a train by a given trainData.
    if (modelType === "hybrid"){
        client.write("1\n");
    }
    else { // regression
        client.write("2\n");
    }

    // send algoServer data to train model
    trainData.forEach(function (row) {
       client.write(row + "\n"); // write trainData row by row to algoServer
    });
    client.write("done\n"); // let algoServer know client finished sending train-data

    // get back result of train function
    client.on("data", function (data) {
        callback(data); // if train succeed, sets train_result to 1
    });
}

// asked to train a given modelID with trainData, asynchronously.
const train = async function (modelID, modelType, trainData) {
    // get client object from map, based on given modelID
    let client = clients.get(modelID);

    // train model asynchronously
    await requestTrainModel(client, modelType, trainData, function (result) {
        if (result) {
            // update status of modelID document with "ready"
            DataBaseUtils.update_status(modelID, "ready", function (err) {
                if (err) {
                    // WHAT SHOULD IT DO IN CASE IT CANT UPDATE STATUS IN DB?!
                }
            });
        }
    });
}

// main route here is: /api/model
router.route("/")
    // GET "/api/model"
    .get(function (req, res) {
        try {
            // get model-id
            let modelID = req.query.model_id;

            // check if there is any record with modelID as "model_id"
            DataBaseUtils.find_withCallback(modelID, function (err, foundModel) {
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
                }
            });
        } catch (err) {
            // bad request
            res.sendStatus(400);
        }
    })
    // POST "/api/model"
    .post(apiLimiter, function (req, res) {
        let isClientOpen = false; // in case error occurred, it flag that there is a client tcp that need to end
        let isInserted = false; // in case error occurred, it flag that there are data needed to remove from DB
        // set upload time as current time in the following format: "YYYY-MM-DDTHH:mm:ssZ"
        let uploadTime = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ssp");
        // create client and get modelID (wait for a connection or error)
        let modelID;
        createClient(function (ID) {
            modelID = ID;
            // get model-type
            let modelType = req.query.model_type;
            try {
                isClientOpen = true;
                // verify support for requested model-type
                if (modelID !== -1 && (modelType === "hybrid" || modelType === "regression")) {
                    let trainData = JSON.parse(req.body.train_data);

                    // extract every property-name from trainData
                    let propertyNames = Object.keys(trainData);
                    let currentStatus = "pending"; // default value

                    // insert new model document with request data ("pending" as status)
                    DataBaseUtils.insert(modelID, modelType, uploadTime, propertyNames, currentStatus, function (err) {
                        if (!err) {
                            isInserted = true;
                            // send a train request to algoServer, asynchronously
                            let result = train(modelID, modelType, csvConverter.toCsvFormat(trainData));
                            // get status of train
                            DataBaseUtils.find_withCallback(modelID, function (err, foundModel) {
                                if (foundModel)
                                    currentStatus = foundModel.status;
                            });

                            // generate MODEL object
                            let model = {
                                model_id: modelID,
                                upload_time: uploadTime,
                                status: currentStatus
                            };

                            // return model as JSON to the client
                            res.send(JSON.stringify(model));
                        } else {
                            // couldn't store required data in DB
                            res.sendStatus(507)
                        }
                    });
                } else {
                    if (modelID === -1) {
                        // algoServer is down
                        res.sendStatus(500);
                    } else {
                        // ends modelID's client and delete it from clients
                        disconnectClient(clients.get(modelID));
                        clients.delete(modelID);
                        // model-type requested is not supported
                        res.sendStatus(400);
                    }
                }
            } catch (err) {
                if (isClientOpen && modelID !== -1) {
                    // ends modelID's client and delete it from clients
                    disconnectClient(clients.get(modelID));
                    clients.delete(modelID);
                }
                if (isInserted) {
                    // delete data about this model from DB
                    DataBaseUtils.delete(modelID);
                }
                // bad request
                res.sendStatus(400);
            }
        });
    })
    // DELETE "/api/model"
    .delete(function (req, res) {
        try {
            // get model-id
            let modelID = req.query.model_id;
            // check if there is any document with modelID as "model_id"
            DataBaseUtils.delete(modelID, function (err, deleteModel) {
                if (deleteModel) {
                    // ends modelID's client
                    let client = clients.get(modelID);
                    if (client !== undefined) {
                        disconnectClient(client);

                        // delete modelID' entity from clients
                        clients.delete(modelID);

                        // successfully deleted requested model
                        res.sendStatus(200);
                    } else {
                        // bad request
                        res.sendStatus(400);
                    }
                } else {
                    // there is no such modelID
                    res.sendStatus(404);
                }
            });
        } catch (err) {
            // bad request
            res.sendStatus(400);
        }
    })

module.exports = router; // mapping a router and logic required to map /model
// export clients
module.exports.getClient = getClient;