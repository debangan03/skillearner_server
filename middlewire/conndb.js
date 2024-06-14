const mongoose = require('mongoose')
require('dotenv').config()

const conndb =async (req, res) => {
  if (mongoose.connections[0].readyState) {
    return
  } else {
    mongoose
      .connect(process.env.MONGODB_URL)
      .then(() => console.log("connected to db"))
      .catch((e) => console.log(e));
  }
};
module.exports=conndb;