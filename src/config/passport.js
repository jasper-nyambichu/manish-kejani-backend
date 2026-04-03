// src/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import { logger } from '../shared/utils/logger.js';

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google'), null);

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          await User.findByIdAndUpdate(user.id, { lastLogin: new Date() });
          return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
          await User.findByIdAndUpdate(user.id, {
            googleId:     profile.id,
            authProvider: 'google',
            isVerified:   true,
            lastLogin:    new Date(),
          });
          return done(null, { ...user, googleId: profile.id, authProvider: 'google', isVerified: true });
        }

        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
        let username = baseUsername;
        let counter  = 1;
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        user = await User.create({
          username,
          email,
          googleId:     profile.id,
          authProvider: 'google',
          isVerified:   true,
          lastLogin:    new Date(),
        });

        return done(null, user);
      } catch (err) {
        logger.error(`Google OAuth error: ${err.message}`);
        return done(err, null);
      }
    }
  )
);

export default passport;