const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./User");

passport.serializeUser(function (user, done) {
  console.log("user obj", user);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    return done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      callbackURL: process.env.OAUTH_CALLBACK_URL,
      passReqToCallback: true
    },
    function (_, accessToken, refreshToken, profile, done) {
      console.log("REFRESH TOKEN", refreshToken);
      console.log("ACCESS TOKEN", accessToken);

      User.findOne({ googleId: profile.id }, async function (err, doc) {
        if (err) {
          return done(err, null);
        }
        if (!doc) {
          console.log(profile);
          const user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            refreshToken: refreshToken
          });
          await user.save(function (err) {
            if (err) console.log(err);
            return done(err, user);
          });
          return done(null, user);
        } else {
          return done(null, doc);
        }
      });
    }
  )
);
