const express = require("express");
const app = express();
require("./mongo");

// app.use(express.static("public"));

// redirect all "/api/model" requests to "modelController.js"
app.use("/api/model", require("./modelController"));
// redirect all "/api/models" requests to "modelsController.js"
app.use("/api/models", require("./modelsController"));
// redirect all "/api/anomaly" requests to "anomalyController.js"
app.use("/api/anomaly", require("./anomalyController"));

app.listen(9876, function () {
    console.log("Server started on port 9876");
});