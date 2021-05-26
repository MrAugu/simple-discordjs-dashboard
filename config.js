module.exports = {
  "token": "TOKEN", // https://discordapp.com/developers/applications/ID/bot
  "mongodbUrl": "MONGODB_URL", // Mongodb connection url.
  "id": "CLIENT_ID", // https://discordapp.com/developers/applications/ID/information
  "clientSecret": "CLIENT_SECRET", // https://discordapp.com/developers/applications/ID/information
  "domain": "http://localhost",
  "port": 8080,
  "usingCustomDomain": false
};

/**
 * !!!
 * You need to add a redirect url to https://discordapp.com/developers/applications/ID/oauth2.
 * Format is: domain:port/callback example http://localhost:8080/callback
 * - Do not include port if the port is 80.
 * !!!
 */
