let mongoose = require('mongoose')

let modelsSchema = new mongoose.Schema({
    model_id: {
        type: String,
        required: true
    },
    model_type: {
        type: String,
        required: true
    },
    date: Date,
    features: Array,
    status: {
        type: String,
        required: true,
        enum: ['ready', 'pending']
    }
})

module.exports = mongoose.model('models', modelsSchema)
