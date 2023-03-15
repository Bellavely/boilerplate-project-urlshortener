require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const  shortid = require("shortid");
const cors = require('cors');
var bodyParser = require('body-parser');
const { Router } = require('express');
const app = express();


app.use(bodyParser.urlencoded({extended: false}));

const mongouri= process.env.MONGO_URI
//connect to mongoDb
mongoose.connect(mongouri,{ useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const urlSchema = mongoose.Schema({
  longURL: { type: String, required: true },
  shortUrl: { type: String, required: true },
});
const Urlmodel = mongoose.model('Url', urlSchema);



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {  
  res.sendFile(process.cwd() + '/views/index.html');
});



async function existUrl(urlfromreq) {
  const doc = await Urlmodel.findOne({longURL:urlfromreq},(err,doc)=>{
    if (err) return console.log(err);
    done(null, doc);
  });
  return doc;
}


app.post('/api/shorturl',(req,res)=>{
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i'
  );
  var urlfromreq= req.body.url;
  console.log(urlfromreq);
  //check if the url is valid
  if(pattern.test(urlfromreq)){
   Urlmodel.findOne({longURL:urlfromreq},(err,doc)=>{
    if (!doc)
    {
      //does not exist 
      const urlId = shortid.generate();
      var data=new Urlmodel({longURL: urlfromreq,shortUrl: urlId});
      data.save((err,myUrl)=>{
          if (err) return console.error(err);
          console.log(myUrl + "saved to collection.");
         })
         res.json({original_url: urlfromreq ,short_url:urlId});
    }
    else{
    res.json({original_url: doc.longURL ,short_url:doc.shortUrl});
    }
   })
}
else{
res.json({error: 'invalid url' });
}
})
app.get('/api/shorturl/:id',(req,res)=>{
  //search for the long url in db and redirect
  let getId = req.params.id;
  //console.log(getId)
  Urlmodel.findOne({shortUrl:getId}, (err,doc)=>{
    if(!doc) {
      res.json({error: "No short URL found for the given input"})
    }
    else{
    res.redirect(doc.longURL);
    }
  });
  })



// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


