const Discord = require('discord.js');
const logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client();
bot.login(process.env.BOT_TOKEN).then(r => logger.info(r));

bot.on('ready', () => {
    logger.info('Connected');
	logger.info(`Logged in as ${bot.user.tag}!`);
	
	bot.user.setPresence({
		status: 'online',
		activity: {
			name: 'Welcome Bot v1.1',
			type: 0
		}
	}).then(presence => {
		logger.info(`Set bot presence to ${presence.activities[0]}.`);
		logger.info(`Set bot status to ${presence.status}.`);
	}).catch(console.error);
});

bot.on('disconnect', (errMsg, code) => {
	logger.info(`Disconnected! errMsg:${errMsg}, code:${code}`);
});

bot.on('guildMemberAdd', (member) => {
	logger.info(`New member. ${member.user.username}`);
	const newUserRole = member.guild.roles.cache.find(role => role.name === "new user");
	const welcomeChannel = bot.channels.cache.find(channel => channel.name === "welcome");

	//Add new member to new user role
	member.roles.add(newUserRole);
	
	//Send Welcome Prompt to the new member
	sendWelcome(welcomeChannel, member);
});

bot.on('guildMemberRemove', (member) => {
	logger.info(`Member left. ${member.user.username}`);
	const welcomeChannel = bot.channels.cache.find(channel => channel.name === "welcome");

	//Delete all messages that mention the user
	deleteMemberMentions(welcomeChannel, member);
	//Delete all messages that the user has posted
	deleteMemberMessages(welcomeChannel, member);
});

bot.on('message', (message) => {
	const user = message.author;
	const member = message.guild.members.cache.get(user.id);
	const adminRole = message.guild.roles.cache.find(role => role.name === "admin");
	const newUserRole = message.guild.roles.cache.find(role => role.name === "new user");
	const welcomeChannel = bot.channels.cache.find(channel => channel.name === "welcome");
	const adminChannel = bot.channels.cache.find(channel => channel.name === "admin");
	const chatChannel = bot.channels.cache.find(channel => channel.name === "chat");

	if (!user.bot && message.channel.id === welcomeChannel.id) {
		logger.info(`New Message. user: ${user.username}, message: ${message.content}`);
		
		// Our bot first needs to know if it is being asked to execute a command
		// It will listen for messages that will start with `!`
		if (message.content.startsWith("!")) {
			const args = message.content.substring(1).split(' ');
			const cmd = args[0];
			let mentionedMember = null;
			if(message.mentions.users.first()) {
				mentionedMember = message.guild.members.cache.get(message.mentions.users.first().id);
			}

			logger.info(`Command detected. args: ${args}`);
			switch(cmd) {
				case 'welcome':
					//TODO: Verify admin privileges
					//Send Welcome Prompt to the user mentioned
					sendWelcome(welcomeChannel, mentionedMember);
					break;
				case "rules":
					//TODO: Verify admin privileges
					//Send Rules Prompt to the user mentioned
					sendRules(welcomeChannel, mentionedMember);
					break;
				case "gotcha":
					member.roles.remove(newUserRole).then(() => logger.info(`Removed ${member.user.username} from new user role.`));
					chatChannel.send(`<:willow:346144079198945280>: Everyone, welcome ${member.displayName} to ${message.guild.name}!`)
					//Delete all messages that mention the user
					deleteMemberMentions(welcomeChannel, member);
					//Delete all messages that the user has posted
					deleteMemberMessages(welcomeChannel, member);
					break;
			}

			//Delete command
			message.delete();

		//Check for screen shot (assumes an attachment is the screen shot)
		} else if (message.attachments.array().length === 1) {
			setTimeout(() => {
				welcomeChannel.send(`Oh, is that the screen shot I asked for?  If so, an <@&${adminRole.id}> will come by sometime soon to review it. Thanks, <@!${user.id}>!`);
			}, 2000);
			//Send Team prompt to user
			setTimeout(() => {
				welcomeChannel.send(`While we wait, <@!${user.id}>, could you tell me about yourself?  What team are you on (**Instinct**, **Mystic**, **Valor**)?`);
			}, 2000);
			//Forward message to admin channel
			let attachments = message.attachments.array();
			adminChannel.send(`Verification needed for user ${user.username}. ${attachments[0].proxyURL}`);
		//Look for team keywords
		} else if (checkTeams(welcomeChannel, member, message)) {
			setTimeout(() => {
				//Send Areas prompt to user
				welcomeChannel.send(`Next, <@!${user.id}>, tell me: where do you play (**Armada**, **Memphis**, **Richmond**, **New Haven**, **New Baltimore**, **Chesterfield**)?`);
			}, 2000);
		//Look for area keywords
		} else if (checkAreas(welcomeChannel, member, message)) {
			//Send Rules Prompt to user
			setTimeout(() => {
				sendRules(welcomeChannel, member);
			}, 5000);
		}
	}
	 
});

