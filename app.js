const bodyParser        = require('body-parser');
const ejs               = require('ejs');
const mongoose          = require('mongoose');
const express           = require('express');
const app               = express();
const methodOverride    = require('method-override');
const { json }          = require('body-parser');
const jwt               = require("jsonwebtoken");
const bcrypt            = require("bcrypt");
const path  = require('path');
const multer  = require('multer');
require("dotenv").config();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public')
    },
    filename: function (req, file, cb) {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
      
    }
  });
const upload = multer({ storage } );




//Connection string 
const url=process.env.MONGO_URL || "mongodb://localhost:27017/taskvayuz";




//Db connection
mongoose.connect('mongodb+srv://kapil123:kapil123@cluster0.wjkqg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}
) 
  .then(() => console.log('Connected to MongoDB successfully....'))
  .catch(err => console.error('Could not connect to MongoDB....'));


    app.set("view engine", "ejs");
    app.use(json());
    app.use('/public', express.static(path.join(__dirname, '/public')));
    app.use(express.urlencoded({extended:true}));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(methodOverride("_method"));
    app.use(bodyParser.json());

    const userSchema = new mongoose.Schema({
        name: {type:String, minLength:4, maxLength:32},
        email: {type:String, minLength:8, maxLength:64, index: { unique: true, dropDups: true }},
        password: {type:String, minLength:8, maxLength:64},
        date:Date,
        image:{ url:String, filename:String }
    });
    const User = mongoose.model("User", userSchema);
    
    app.get("/", (req, res) => {
        res.render("form")
    })
    app.get("/users", (req, res) => {
        User.find({}, (err, foundUsers)=> {
            if(err) {
                console.log(err);
            }
            else {
                res.render("list", {User:foundUsers});
            }
        });
    });    

    app.post("/signup", async (req, res) => {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        
        if (!email || !password)
        return res.status(400).json({ msg: "Not all fields have been entered." });
        if (password.length < 8)
        return res
          .status(400)
          .json({ msg: "The password needs to be at least 8 characters long." });
  
          const existingUser = await User.findOne({ email: email });
          if (existingUser)
           return res
          .status(400)
          .json({ msg: "An account with this email already exists." });

          const salt = await bcrypt.genSalt();
          const passwordHash = await bcrypt.hash(password, salt);
          const userdata = {name:name, email:email, password:passwordHash};

        User.create(userdata, function(err,newuser) {
            if(err) {
                res.send(err.message);
            }
            else {
                const token = jwt.sign({ id: newuser._id }, process.env.JWT_SECRET);

                res.render("date", {
                    token,
                    user:newuser
                  });
                  console.log(token, passwordHash)
            }
        });
    });

    
    app.put("/date/:id", (req, res) => {
        const id = req.params.id;
        console.log(id);
        const date = req.body.date;
        console.log(date);
        User.findByIdAndUpdate(id,{$set:{date:date}},  (err, user) => {
            if (err) {
                res.send(err);
            }
            else {
                console.log(user)
                res.render("image", {user:user});
            }
        })
    })

    app.put("/image/:id", upload.single('image'), (req, res) => {
        const id = req.params.id;
        const url = req.file.path;
        const filename = req.file.filename;
        const image = {url:url,filename:filename};
        console.log(id)
        console.log(image);
        User.findByIdAndUpdate(id, {$set:{image:image}},  (err, user) => {
            if(err) {
                res.send(err);
            }
            else {
              User.findById(id,(err,user)=>{
                  if(err){
                      res.send(err)
                  }
                  else
                  {
                      res.render("user", {user});
                      console.log(user);
                      console.log(user.image.url);
                  }
              });               
            }
        });
    });
    app.get("/login", (req,res) => {
        res.render("login");
    });
    app.post("/logged", async (req, res) => {
        try {
          const { email, password } = req.body;
      
          if (!email || !password)
            return res.status(400).json({ msg: "Not all fields have been entered." });
      
          const user = await User.findOne({ email: email });
          if (!user)
            return res
              .status(400)
              .json({ msg: "No account with this email has been registered." });
      
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return res.status(400).json({ msg: "Invalid credentials." });
      
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
          res.render("profile",{
            token,
            user: user
          })
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });



      module.exports=app;