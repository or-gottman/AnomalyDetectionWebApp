const collectionModel = require("./modelsModel")


class DataBaseUtils {
    constructor() {
    }

    // create and insert a new document with all the given data. return error (if occurred) with callback function.
    static insert(modelID, modelType, uploadTime, propertyNames, currentStatus, callback) {
        // create new model document for models collection
        let addModel = new collectionModel ({
            model_id: modelID,
            model_type: modelType,
            date: uploadTime,
            features: propertyNames,
            status: currentStatus,
        });

        // insert "addModel" to models collection
        addModel.save()
            .then(() => {
                callback(null);
            })
            .catch(err => {
                // couldn't store required data in DB
                callback(err);
            })
    }

    // update status of document based on given modelID
    static update_status(modelID, newStatus, callback) {
        collectionModel.updateOne({model_id: modelID}, {$set: {status: newStatus}}, function (err) {
            callback(err);
        });
    }

    // delete the given modelID document from database. return error and deleted model with callback function.
    static delete(modelID, callback) {
        collectionModel.findOneAndDelete({model_id: modelID}, function (err, deleteModel) {
            callback(err, deleteModel);
        });
    }

    // find model matching the given modelID and return this model with a callback function (and an error if occurred)
    static find_withCallback(modelID, callback) {
        collectionModel.findOne({model_id: modelID}, function(err, foundModel) {
            callback(err, foundModel);
        });
    }

    /**
     * given a model id the function returns the specified model from the database.
     * @param modelId
     * @returns Model
     */
    static find(modelId) {
        let model;
        collectionModel.findOne({model_id : modelId} , (error, foundModel) => {
            if (foundModel) {
                model = foundModel;
            }
        });
        return model;
    }
}

module.exports = DataBaseUtils;


