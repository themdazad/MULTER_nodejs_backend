const userModel = require("./models/user");
const postModel = require("./models/post");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { existsSync } = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create", async (req, res) => {
  // check user existence
  let { username, name, age, email, password } = req.body;

  let isUser = await userModel.findOne({ email });
  if (isUser) {
    return res.status(400).send("User already exists.");
  }

  // hash password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      if (err) {
        return res.status(500).send("Internal Server Error.");
      }
      password = hash;
      // create user
      let user = new userModel({ username, name, age, email, password });

      let token = jwt.sign({ email, userid: user._id }, "someScreteKey");
      res.cookie("token", token);
      res.send("User Resistered.");
      await user.save();
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({email:req.user.email}).populate("posts");
  res.render("profile", { user });
});

// Creating Post 
app.post("/post", isLoggedIn, async (req, res) => {
  // jo user logged in hae uska data store krna 
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body; // form ka data jab Button press hua ho
  let post = await postModel.create({
    user: user._id,
    content,
  });
  // tell user that post is created
  user.posts.push(post._id);  // user ko pta chl jayega ki post create ho chuki he
  await user.save();
  console.log("Post created 🙌")
  res.redirect("/profile");
});

// Like Features 
app.get("/like/:id", isLoggedIn, async (req, res) =>{
  let post = await postModel.findOne({_id: req.params.id}).populate("user");

  if(post.likes.indexOf(req.user.userid ) === -1){
    post.likes.push(req.user.userid);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid), 1)
  }
  await post.save();
  res.redirect("/profile")
})

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  // checking user existence
  let isUser = await userModel.findOne({ email });
  if (!isUser) {
    return res.status(401).send("You are unauthorized!");
  }

  //if user exists
  // compare there password with hashed password
  // Using Callback
  // bcrypt.compare(password, isUser.password, (err, result) => {
  //   if(err){
  //     return res.status(500).send("Internal Server Error.");
  //   }
  //   if (!result) {
  //     return res.status(401).send("Invalid credentials.");
  //   }
  //   if(result){
  //     let token = jwt.sign({ email, userid:isUser._id }, "someScreteKey");
  //     res.cookie("token", token);
  //     res.status(200).send("You can login now. go to : /profile");
  //   }
  // });

  // Using Promises
  let isMatch = await bcrypt.compare(password, isUser.password);
  if (!isMatch) {
    return res.status(401).send("Invalid Credentials.");
  }
  if (isMatch) {
    let token = jwt.sign({ email, userid: isUser._id }, "someScreteKey");
    res.cookie("token", token);
    res.redirect("profile");
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.redirect("login");
});

// Middleware function for user verification
function isLoggedIn(req, res, next) {
  //  check cookie is empty or not

  if (!req.cookies.token) {
    res.send("Aap kon!🤔 Aapka kya name!😒 Kya hae kam ?🤷‍♂️.");
  } else {
    let data = jwt.verify(req.cookies.token, "someScreteKey");
    req.user = data;
  }
  next();
}

app.listen(3000, () => {
  console.log("🚀 Server is running on http://localhost:3000");
});
