const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || '/api/auth/google/callback',
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const firstName =
          profile.name?.givenName ||
          profile.displayName?.split(' ')[0] ||
          'Google';
        const lastName =
          profile.name?.familyName ||
          profile.displayName?.split(' ')[1] ||
          'User';

        let user = await User.findOne({ googleId });

        if (user) {
          // Always update tokens
          user.googleAccessToken = accessToken;
          if (refreshToken) {
            user.googleRefreshToken = refreshToken;
          }
          await user.save();
          console.log(`Found user by Google ID: ${email}, role: ${user.role}`);
          return done(null, user);
        }

        if (!user && email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = googleId;
            user.googleAccessToken = accessToken;
            if (refreshToken) {
              user.googleRefreshToken = refreshToken;
            }
            await user.save();
            console.log(
              `Linked Google ID to existing user: ${email}, role: ${user.role}`
            );
            return done(null, user);
          }
        }

        // New user
        const newUser = new User({
          googleId,
          email,
          firstName,
          lastName,
          role: 'patient',
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          isNewUser: true,
        });
        await newUser.save();

        console.log(`New Google user detected: ${email}`);
        return done(null, newUser);
      } catch (err) {
        console.error('Google OAuth error:', err.message);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  if (user && user._id) {
    done(null, user._id);
  } else if (user && user.isNewUser) {
    done(null, JSON.stringify(user));
  } else {
    done(new Error('Cannot serialize user: missing ID or new user flag'));
  }
});

passport.deserializeUser((data, done) => {
  try {
    if (typeof data === 'string' && data.startsWith('{')) {
      const parsed = JSON.parse(data);
      if (parsed.isNewUser) return done(null, parsed);
    }

    User.findById(data)
      .then((user) => done(null, user))
      .catch((err) => done(err));
  } catch (err) {
    console.error('Deserialization error:', err.message);
    done(err);
  }
});

module.exports = passport;