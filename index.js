/*
  > Index.Js is the entry point of our application.
*/

/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow-restricted-names */

// We import the modules.
const config = require('./config');
const mongoose = require('mongoose');
const GuildSettings = require('./models/settings');
const Dashboard = require('./dashboard/dashboard');
const { Client, Intents, Permissions } = require('discord.js');

// We instiate the client and connect to database.
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES],
});

mongoose.connect(config.mongodbUrl, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

client.config = config;

// We listen for client's ready event.
client.on('ready', async () => {
	console.log('Fetching members...');
	for (const [id, guild] of client.guilds.cache) {
		await guild.members.fetch();
	}
	console.log('Fetched members.');

	console.log(
		`Bot is ready. (${client.guilds.cache.size} Guilds - ${client.channels.cache.size} Channels - ${client.users.cache.size} Users)`,
	);

	client.user.setActivity(
		'https://github.com/MrAugu/simple-discordjs-dashboard',
		{ type: 'WATCHING' },
	);

	Dashboard(client);
});

// We listen for message events.
client.on('messageCreate', async (message) => {
	// Doing some basic command logic.
	if (message.author.bot) return;
	if (!message.channel.permissionsFor(message.guild.me).has(Permissions.FLAGS.SEND_MESSAGES)) {
		return;
	}

	// Retriving the guild settings from database.
	let storedSettings = await GuildSettings.findOne({
		guildID: message.guild.id,
	});
	if (!storedSettings) {
		// If there are no settings stored for this guild, we create them and try to retrive them again.
		const newSettings = new GuildSettings({
			guildID: message.guild.id,
		});
		await newSettings.save().catch((e) => {
			console.log(e);
		});
		storedSettings = await GuildSettings.findOne({ guildID: message.guild.id });
	}
	// If the message does not start with the prefix stored in database, we ignore the message.
	if (message.content.indexOf(storedSettings.prefix) !== 0) return;

	// We remove the prefix from the message and process the arguments.
	const args = message.content
		.slice(storedSettings.prefix.length)
		.trim()
		.split(/ +/g);
	const command = args.shift().toLowerCase();

	// If command is ping we send a sample and then edit it with the latency.
	if (command === 'ping') {
		const roundtripMessage = await message.channel.send({ content: 'Pong!' });
		return roundtripMessage.edit(
			`*${roundtripMessage.createdTimestamp - message.createdTimestamp}ms*`,
		);
	}
});

// Listening for error & warn events.
client.on('error', console.error);
client.on('warn', console.warn);

// We login into the bot.
client.login(config.token);
