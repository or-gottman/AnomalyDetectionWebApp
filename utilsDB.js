const collectionModel = require("./modelsModel")


class DataBaseUtils {
    constructor() {
    }
    static insert() {

    }
    static update() {

    }
    static delete() {

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


