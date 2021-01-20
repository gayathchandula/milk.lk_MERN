const express = require('express');
const app = express();
const cors = require('cors');
var fileupload = require('express-fileupload'); 
app.use(fileupload());
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
const PORT = 4000;
const router = require("express").Router();
mongoose.set('useCreateIndex', true);
const saltRounds = 10;
var authJwt = require("./validate-token");
const MAX_AGE = 1000 * 60 * 60 * 3; // Three hours
const session = require("express-session");
const jwt = require('jsonwebtoken');
const crudRoutes = express.Router({mergeParams: true});
const store = express.Router({mergeParams: true});
const morgan = require("morgan");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require('multer');
var path = require('path');
const fs = require('fs')




const mongoDBstore = new MongoDBStore({
  uri: 'mongodb+srv://gayath:admin@cluster0.cxze7.mongodb.net/Products?retryWrites=true&w=majority',
  collection: "mySessions"
});
app.use(morgan("dev"));
require("dotenv").config();

app.use(
  session({
    name: process.env.COOKIE_NAME, //name to be put in "key" field in postman etc
    secret: process.env.JWT_SECRET,
    resave: true,
    saveUninitialized: false,
    store: mongoDBstore,
    unset: 'destroy',   
    cookie: {
      maxAge: MAX_AGE,
      sameSite: false,
      secure: process.env.NODE_ENV === 'production'
    }
  })
);



let Crud = require('./crud.model');
let cart = require('./cart')
const User = require('./user');
const orders = require('./orders')

const bcrypt = require('bcryptjs');

app.use('/uploads', express.static(path.join(__dirname, '/uploads/')));

app.use(express.json());
app.use(express.urlencoded({extended:true}))
//app.use(bodyParser.json());
app.use(cors());
app.use(cookieParser());