function sendWelcome(channel, member) {
	let memberStr;
	if (member) {
		logger.info(`Sending welcome message to ${member.user.username}`);
		memberStr = `<@!${member.user.id}>`;
	} else {
		logger.info(`Sending general welcome message`);
		const newUserRole = member.guild.roles.cache.find(role => role.name === "new user");
		memberStr = `<@&${newUserRole.id}>`;
	}

	//Create welcome text
	const welcomeMessage = `Hold it right there! I need to check your trainer information before I can let you through, ${memberStr}!

Please take a screen shot of your player profile in the game and post it here.

Here's an example:`;

	// Create the attachment
	const attachment = new Discord.MessageAttachment('screenshot.jpg');

	//display initial welcome message
	channel.send(welcomeMessage, attachment);
}

function checkTeams(channel, member, message) {
	const mysticRole = message.guild.roles.cache.find(role => role.name === "mystic");
	const valorRole = message.guild.roles.cache.find(role => role.name === "valor");
	const instinctRole = message.guild.roles.cache.find(role => role.name === "instinct");

	let team = true;

	if (/mystic/i.test(message)) {
		logger.info(`Assigning mystic role to ${member.user.username}`);
		member.roles.add(mysticRole);
		member.roles.remove(valorRole).then(() => logger.info(`Removed ${member.user.username} from valor.`));
		member.roles.remove(instinctRole).then(() => logger.info(`Removed ${member.user.username} from instinct.`));
		channel.send(`<:blanche:346144078292844556>: Wisdom over instinct; calm over valor. Blanche welcomes <@!${member.user.id}> to <:mystic:346141360337977354>`);
	} else if (/valor/i.test(message)) {
		logger.info(`Assigning valor role to ${member.user.username}`);
		member.roles.add(valorRole);
		member.roles.remove(mysticRole).then(() => logger.info(`Removed ${member.user.username} from mystic.`));
		member.roles.remove(instinctRole).then(() => logger.info(`Removed ${member.user.username} from instinct.`));
		channel.send(`<:candela:346144078989361152>: In darkest night we are the flame! Candela welcomes <@!${member.user.id}> to <:valor:346141360031793154>`);
	} else if (/instinct/i.test(message)) {
		logger.info(`Assigning instinct role to ${member.user.username}`);
		member.roles.add(instinctRole);
		member.roles.remove(mysticRole).then(() => logger.info(`Removed ${member.user.username} from mystic.`));
		member.roles.remove(valorRole).then(() => logger.info(`Removed ${member.user.username} from valor.`));
		channel.send(`<:spark:346144078905212928>: There is no shelter from the storm! Spark welcomes <@!${member.user.id}> to <:instinct:346141360132325377>`);
	} else {
		team = false;
	}
		
	return team;
}

