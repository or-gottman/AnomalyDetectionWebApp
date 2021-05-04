const express = require("express");
const router = express.Router(); // add this controller as router.

const DataBaseUtils = require("./utilsDB");
const collectionModel = require("./modelsModel");
const csvConverter = require("./DataConverter");
const modelController = require("./modelController");
const clients = modelController.clients;   // obtain the map of the clients.



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
const sendAnomaliesGetResults = function(client, anomalies, callback) {
    // let algoServer know client is about to send CSV for anomalies
    client.write("3\n");

    // sending algoServer anomalies row by row
    anomalies.forEach(function(row){
        client.write(row + "\n");
    });
    client.write("done\n");

    // ask algoServer for anomalies results
    client.write("6\n");        // changed from 4 to 6 (span command in algo server)

    // get back data from algoServer
    client.on("data", function(data) {
        callback(data); // get anomalies results. data will ended with "Done."
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
     //   let predictData = req.body.predict_data;        // obtain clients data from request
        let predictData = JSON.parse(req.body.predict_data);        // parse to object
        // let model = DataBaseUtils.find(modelId);        // obtain model from the database
        let model;
        DataBaseUtils.find_withCallback(modelId,(err,foundModel)=>{
            if (foundModel) {
                model = {
                    model_id: modelId,
                    upload_time: foundModel.date,
                    status: foundModel.status,
                    features : foundModel.features
                };
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
                    console.log("in ready");
                    let client = clients(modelId);  // get client from client map
                    let results;
                    let relevantData = removeRedundantFeatures(predictData,requestFeatures, trainedFeatures.features);
                    //let convertedAnomalies = csvConverter.toCsvFormat(JSON.parse(predictData));      // convert to csv format (array of rows)
                    let convertedAnomalies = csvConverter.toCsvFormat(relevantData); // doesn't contain the redundant features, parses to csv format
                    sendAnomaliesGetResults(client,convertedAnomalies, function(data){        // sends request to algo server and gets back the spans.
                        results = data;
                    });
                    let resultsArray = results.split('\n');      // each line in the array is of the format: start end (columns) for example: 44 49 A-B
                    let anomaliesDict = {};
                    resultsArray.forEach((line) => {
                        let lineArray = line.split(' ');        //  need to check if \s is better
                        anomaliesDict[lineArray[2]] = [lineArray[0],lineArray[1]];     // each description of columns for example (A-B) maps to a span = [start,end] of lines in which an anomaly occurred
                    });
                    let anomalyReport = {       // create the return object
                        anomalies : anomaliesDict,
                        reason : "Any"     // need to check what to do with reason
                    };
                    res.send(JSON.stringify(anomalyReport));        // send results to the client
                }
                // model is still pending -> error
                else{
                    // need to check how to use redirect
                    console.log("in redirect");
                    res.redirect("GET/api/model?model_id={modelId}");
                }
            }
            else {
                //.....................what error to throw ?......
                throw err;
            }

        });

        // do everything in the callback
        /*
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
            let anomaliesDict = {};
            let client = clients(modelID);  // get client from client map
            let results;
            let convertedAnomalies = csvConverter.toCsvFormat(JSON.parse(predictData));      // convert to csv format (array of rows)
            sendAnomaliesGetResults(client,convertedAnomalies, function(data){        // sends request to algo server and gets back the spans.
                results = data;
            });
            let resultsArray = results.split('\n');      // each line in the array is of the format: start end (columns) for example: 44 49 A-B
            resultsArray.forEach((line) => {
                let lineArray = line.split(' ');        //  need to check if \s is better
                anomaliesDict[lineArray[2]] = [lineArray[0],lineArray[1]];     // each description of columns for example (A-B) maps to a span = [start,end] of lines in which an anomaly occurred
            });
            let anomalyReport = {       // create the return object
                anomalies : anomaliesDict,
                reason : "Any"     // need to check what to do with reason
            };
            res.send(JSON.stringify(anomalyReport));        // send results to the client
        }
        // model is still pending -> error
        else{
            // need to check how to use redirect
            res.redirect("/api/model?model_id={modelId}");
        }

         */
    });

module.exports = router; // mapping a router and logic required to map /anomaly