var mongoose   = require("mongoose");
var stockSchema = new mongoose.Schema({
    
    company: String,
    ticker: String, 
    market: String,
    stockprice: Number,
    previousprice: Number,
    lastupdated: String,
    shares: Number
    
});
 
module.exports = mongoose.model("Stock", stockSchema);