function checkAreas(channel, member, message){
	const richmondRole = message.guild.roles.cache.find(role => role.name === "richmond");
	const armadaRole = message.guild.roles.cache.find(role => role.name === "armada");
	const newHavenRole = message.guild.roles.cache.find(role => role.name === "newhaven");
	const newBaltimoreRole = message.guild.roles.cache.find(role => role.name === "newbaltimore");
	const memphisRole = message.guild.roles.cache.find(role => role.name === "memphis");
	const chesterfieldRole = message.guild.roles.cache.find(role => role.name === "chesterfield");
	let city = false;

	//Add to Richmond role
	if (/richmond/i.test(message)) {
		logger.info(`Assigning richmond role to ${member.user.username}`);
		member.roles.add(richmondRole);
		channel.send(`<@!${member.user.id}>, you play in Richmond?  That's great! I'll sign you up for Richmond notifications.  (You can turn this off later.)`);
		city = true;
	}
		
	//Add to Armada Role
	if (/armada/i.test(message)) {
		logger.info(`Assigning armada role to ${member.user.username}`);
		member.roles.add(armadaRole);
		channel.send(`<@!${member.user.id}>, you play in Armada?  That's great! I'll sign you up for Armada notifications.  (You can turn this off later.)`);
		city = true;
	}
		
	//Add to New Haven role
	if (/new *haven/i.test(message)) {
		logger.info(`Assigning newhaven role to ${member.user.username}`);
		member.roles.add(newHavenRole);
		channel.send(`<@!${member.user.id}>, you play in New Haven?  That's great! I'll sign you up for New Haven notifications.  (You can turn this off later.)`);
		city = true;
	}
		
	//Add to New Baltimore role
	if (/new *baltimore/i.test(message)) {
		logger.info(`Assigning newbaltimore role to ${member.user.username}`);
		member.roles.add(newBaltimoreRole);
		channel.send(`<@!${member.user.id}>, you play in New Baltimore?  That's great! I'll sign you up for New Baltimore notifications.  (You can turn this off later.)`);
		city = true;
	}
		
	//Add to Memphis role
	if (/memphis/i.test(message)) {
		logger.info(`Assigning memphis role to ${member.user.username}`);
		member.roles.add(memphisRole);
		channel.send(`<@!${member.user.id}>, you play in Memphis?  That's great! I'll sign you up for Memphis notifications.  (You can turn this off later.)`);
		city = true;
	} 
	
	//Add to Chesterfield role
	if (/chesterfield/i.test(message)) {
		logger.info(`Assigning chesterfield role to ${member.user.username}`);
		member.roles.add(chesterfieldRole);
		channel.send(`<@!${member.user.id}>, you play in Chesterfield?  That's great! I'll sign you up for Chesterfield notifications.  (You can turn this off later.)`);
		city = true;
	}
		
	//Say something if they mention other key place names
	if (!city && /detroit|macomb|clemens|claire *shore|algonac|michigan|sterling *heights|shelby|marine *city|utica/i.test(message)) {
		logger.info(`Sending informational city role message to ${member.user.username}`);
		channel.send(`<@!${member.user.id}>, just FYI we serve Northeast Macomb (Armada, Memphis, Richmond, New Haven, & New Baltimore). You are certainly welcome to join even if you only play in these areas occasionally!`);
		city = true;
	}
		
	return city;
}

function sendRules(channel, member) {

	if (member) {
		//send rules and !gotcha instructions
		logger.info(`Sending rules to ${member.user.username}`);
		channel.send(`OK, <@!${member.user.id}>, you are almost ready to go! Just look over these rules:
		
**COMMUNITY RULES**
- Please treat your fellow Trainers with dignity and respect. Rudeness and mean-spirited comments will not be tolerated here. Our community is all about having fun and helping each other out. This is extremely important since we are involved with planning real-world meetups. We want everyone to feel comfortable and safe both online and out in the field.
				
- As we are a group revolving around an all-ages video game, coarse language and inappropriate topics are not allowed here. Whether or not a topic is appropriate is up to individual admin discretion.
				
- Do not take any frustrations out on fellow Trainers in the community. We understand that Raids can often not go as planned, whether it's due to technical difficulty with Pokémon GO, other Trainers not being available for a Raid, or just bad luck. There will always be more Raids, and thus more chances to catch what you're hunting for.
				
- No discussion of or links to programs or services that violate Pokémon GO's terms of service. We aim to play the game the way it was intended, and thus will not be employing any scanner bots or tolerate discussion of cheating methods here (such as "spoofing"). You are allowed to report Raids found through scanners or bots, but do not link to said scanner or bot software.
				
Enter the command **!gotcha** to signify that you've read these rules and are ready to participate in our community!`
		);
	}
}

function deleteMemberMentions(channel, member) {
	logger.info(`Deleting messages that mention user ${member.user.username} in ${channel.name}.`);
	channel.messages.fetch({limit: 100})
		.then(messages => {
			messages.array().forEach( message => {
				if (message.mentions.has(member)) {
					message.delete({timeout: 1000})
						.then(msg => logger.debug(`Deleted message: ${msg.type} | ${msg.content}`))
				}
			})
		});
}

function deleteMemberMessages(channel, member) {
	logger.info(`Deleting messages that were created by ${member.user.username} in ${channel.name}.`);
	channel.messages.fetch({limit: 100})
		.then(messages => {
			messages.array().forEach(message => {
				if (message.author.id === member.id) {
					message.delete({timeout: 1000})
						.then(msg => logger.debug(`Deleted message: ${msg.type} | ${msg.content}`));
				}
			})
		});
}