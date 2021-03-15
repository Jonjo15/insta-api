const JwtStrategy = require('passport-jwt').Strategy,
     ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require("../models/user")
var GooglePlusTokenStrategy = require('passport-google-plus-token');

require("dotenv").config()

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

module.exports = (passport) => {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({_id: jwt_payload.sub}, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }
        }).select("-password");
    }));
    passport.use(new GooglePlusTokenStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
      },
      function(accessToken, refreshToken, profile, done) {
        // console.log(profile)
        User.findOne({googleId: profile.id}, async(err, user) => {
            if(err) {
                return done(err, false)
            }
            if (user) {
                return done(null, user)
            }
            else {
                const newUser = new User({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    profile_pic_url: profile.photos[0].value,
                    username: profile.displayName
                })
                try {
                    const savedUser = await newUser.save()
                    if(!savedUser) throw Error("Something went wrong with creating new user")
                    return done(null, savedUser)
                }
                catch(e) {
                    return done(e, false)
                }
                
                
            }
        })
      }
    ));
}