mongoose.connect('mongodb+srv://gayath:admin@cluster0.cxze7.mongodb.net/Products?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;

connection.once('open', () => {
  
    console.log("MongoDB database connection established successfully");
})







crudRoutes.route('/').get((req, res) => {
    Crud.find((err, results) => {
        if (err) console.log(err);
        else res.json(results);
    });
});

crudRoutes.route('/:id').get((req, res) => {
    let id = req.params.id;
    Crud.findById(id, (err, result) => {
        if (err) console.log(err);
        else
        
        res.json(result);
    });
});







crudRoutes.route('/add').post((req, res,next) => {
  
  const file = req.files.image;
  file.mv(__dirname +"/uploads/"+file.name,function(err,result){
     if(err) throw err;
    res.send({ msg:"file uploaded!"});
   })
  
    

   //let list = new Crud(req.body);
    let list = new Crud({
      product_name:req.body.product_name,
      product_brand:req.body.product_brand,
      product_category:req.body.product_category,
      product_price:req.body.product_price,
      image:req.files.image.name,
      

    })
  
    list.save().then(list => {
        res.status(200).json({'list': 'Product added successfully'});
    }).catch(err => {
        res.status(400).send('fail');
    });
});

app.use(cookieParser());

crudRoutes.route('/update/:id').post((req, res) => {
    Crud.findById(req.params.id, (err, data) => {
        if (!data) res.status(404).send("Product is not found");
        else {
            data.product_name = req.body.product_name;
            data.product_brand = req.body.product_brand;
            data.product_category = req.body.product_category;
            data.product_price = req.body.product_price;
           

            data.save().then(data => {
                res.json('Data product is updated!');
            }).catch(err => {
                res.status(400).send("Update isn't possible");
            });
        }
    });
});

crudRoutes.route('/delete/:id').delete((req, res) => {
  let id = req.params.id;
  
  Crud.findById(id, (err, result) => {
    if (err) console.log(err);
    else
    fs.unlink(__dirname +`/uploads/${result.image}`, (err) => {
      if (err) throw err;
      console.log('file was deleted');
    });
    
    return;
});
    Crud.findByIdAndRemove(req.params.id,  (err, data) => {

        if (err) return res.status(500).send("There was a problem deleting the product.");
        res.status(200).send(`product ${data.product_name} was deleted`);
    })
});



app.use('/all_product', crudRoutes);
app.listen(PORT, () => {
    console.log("Server is running on PORT: " + PORT);
})



router.route('/register').post((req, res) => {

    
  var user = req.body;
      var email = req.body.email;
      
      var password = req.body.password;

      var salt =  bcrypt.genSaltSync(saltRounds);
  var passwordHash = bcrypt.hashSync(password, salt);

      User.findOne({email:user.email}, function (err, existingUser){
          if(existingUser == null){

     
              var newUser = new User({
            
                  email: email,
                  
                  password: passwordHash,});
          
                  
                  newUser.save()
                  .then(user => {
                    res.status(201);
                    res.send(user);
                  });
                  
                  
          }else{
           // console.log("There is a user already") //Prints out in the node console
         // throw new Error("This email is already registered") //Does not sent this message to the broswer
              res.status(404).send("An account with this email already exists.");
              
      
          }
      }); 

});

store.route('/').get((req, res) => {
  Crud.find((err, results) => {
      if (err) console.log(err);
      else res.json(results);
  });
});


store.route('/freshmilk').get((req, res) => {
  Crud.find({product_category:"fresh milk"},(err, results) => {
      if (err) console.log(err);
      else res.json(results);
  });
});        

store.route('/milk').get((req, res) => {
  Crud.find({product_category:"milk"},(err, results) => {
      if (err) console.log(err);
      else res.json(results);
  });
});

store.route('/:id').get((req, res) => {
  let id = req.params.id;
  Crud.findById(id, (err, result) => {
      if (err) console.log(err);
      else
      
      res.json(result);
  });
});

store.route('/addtocart').post((req, res,next) => {
  
  //let list = new Crud(req.body);
    let list = new cart({
      product_name:req.body.data.product_name,
      product_brand:req.body.data.product_brand,
      product_category:req.body.data.product_category,
      product_price:req.body.data.product_price,
      image:req.body.data.image,
      token: req.body.token,
      quantity:req.body.quantity.quantity,

    })
  
    list.save().then(list => {
        res.status(200).json({'list': 'Product added successfully'});
    }).catch(err => {
        res.status(400).send('fail');
    });
  
});

store.route('/cart').post((req, res) => {
  const token = req.body.token;
  cart.find({token:token},(err, results) => {
      if (err) console.log(err);
      else res.json(results);
  });
});

store.route('/cart/delete').delete((req, res) => {
  
  let id = req.body._id;
    cart.findOneAndDelete(id,  (err, data) => {

        if (err) return res.status(500).send("There was a problem deleting the product.");
        res.status(200).send(`cart was deleted`);
    })
});
store.route('/orders').post((req, res,next) => {

  //let list = new Crud(req.body);
    let list = new orders({
      orders:req.body.listData.lists,
      name: req.body.user.name,
      address:req.body.user.address,
      mobile:req.body.user.mobile,

    })
  
    list.save()
    
    let token = req.body.token;
    cart.deleteMany({token:token},  (err, data) => {

  })
    .then(list => {
        res.status(200).json({'list': 'Product added successfully'});
    }).catch(err => {
        res.status(400).send('fail');
    });
  
});
store.route('/admin/orders').get((req, res) => {
  
  orders.find((err, results) => {
    if (err) console.log(err);
    else res.json(results);
});
  
 
 
});

app.use('/store', store);


const {  loginUser, logoutUser, authChecker, isAuth } = require("./controller");
// Logs In a User, creates session in mongo store
// and returns a cookie containing sessionID, also called "session-id"
router.post("/login", loginUser );

// Log out user by deleting session from store
// and deleting cookie on client side
// Needs cookie containing sessionID to be attached to request
router.delete("/logout", logoutUser );


// Check if user is Authenticated by reading session data
// Needs cookie containing sessionID
router.get("/authchecker", authChecker );

router.route('/user/update').post((req, res) => {
  const { token, password } = req.body;
  console.log(token);
  console.log(password);
  //var token = req.body.token;
  var decoded = jwt.verify(token, process.env.JWT_SECRET);
  
 
  User.findById(decoded.id, (err, data) => {
    var salt =  bcrypt.genSaltSync(saltRounds);
    const passwordHash = bcrypt.hashSync(req.body.password, salt);
       
           data.password = passwordHash

         

           

          data.save().then(data => {
              res.status(200).json('password updated!');
          }).catch(err => {
              res.status(400).send("Update isn't possible");
          });
      
  });
});







app.use('/api', router);