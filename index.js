/*
  > Index.Js is the entry point of our application.
*/
// We import the modules.
const Discord = require("discord.js");
const mongoose = require("mongoose");
const config = require("./config");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");

// We instiate the client and connect to database.
const client = new Discord.Client({
  ws: {
    intents: [
      "GUILDS",
      "GUILD_MEMBERS",
      "GUILD_MESSAGES"
    ]
  }
});

mongoose.connect(config.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
client.config = config;

// We listen for client's ready event.
client.on("ready", async () => {
  console.log("Fetching members...");

  for (const [id, guild] of client.guilds.cache) {
    await guild.members.fetch();
  }

  console.log("Fetched members.");

  console.log(`Bot is ready. (${client.guilds.cache.size} Guilds - ${client.channels.cache.size} Channels - ${client.users.cache.size} Users)`);
  Dashboard(client);
  client.user.setActivity('https://github.com/MrAugu/simple-discordjs-dashboard', ({ type: "WATCHING" }))
});

// We listen for message events.
client.on("message", async (message) => {
  // Declaring a reply function for easier replies - we grab all arguments provided into the function and we pass them to message.channel.send function.
  const reply = (...arguments) => message.channel.send(...arguments);

  // Doing some basic command logic.
  if (message.author.bot) return;
  if (!message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES")) return;
 
  // Retriving the guild settings from database.
  var storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      gid: message.guild.id
    });
    await newSettings.save().catch(()=>{});
    storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  }

  // If the message does not start with the prefix stored in database, we ignore the message.
  if (message.content.indexOf(storedSettings.prefix) !== 0) return;

  // We remove the prefix from the message and process the arguments.
  const args = message.content.slice(storedSettings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // If command is ping we send a sample and then edit it with the latency.
  if (command === "ping") {
    const roundtripMessage = await reply("Pong!");
    return roundtripMessage.edit(`*${roundtripMessage.createdTimestamp - message.createdTimestamp}ms*`);
  }
});

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(config.token);