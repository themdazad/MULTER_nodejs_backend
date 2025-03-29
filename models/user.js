const mongoose = require("mongoose");

require("dotenv").config();

console.log(process.env.CONNECTION_STRING);
// connecting to mongodb

mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(console.log("mongoDB is connected."))
  .catch((err) => {
    console.log(`Connection failed due to : ${err}`);
  });

const userSchema = mongoose.Schema({
  username: String,
  name:String,
  age:Number,
  email: String,
  password: String,
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ]
});

module.exports = mongoose.model("user", userSchema);
