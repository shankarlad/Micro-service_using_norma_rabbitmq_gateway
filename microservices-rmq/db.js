const mongoose = require("mongoose");
const config = require("./config");

const dbConnect =  mongoose.connect(config.mongoUri, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
})
.then(() => console.log("DB Connected"))
.catch(err => console.error("DB Connection Error:", err));  

module.exports = dbConnect;
