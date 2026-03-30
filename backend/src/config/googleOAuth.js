const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const { id, displayName, emails, photos } = profile;
        const email = emails[0].value;
        const firstName = displayName?.split(' ')[0] || displayName;
        const lastName = displayName?.split(' ').slice(1).join(' ') || '';
        const profilePicture = photos[0]?.value;

        // Return user data for processing in the callback route
        return done(null, {
          googleId: id,
          email,
          name: displayName,
          firstName,
          lastName,
          profilePicture,
          provider: 'google'
        });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
