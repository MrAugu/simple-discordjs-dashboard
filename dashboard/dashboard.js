// We import modules.
const url = require("url");
const path = require("path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const config = require("../config");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const GuildSettings = require("../models/settings");

// We instantiate express app and the session store.
const app = express();
const MemoryStore = require("memorystore")(session);

// We export the dashboard as a function which we call in ready event.
module.exports = async (client) => {
  // We declare absolute paths.
  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`); // Absolute path of ./templates directory.

  // Deserializing and serializing users without any additional logic.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
  /** Scopes:
   *  - Identify: Avatar's url, username and discriminator.
   *  - Guilds: A list of partial guilds.
  */
  passport.use(new Strategy({
    clientID: config.id,
    clientSecret: config.clientSecret,
    callbackURL: `${config.domain}${config.port == 80 ? "" : `:${config.port}`}/callback`,
    scope: ["identify", "guilds"]
  },
  (accessToken, refreshToken, profile, done) => { // eslint-disable-line no-unused-vars
    // On login we pass in profile with no logic.
    process.nextTick(() => done(null, profile));
  }));

  // We initialize the memorystore middleware with our express app.
  app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
    resave: false,
    saveUninitialized: false,
  }));

  // We initialize passport middleware.
  app.use(passport.initialize());
  app.use(passport.session());

  // We bind the domain.
  app.locals.domain = config.domain.split("//")[1];

  // We set out templating engine.
  app.engine("html", ejs.renderFile);
  app.set("view engine", "html");

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderTemplate = (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default. 
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    // We render template using the absolute path of the template and the merged default data with the additional data provided.
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
  };

  // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
  const checkAuth = (req, res, next) => {
    // If authenticated we forward the request further in the route.
    if (req.isAuthenticated()) return next();
    // If not authenticated, we set the url the user is redirected to into the memory.
    req.session.backURL = req.url;
    // We redirect user to login endpoint/route.
    res.redirect("/login");
  }

  // Login endpoint.
  app.get("/login", (req, res, next) => {
    // We determine the returning url.
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL; // eslint-disable-line no-self-assign
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    // Forward the request to the passport middleware.
    next();
  },
  passport.authenticate("discord"));

  // Callback endpoint.
  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/" }), /* We authenticate the user, if user canceled we redirect him to index. */ (req, res) => {
    // If user had set a returning url, we redirect him there, otherwise we redirect him to index.
    if (req.session.backURL) {
      const url = req.session.backURL;
      req.session.backURL = null;
      res.redirect(url);
    } else {
      res.redirect("/");
    }
  });

  // Logout endpoint.
  app.get("/logout", function (req, res) {
    // We destroy the session.
    req.session.destroy(() => {
      // We logout the user.
      req.logout();
      // We redirect user to index.
      res.redirect("/");
    });
  });

  // Index endpoint.
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });

  // Dashboard endpoint.
  app.get("/dashboard", checkAuth, (req, res) => {
    renderTemplate(res, req, "dashboard.ejs", { perms: Discord.Permissions });
  });

  // Settings endpoint.
  app.get("/dashboard/:guildID", checkAuth, async (req, res) => {
    // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild) return res.redirect("/dashboard");
    const member = await guild.members.fetch(req.user.id);
    if (!member) return res.redirect("/dashboard");
    if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");

    // We retrive the settings stored for this guild.
    var storedSettings = await GuildSettings.findOne({ gid: guild.id });
    if (!storedSettings) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new GuildSettings({
        gid: guild.id
      });
      await newSettings.save().catch(()=>{});
      storedSettings = await GuildSettings.findOne({ gid: guild.id });
    }
  
    renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: null });
  });

    // Settings endpoint.
    app.post("/dashboard/:guildID", checkAuth, async (req, res) => {
        // We validate the request, check if guild exists, member is in guild and if member has minimum permissions, if not, we redirect it back.
        const guild = client.guilds.cache.get(req.params.guildID);
        if (!guild) return res.redirect("/dashboard");
        const member = await guild.members.fetch(req.user.id);
        if (!member) return res.redirect("/dashboard");
        if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
        // We retrive the settings stored for this guild.
        var storedSettings = await GuildSettings.findOne({ gid: guild.id });
        if (!storedSettings) {
          // If there are no settings stored for this guild, we create them and try to retrive them again.
          const newSettings = new GuildSettings({
            gid: guild.id
          });
          await newSettings.save().catch(()=>{});
          storedSettings = await GuildSettings.findOne({ gid: guild.id });
        }
      
        // We set the prefix of the server settings to the one that was sent in request from the form.
        storedSettings.prefix = req.body.prefix;
        // We save the settings.
        await storedSettings.save().catch(() => {});

        // We render the template with an alert text which confirms that settings have been saved.
        renderTemplate(res, req, "settings.ejs", { guild, settings: storedSettings, alert: "Your settings have been saved." });
    });

  app.listen(config.port, null, null, () => console.log(`Dashboard is up and running on port ${config.port}.`));
};
