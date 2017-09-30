//mongod --dbpath /data/db --repair
//1Z58O7VHS0UFIVII api key
var express                   = require("express"),
        app                   = express(), 
        bodyparser            = require("body-parser"),
        request               = require("request"),
        mongoose              = require("mongoose"),
        moment                = require('moment'),
        Stock                 = require('./models/stock'), 
        User                  = require("./models/user")
        // passport              = require("passport"),
        // LocalStrategy         = require("passport-local"),
        // passportLocalMongoose = require("passport-local-mongoose")
      
app.use(express.static("public")); 
        
mongoose.connect("mongodb://kartik:kartik34@ds139884.mlab.com:39884/nextstock");

// app.use(require("express-session")({
//     secret: "Waterloo Computer Science",
//     resave: false,
//     saveUninitialized: false
// }));

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()))
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

  
app.set("view engine", "ejs"); 
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended:true}));

//GLOBAL VARIABLES

var lastupdated;
var lastclosing; 
var stockprice; 
var marketopen; 
var previousprice; 

// FUNCTIONS FOR DATE AND TIME 
function simplify(date){
    date.toString()
    return date; 
}
function date(){
    var date = moment().format().slice(0, 10)
    date = simplify(date); 
    return date; 
}


var currenthour = date().slice(10, 13);
var currentminute =  date().slice(14, 16);
var updatedStocks; 

var time = parseInt(currenthour + currentminute);
//============================================================================
//                   ROUTES 
//============================================================================

// INDEX ROUTE FOR ALL STOCKS 

app.get("/", function(req,res){
 
    Stock.find({}, function(err, stocks){
       
      if(err){
          console.log("something went wrong");
          console.log(err); 
      }else{
    
            stocks.forEach(function(stock){
               
                var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&outputsize=compact&symbol=" + stock.ticker + "&apikey=1Z58O7VHS0UFIVII"; 
                
                request(url, function(error, response, body){
                    var parsedData = JSON.parse(body);
                    
                    if(Object.keys(parsedData).length != 0){
                   
                        if(!error && response.statusCode == 200){
           
                            console.log(stock.ticker + "")

                             
                            // iterating to last object
                            if(moment().format('dddd') == "Saturday"){
                               
                                lastclosing = simplify(moment().subtract(1, 'days').format().slice(0, 10));
                                lastupdated = lastclosing
                                previousprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['1. open']).toFixed(2); 
                                stockprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['4. close']).toFixed(2); 
                                marketopen = false;  
                                console.log(stockprice)
                            }
                            else if(moment().format('dddd') == "Sunday"){
                               
                                lastclosing = simplify(moment().subtract(2, 'days').format().slice(0, 10));
                                lastupdated = lastclosing
                                previousprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['1. open']).toFixed(2); 
                                stockprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['4. close']).toFixed(2); 
                                marketopen = false;  
                          
                            }else if(time < 930 && moment().format('dddd') == "Monday"){
         
                                lastclosing = simplify(moment().subtract(3, 'days').format().slice(0, 10));
                                lastupdated = lastclosing.format('MMMM Do YYYY'); 
                                previousprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['1. open']).toFixed(2); 
                                stockprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['4. close']).toFixed(2); 
                                marketopen = false;  
                                
                            }
                            else if(time < 930){
                                
                                lastclosing = simplify(moment().subtract(1, 'days').format().slice(0, 10));
                                lastupdated = lastclosing.format('MMMM Do YYYY'); 
                                previousprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['1. open']).toFixed(2); 
                                stockprice = parseFloat(parsedData['Time Series (Daily)'][lastclosing]['4. close']).toFixed(2); 
                                marketopen = false; 
                                
                            }else{  
                                if(time == 930){
                                    lastclosing = simplify(moment().subtract(1, 'days').format().slice(0, 10));
                                    previousprice =  parseFloat(parsedData['Time Series (Daily)'][lastclosing]['1. open']).toFixed(2);
                                }else{
                                    previousprice = parseFloat(parsedData['Time Series (Daily)'][date()]['1. open']).toFixed(2); 
                                    
                                }
                                
                                stockprice = parseFloat(parsedData['Time Series (Daily)'][date()]['4. close']).toFixed(2); 
                                lastupdated = moment().format('MMMM Do YYYY');
                                marketopen = true;  
                                console.log(stockprice)
                                console.log(previousprice)
    
                            }
    
                            Stock.findByIdAndUpdate(stock._id, {
                                stockprice: stockprice, 
                                previousprice: previousprice, 
                                lastupdated: lastupdated
                            }, function(err, stocks){
                                if(err){
                                    console.log(err)
                                }else{
                                    updatedStocks = stocks;
                                    console.log(updatedStocks)
                                }
                            })
                        }
                    }
                });
            });
          
            res.render("index", {stocks: stocks, marketopen: marketopen})
                            
        }
    });
});

app.get("/stocks/new", function(req,res){
    res.render("new");
});

//ADD STOCKS TO DB

app.post("/stocks", function(req,res){
    Stock.create(
        {
            company: req.body.company, 
            ticker: req.body.ticker,
            market: req.body.market,
            stockprice: 0,
            previousprice: 0,
            lastupdated: ""
        }
        
     ,function(err, stock){
        if(err){
            console.log(err);
            console.log("Something went wrong");
        }else{
            console.log(stock);
            res.redirect("/")
        }
    });
});

// STOCK SHOW PAGE

app.get("/stock/:id", function(req, res) {

       Stock.findById(req.params.id, function(err,stock){
           if(err){
               console.log(err)
           }else{
              
              var url = "https://api.cityfalcon.com/v0.2/stories.json?identifier_type=assets&identifiers=" + stock.company + "&categories=mp%2Cop&min_cityfalcon_score=0&order_by=top&time_filter=d1&languages=en&all_languages=false&paywall=false&registration_required=false&access_token=569c43c08f5d8ab3a318d5b9c549d612aa9f66e0ba92376b1fbdb12e06ee5248"
              request(url, function(error, response, body) {
                 if(!error && response.statusCode == 200){
                    
                    var news = JSON.parse(body); 
                    news = news["stories"]
                    // console.log(news)
                    res.render("showpage", {stock:stock, news:news})
                         
                 }
             })
           }
       })
})


// app.get("/register", function(req, res) {
//     res.render("register")
// })

// app.post("/register", function(req,res){
    
//     User.register(new User({username: req.body.username}), req.body.password, function(err, user){
//         if(err){
//             console.log(err)
//             return res.render('register')
//         }
//         passport.authenticate('local')(req, res, function(){
//             res.redirect("/")
//         })
//     })

// })
// app.post( "/login" , passport.authenticate('local', {
//         successRedirect: "/",
//         failureRedirect: "/",
//     }), function(req,res){
// })

// app.get("/login")

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("server is running");
});





