let mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);

const server = '127.0.0.1';
const database = 'AnomalyDetectionDB';

class Database {
    constructor() {
        this.connect()
    }

    connect() {
        mongoose.connect(`mongodb://${server}/${database}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(() => {
                console.log('Database connection successful')
            })
            .catch(err => {
                console.error('Database connection error: ' + err)
            })
    }
}

module.exports = new Database()

