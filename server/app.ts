import express from "express";
import cors from "cors";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import jwt from 'jsonwebtoken';
import { Response } from "express-serve-static-core";
import cookieParser from 'cookie-parser'

const PORT = 8080;
const app = express();

interface Database {
  data: string;
  lastUpdated: Date;
}

const database: Database = {
  data: "Hello World",
  lastUpdated: new Date(),
};

// audit log to track the user's data history
const history: any[] = []

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser())

// Routes

// added layers to encrypt data stored
const key = randomBytes(32)
const iv = randomBytes(16)

// variable to show hello world or updated data
let userInput = false;

app.get("/", (req, res) => {
  // return 'Hello World' if the user has not added data, else decrypt user's data and return
  if (userInput) {
    const decipher = createDecipheriv('aes256', key, iv)
    const decryptedData = decipher.update(database.data, 'hex', 'utf-8') + decipher.final('utf-8')
    res.json({data: decryptedData, encrypted: database.data, 'cookie': setTokenCookie(res, decryptedData), history: history});
  } else {
    setTokenCookie(res, database.data)
    res.json(database)
  }
});

app.post("/", (req, res) => {
  userInput = true;
  // encrypt the user input to prevent storage of plain text data
  const cipher = createCipheriv('aes256', key, iv);
  const encryptedData = cipher.update(req.body.data, 'utf-8', 'hex') + cipher.final('hex');
  database.data = encryptedData;
  database.lastUpdated = new Date()
  const userToken = setTokenCookie(res, req.body.data)
  const historyTag = {...database, userToken }
  history.push(historyTag)
  res.sendStatus(200);
});

// route to verify the user's token matches with the last logged update's token
app.get("/verify", (req, res) => {
  const lastInput = history[history.length - 1]
  // given no user ID, this route compares the token's header and returns true
  // in a larger scale project with users in the database, part of the payload could be isolated and compared
  if (lastInput && lastInput.userToken.split(".")[0] === req.cookies['bequest-token'].split(".")[0]) {
    res.json({ verified: true})
  } else {
    res.json({ verified: false})
  }
})

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// secret key which would be in a .env file
const secret_key = 'secret_key'

// set JWT cookie
const setTokenCookie = (res: Response, userData: any) => {
  const payload = {
    data: userData
  }

  const token = jwt.sign(payload, secret_key, {
    expiresIn: 604800 // 1 week in seconds
  })

  res.cookie('bequest-token', token, {
    maxAge: 604800000,
    httpOnly: true,
    // secure: true, // necessary for production
  })

  return token
}
