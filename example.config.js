/* eslint-disable no-inline-comments */

module.exports = {
  port: 8000, // Pport to listen on
  prefix: "!", // Prefix for commands
  id: "ID", // Discord Bot ID
  usingCustomDomain: false, // Use a custom domain for the bot
  domain: "http://localhost", // Custom domain
  discordInvite: "https://discord.gg/", // Discord Invite URL
  mongodbUrl: "MONGO_URI", // MongoDB connection URL
  clientSecret: "CLIENT_SECRET", // Client Secret from Discord Application
  token: "CLIENT_TOKEN", // Bot Token from Discord Application
};

/**
 * !!!
 * You need to add a redirect url to https://discordapp.com/developers/applications/ID/oauth2.
 * Format is: domain:port/callback example http://localhost:8080/callback
 * - Do not include port if the port is 80.
 * !!!
 */
