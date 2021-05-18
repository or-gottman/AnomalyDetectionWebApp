const express = require("express");
const router = express.Router(); // add this controller as router.

const DataBaseUtils = require("./utilsDB");
const collectionModel = require("./modelsModel");
const csvConverter = require("./DataConverter");
//const modelController = require("./modelController");
//const clients = modelController.clients;   // obtain the map of the clients.
const modelController = require("./modelController");




const ERROR_400 = 400;

/**
 * The function iterates through each feature in the request and verifies if
 * the feature was trained when the model was uploaded, if so adds the feature to the return value.
 * @param predictData       as an object {key1 : value1 , key2 : value2 ,...}
 * @param requestFeatures   as an array of the keys of the predictData
 * @param trainData         as an array of the trained features
 * @returns {{}}            an object containing the relevant features.
 */
const removeRedundantFeatures= function (predictData,requestFeatures, trainData) {
    let updatedDataToPredict = {};
    requestFeatures.forEach((feature) =>
    {
        if (trainData.includes(feature)) {
            updatedDataToPredict[feature] = predictData[feature];       // assigns the data from the clients req for this specific feature.
        }
    });
    return updatedDataToPredict;
}

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

/**
 *  sends a request to the algo server to detect anomalies receives the anomalies back.
 * @param client
 * @param anomalies
 * @param callback
 */
const sendAnomaliesGetResults = function(modelType,client, anomalies, callback) {
    anomalies.forEach(function(row){
        client.write(row + "\n");
    });
    client.write("done\n");

    let x = false;
    client.on("data", function(data) {
        if (data.toString() === "true"){
            client.write("4\n");
            x = true;
            console.log(x)
            // get anomalies results. data will ended with "Done."
        }
        else if (x){
            console.log("in else if")
            data = data.toString();
            callback(data);
        }
    });
}




// parser a given request, get access to request's fields.
let bodyParser = require("body-parser");
 router.use(bodyParser.urlencoded({extended: false}));
//router.use(bodyParser.json())

router.route("/")
    // POST "/api/anomaly"
    .post( function (req, res) {
        let modelId = req.query.model_id;       // obtain id from query
        let client = modelController.getClient(modelId);
     //   let predictData = req.body.predict_data;        // obtain clients data from request
        let predictData = JSON.parse(req.body.predict_data);        // parse to object
        // let model = DataBaseUtils.find(modelId);        // obtain model from the database
        let model;
        DataBaseUtils.find_withCallback(modelId,(err,foundModel)=>{
            if (foundModel) {
                model = {
                    model_id: modelId,

                    uploadTime: foundModel.date,
                    status: foundModel.status,
                    features : foundModel.features,
                    modelType: foundModel.model_type
                };
                let modelType = model.modelType;
                let modelStatus = model.status;     // extract the status of the model
                let ready = modelStatus === "ready";        // verify model status
                let requestFeatures = Object.keys(predictData);      // obtain the names of the attributes from the request
                let trainedFeatures = new FeaturesWrapper(model.features);      // parse the trained features to an array and wrap it in a wrapper class
                let specifiedCorrectFeatures = trainedFeatures.isSubsetOf(requestFeatures);

                if (!specifiedCorrectFeatures) {        // verify that the request contains the features that were trained when the model was uploaded
                    res.sendStatus(ERROR_400);
                }
                if (ready)      // if model was trained and the data from the algorithm is ready to be used.
                {
                    console.log("in ready")
                   // let client = clients(modelId);  // get client from client map
                    let results;
                    let relevantData = removeRedundantFeatures(predictData,requestFeatures, trainedFeatures.features);
                    let convertedAnomalies = csvConverter.toCsvFormat(relevantData); // doesn't contain the redundant features, parses to csv format
                    sendAnomaliesGetResults(modelType,client,convertedAnomalies, function(data){        // sends request to algo server and gets back the spans.

                        let anomaliesDict = {};
                        if (data === '') {      // No anomalies were found.
                            let anomalyReport = {       // create the return object
                                anomalies : anomaliesDict,
                                reason : {
                                }     // need to check what to do with reason
                            };
                            res.send(JSON.stringify(anomalyReport));
                        }

                        let y = data.split('\n');      // each line in the array is of the format: start end (columns) for example: 44 49 A-B
                        let resultsArray = [];
                        for (let i =0 ;i<y.length-1; i++) {
                            resultsArray.push(y[i])
                        }
                        resultsArray.forEach((line) => {
                            let lineArray = line.split(' ');        //  need to check if \s is better
                            let first = parseInt(lineArray[0]);
                            let end = parseInt(lineArray[1]);
                            if (lineArray[2] in anomaliesDict) {
                                let alreadyInArray = anomaliesDict[lineArray[2]].some(arr => JSON.stringify(arr) ===JSON.stringify([first,end]));    // ignore replicates
                                if (!alreadyInArray) {
                                    anomaliesDict[lineArray[2]].push([first, end]);     // add span to the array of spans
                                }
                            }
                            else {
                                anomaliesDict[lineArray[2]] = [[first, end]];     // each entry (column names for example A-B) in the dictionary maps to an array of spans.
                            }
                        });
                        let anomalyReport = {       // create the return object
                            anomalies : anomaliesDict,
                            reason : {}     // need to check what to do with reason
                        };


                        res.send(JSON.stringify(anomalyReport));


                    });
                }
                // model is still pending -> error
                else{
                    // need to check how to use redirect
                    console.log("in redirect");
                    res.redirect("/api/model?model_id={modelId}");
                }
            }
            else {
                //.....................what error to throw ?......
                throw err;
            }

        });
    });

module.exports = router; // mapping a router and logic required to map /anomaly