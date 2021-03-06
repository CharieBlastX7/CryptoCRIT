require('dotenv').config({path: './.env'});

var express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser')
var crypto = require('crypto');
var bip39 = require('bip39');
const ecc = require('eosjs-ecc');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

var Student = require("./database/rollno");
var OTP = require("./auth/OTP");
var keygen = require("./auth/keygen");
var Session = require("./database/session");
var Blocks = require('./database/blocks');
var Transaction = require('./blockchain/transaction.js');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true})); 
app.set('json spaces', 2);

class Exception {
  constructor(code,message) {
    this.code = code;
    this.message = message;
  }
}

app.post('/login', async function(req,res) {
  try {
    if (!req.body.rollno) throw new Exception(400,"parameter missing: rollno");  // roll number missing
    var rollno = req.body.rollno;
    var userExists = await Student.exists(rollno);  // check if roll number is valid
    if (!userExists) throw new Exception(401,"Invalid roll number"); // Invalid roll number
    var otp = new OTP(rollno);
    var token = await otp.send();
    var email = await Student.getEmailFromRollNumber(rollno);
    res.json({
      token: token,
      email: Student.hideEmail(email)
    });
  }
  catch (e) {
    if (e instanceof Exception) res.status(e.code).end(e.message);
    else res.json(e);
  }
});

app.post('/verify', async function(req,res) {
  try {
    if (!req.body.token) throw new Exception(400,"parameter missing: token");  // token missing
    if (!req.body.otp) throw new Exception(400,"parameter missing: otp");  // OTP missing
    var student = await OTP.verify(req.body.token,req.body.otp);  // verifies OTP, if unauthorised, throws Exception
    //if (await Student.isNew(student.rollno)) await Student.setKeyPair(student.rollno, keygen.generateKeyPair()); // if student is new, generate keypair for them
    //var keypair = await Student.getKeyPair(student.rollno);
    var isNew = await Student.isNew(student.rollno);
    var token = crypto.randomBytes(8).toString('hex');
    var session = new Session(token);
    session.set("rollno",student.rollno);
    session.set("type","login");
    await session.create();
    res.json({
      token: token,
      isNew: isNew
    });
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.post('/create', async function(req,res) {
  try {
    if (!req.body.token) throw new Exception(400,"parameter missing: token");  // token missing
    if (!req.body.public_key) throw new Exception(400,"parameter missing: public_key"); // public_key missing
    await Session.isLoggedIn(req.body.token);
    if (!ecc.isValidPublic(req.body.public_key)) throw new Exception(400,"Invalid Public Key");
    var student = await Session.get(req.body.token);
    var isNew = await Student.isNew(student.rollno);
    if (!isNew) throw new Exception(400,"User already Exists");
    await Student.setPublicKey(student.rollno,req.body.public_key);
    res.end("done");
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.post('/transaction', async function(req,res) {
  try {
    if (!req.body.token) throw new Exception(400,"parameter missing: token");  // token missing
    if (!req.body.timestamp)  throw new Exception(400,"parameter missing: timestamp");  // timestamp missing
    if (!req.body.to_address)  throw new Exception(400,"parameter missing: to_address");  // to_address missing
    if (!req.body.roll_no)  throw new Exception(400,"parameter missing: roll_no");  //roll_no missing
    if (!req.body.amount) throw new Exception(400,"parameter missing: amount"); // amount missing
    if (!req.body.signature) throw new Exception(400,"parameter missing: signature"); // signature missing
    await Session.isLoggedIn(req.body.token);
    var amount = parseInt(req.body.amount);
    if (amount < 0) throw new Exception(400,"Amount must be positive");
    var student = await Session.get(req.body.token);
    var from_address = await Student.getPublicKey(student.rollno);
    var linked_to_address = await Student.getPublicKey(req.body.roll_no);
    if (linked_to_address != to_address) throw new Exception(400,"Roll Number Doesn't Match Public Key");
    var transaction = new Transaction(req.body.timestamp ,from_address, req.body.to_address, amount, req.body.signature);
    transaction.isValid();  // TODO work on this function
    if (student.rollno != "admin") {
      var balance = await Blocks.getBalanceFromAddress(from_address);
      if (amount > balance) throw new Exception(401,"Transaction amount greater than balance"); // amount greater than balance
    }
    await Blocks.add({
      from_roll_no: student.rollno,
      from_address: from_address,
      to_roll_no: req.body.roll_no,
      to_address: req.body.to_address,
      amount: amount,
      signature: req.body.signature,
      timestamp: req.body.timestamp
    });
    res.end("done");
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.post('/logout', async function(req,res) {
  try {
    if (!req.body.token) throw new Exception(400,"parameter missing: token");  // token missing
    await Session.destroy(req.body.token);
    res.end("done");
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.get('/history', async function(req,res) {
  try {
    if (!req.query.token) throw new Exception(400,"parameter missing: token");  // token missing
    await Session.isLoggedIn(req.query.token);
    var student = await Session.get(req.query.token);
    var public_key = await Student.getPublicKey(student.rollno);
    var history = await Blocks.getHistoryFromAddress(public_key);
    res.json(history);
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.get('/balance', async function(req,res) {
  try {
    if (!req.query.token) throw new Exception(400,"parameter missing: token");  // token missing
    await Session.isLoggedIn(req.query.token);
    var student = await Session.get(req.query.token);
    var public_key = await Student.getPublicKey(student.rollno);
    var balance = await Blocks.getBalanceFromAddress(public_key);
    res.json({
      balance: balance
    });
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
});

app.get('/blockchain', async function(req,res) {
  var blockchain = await Blocks.getBlockchain();
  res.json(blockchain);
});

app.get('/user', async function(req,res) {
  try {
    if (!req.query.rollno) throw new Exception(400,"parameter missing: rollno");  // rollno missing
    var public_key = await Student.getPublicKey(req.query.rollno);
    res.json({
      public_key: public_key
    });
  }
  catch (e) {
    res.status(e.code).end(e.message);
  }
}); 

app.post('/*', function(req,res) {
  res.status(404).end("Not Found");
});

app.get('/*', function(req,res) {
  res.status(404).end("Not Found");
});

app.listen(process.env.PORT || 8080);
