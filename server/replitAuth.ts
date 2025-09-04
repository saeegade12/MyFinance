// import * as client from "openid-client";
// import { Strategy, type VerifyFunction } from "openid-client/passport";

// import passport from "passport";
// import session from "express-session";
// import type { Express, RequestHandler } from "express";
// import memoize from "memoizee";
// import connectPgSimple from "connect-pg-simple";
// import { storage } from "./storage";

// const localDevAuth = process.env.LOCAL_DEV_AUTH === "true";

// if (!process.env.REPLIT_DOMAINS && !localDevAuth) {
//   throw new Error("Environment variable REPLIT_DOMAINS not provided");
// }

// // Memoized OIDC config discovery
// const getOidcConfig = memoize(async () => {
//   return await client.discovery(
//     new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
//     process.env.REPL_ID!
//   );
// }, { maxAge: 3600 * 1000 }); // cache for 1 hour

// // Session middleware
// export function getSession() {
//   const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

//   if (localDevAuth) {
//     return session({
//       secret: process.env.SESSION_SECRET!,
//       resave: false,
//       saveUninitialized: false,
//       cookie: { httpOnly: true, secure: false, maxAge: sessionTtl },
//     });
//   }

//   const pgStore = connectPgSimple(session);
//   const store = new pgStore({
//     conString: process.env.DATABASE_URL,
//     createTableIfMissing: false,
//     ttl: sessionTtl,
//     tableName: "sessions",
//   });

//   return session({
//     secret: process.env.SESSION_SECRET!,
//     store,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { httpOnly: true, secure: true, maxAge: sessionTtl },
//   });
// }

// // Update user session with new tokens
// function updateUserSession(
//   user: any,
//   tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
// ) {
//   user.claims = tokens.claims();
//   user.access_token = tokens.access_token;
//   user.refresh_token = tokens.refresh_token;
//   user.expires_at = user.claims?.exp;
// }

// // Upsert user in DB
// async function upsertUser(claims: any) {
//   await storage.upsertUser({
//     id: claims.sub,
//     email: claims.email,
//     firstName: claims.first_name,
//     lastName: claims.last_name,
//     profileImageUrl: claims.profile_image_url,
//   });
// }

// // Setup authentication
// export async function setupAuth(app: Express) {
//   app.set("trust proxy", 1);
//   app.use(getSession());

//   if (localDevAuth) {
//     // Mock auth for local development
//     app.use((req, _res, next) => {
//       if (!(req as any).user) {
//         (req as any).user = {
//           claims: {
//             sub: "dev-user",
//             email: "dev@example.com",
//             first_name: "Dev",
//             last_name: "User",
//             profile_image_url: "",
//             exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
//           },
//           expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
//         };
//       }
//       (req as any).isAuthenticated = () => true;
//       next();
//     });

//     // Dev login/logout routes
//     app.get("/api/login", (_req, res) => res.redirect("/"));
//     app.get("/api/logout", (_req, res) => res.redirect("/"));
//     return;
//   }

//   app.use(passport.initialize());
//   app.use(passport.session());

//   const config = await getOidcConfig();

//   const verify: VerifyFunction = async (tokens, done) => {
//     const user: any = {};
//     updateUserSession(user, tokens);
//     await upsertUser(tokens.claims());
//     done(null, user);
//   };

//   // Register strategy for each domain
//   process.env.REPLIT_DOMAINS!.split(",").forEach((domain) => {
//     const strategy = new Strategy(
//       {
//         name: `replitauth:${domain}`,
//         config,
//         scope: "openid email profile offline_access",
//         callbackURL: `https://${domain}/api/callback`,
//       },
//       verify
//     );
//     passport.use(strategy);
//   });

//   passport.serializeUser((user: Express.User, cb) => cb(null, user));
//   passport.deserializeUser((user: Express.User, cb) => cb(null, user));

//   app.get("/api/login", (req, res, next) => {
//     passport.authenticate(`replitauth:${req.hostname}`, {
//       prompt: "login consent",
//       scope: ["openid", "email", "profile", "offline_access"],
//     })(req, res, next);
//   });

//   app.get("/api/callback", (req, res, next) => {
//     passport.authenticate(`replitauth:${req.hostname}`, {
//       successReturnToOrRedirect: "/",
//       failureRedirect: "/api/login",
//     })(req, res, next);
//   });

//   app.get("/api/logout", (req, res) => {
//     req.logout(() => {
//       res.redirect(
//         client.buildEndSessionUrl(config, {
//           client_id: process.env.REPL_ID!,
//           post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
//         }).href
//       );
//     });
//   });
// }

// // Middleware to check authentication and refresh tokens if needed
// export const isAuthenticated: RequestHandler = async (req, res, next) => {
//   const user = req.user as any;

//   if (!req.isAuthenticated() || !user?.expires_at) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   const now = Math.floor(Date.now() / 1000);
//   if (now <= user.expires_at) return next();

//   const refreshToken = user.refresh_token;
//   if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

//   try {
//     const config = await getOidcConfig();
//     const tokens = await client.refreshTokenGrant(config, refreshToken);
//     updateUserSession(user, tokens);
//     next();
//   } catch (_err) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }
// };

// // --------------------------
// // ADD THIS AT THE BOTTOM
// // --------------------------
// export function setupAuthRoutes(app: Express) {
//   // Returns the current authenticated user
//   app.get("/api/auth/user", (req, res) => {
//     if (req.isAuthenticated() && req.user) {
//       return res.json(req.user);
//     }
//     return res.status(401).json({ message: "Not authenticated" });
//   });
// }
