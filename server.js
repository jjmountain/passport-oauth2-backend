require("dotenv").config();
const express = require("express");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const { google } = require("googleapis");
require("./passport");

const app = express();

mongoose.connect(process.env.MONGO_DB_URL, {}, () => {
  console.log("Connected to database");
});

// middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.json({ message: "You are not logged in" });
});

app.get("/failed", (req, res) => {
  res.send("Failed");
});

app.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/forms.currentonly",
      "https://www.googleapis.com/auth/drive.file"
    ],
    accessType: "offline",
    // approvalPrompt: "force",
    prompt: "consent"
  })
);

app.get("/getuser", isLoggedIn, (req, res) => {
  res.send(req.user);
});

app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failed"
  }),
  function (req, res) {
    res.redirect("http://localhost:5173/home");
  }
);

app.get("/google/createForm", isLoggedIn, async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_CALLBACK_URL
  );

  await oauth2Client.setCredentials({
    refresh_token: req.user.refreshToken
  });

  const forms = google.forms({
    version: "v1",
    auth: oauth2Client
  });
  const requestJson = JSON.stringify({
    info: {
      title: "Test Form",
      documentTitle: "Test Form doc title"
    }
  });

  forms.forms
    .create({
      requestBody: requestJson
    })
    .then((response) => {
      res.send(response.data);
    })
    .catch((err) => {
      console.log(err);
      // res.status(500).send("Error creating form");
      res.redirect("/logout");
    });
});

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
});

app.listen(port, () => {
  console.log("server is running on port ", port);
});
