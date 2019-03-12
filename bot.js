var Discord = require('discord.io');
var logger = require('winston');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: process.env.BOT_TOKEN,
   autorun: true
});

var serverID = '339135606502457344'; 			
var testChannelID = '549428035611394050';  		//jenny-test
var welcomeChannelID = '470378095103311872';	//real channel
var adminChannelID = '343405095037304843';

//roleIDs
var adminID = "343213676767215626";
var newUserID = "346093568093585410";
var richmondID = '408038839601332224';
var armadaID = '408038356556054548';
var newHavenID = '408038898636423168';
var newBaltimoreID = '408038954634444818';
var memphisID = '408038488504795158';
var chesterfieldID = '554415178972790785';
var mysticID = '343212056423432194';
var valorID = '343212127294849024';
var instinctID = '343211717570068481';

var mods = ["256626217711697921", "173958118001213441"];

	
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
	
	bot.setPresence({
		game: {name:"Welcome Bot v1.0"}
	});
});

bot.on('disconnect', function(errMsg, code) { 
	logger.info("Disconnected! errMsg:" + errMsg + ", code:" + code);
	bot.connect();
});

bot.on('guildMemberAdd', function(member) {
	//TODO: Add new member to new user role
	console.log(member);
	
	//Send Welcome Prompt to the new member
	sendWelcome(welcomeChannelID, "<@!" + member.id + ">");
});

bot.on('messageCreate', function (user, userID, channelID, message, evt) {
	if (!bot.users[userID].bot && (channelID == welcomeChannelID || channelID == testChannelID) ) {
		
		logger.info("New Message. user: " + user 
			+ ",id: " + evt.d.id
			+ ", message: " + message);
		
		// Our bot first needs to know if it is being asked to execute a command
		// It will listen for messages that will start with `!`
		if (message.substring(0, 1) == '!') {
			var args = message.substring(1).split(' ');
			var cmd = args[0];
			var memberTag = args[1];
			logger.info("Command detected. args: " + args);
			switch(cmd) {
				case 'welcome':
					//TODO: Verify admin privileges
					//Delete command
					bot.deleteMessage({
						channelID: channelID, 
						messageID: evt.d.id
					});
					//Send Welcome Prompt to the user mentioned
					setTimeout(function() {
						sendWelcome(channelID, memberTag);
					}, 100);
					break;
				case "rules":
					//TODO: Verify admin privileges
					//Delete command
					bot.deleteMessage({
						channelID: channelID, 
						messageID: evt.d.id
					});
					//Send Rules Prompt to the user mentioned
					sendRules(channelID, memberTag);
					break;
				case "gotcha":	// This is a custom Dyno command, but we want it to do more
					//Delete all messages that mention the user
					setTimeout(function() {
						deleteUserMentions(channelID, userID);
					}, 500);
					//Delete all messages that the user has posted
					setTimeout(function() {
						deleteUserMessages(channelID, userID);
					}, 500);
					break;
			}

		//Check for screen shot (assumes an attachment is the screen shot)
		} else if (evt.d.attachments.length == 1) {
			typeMessage(channelID, "Oh, is that the screen shot I asked for?  If so, an <@&" 
				+ adminID + "> will come by sometime soon to review it. Thanks, <@!" + userID + ">!");
			//Send Team prompt to user
			setTimeout(function() {
				typeMessage(channelID, "While we wait, <@!" + userID + ">, could you tell me about yourself?  What team are you on (**Instinct**, **Mystic**, **Valor**)?");
			}, 5000);
			//Forward message to admin channel
			bot.sendMessage({
				to: adminChannelID,
				message: " Verification needed for user " + user + ".\n" 
						+ evt.d.attachments[0].proxy_url 
			});
			//Forward screen shot via DM to all mods
			setTimeout(function() {
				for (var i=0; i < mods.length; i++) {
					logger.info("Sending verification DM to: " + mods[i] + ", url:" + evt.d.attachments[0].proxy_url);
					bot.sendMessage({
						to: mods[i],
						message: " Verification needed for user " + user + ".\n" 
							+ evt.d.attachments[0].proxy_url 
					});
				}
			}, 115000);
		//Look for team keywords
		} else if (checkTeams(channelID, userID, message)) {
			setTimeout(function() {
				//Send Areas prompt to user
				typeMessage(channelID, "Next, <@!" + userID + ">, tell me: where do you play \(**Armada**, **Memphis**, **Richmond**, **New Haven**, **New Baltimore**, **Chesterfield**\)?");
			}, 5000);
		//Look for area keywords
		} else if (checkAreas(channelID, userID, message)) {
			//Send Tutorial prompt to user
			setTimeout(function() {
				typeMessage(channelID, "<@!" + userID + ">, this server uses Meowth bot to coordinate raids. It’s a little difficult to get used to, but very handy once you get the hang of it. There is an (optional) in-depth Meowth tutorial. To try it out, type: **!tutorial**");
			}, 5000);
			//Send Rules Prompt to user after a 5 minute pause.
			setTimeout(function() {
				sendRules(channelID, "<@!" + userID + ">");
			}, 235000);
		}
	}
	 
});

function sendWelcome(channelID, memberTag) {
	var welcomeMessage;
	
	logger.info('Sending welcome message to ' + memberTag );
	
	if (memberTag == undefined) {
		welcomeMessage = "Hold it right there! I need to check your trainer information before I can let you through!\n\nPlease take a screen shot of your player profile in the game and post it here.\n\nHere's an example:";
	} else {
		welcomeMessage = "Hold it right there! I need to check your trainer information before I can let you through, " + memberTag + "!\n\nPlease take a screen shot of your player profile in the game and post it here.\n\nHere's an example:";
	}
	
	//display initial welcome message
	bot.uploadFile({
		to: channelID,
		file: 'screenshot.jpg',
		message: welcomeMessage
	});
};

function checkTeams(channelID, userID, message) {
	var team = true;
		
	if (message.search(/mystic/i) != -1) {
		logger.info('Assigning mystic role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: mysticID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: instinctID
		});
		typeMessage(channelID, "<:blanche:346144078292844556>: Wisdom over instinct; calm over valor. Blanche welcomes <@!" + userID + "> to <:mystic:346141360337977354>");
	} else if (message.search(/valor/i) != -1) { 
		logger.info('Assigning valor role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: mysticID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: instinctID
		});
		typeMessage(channelID, "<:candela:346144078989361152>: In darkest night we are the flame! Candela welcomes <@!" + userID + "> to <:valor:346141360031793154>");
	} else if (message.search(/instinct/i) != -1) {
		logger.info('Assigning instinct role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: instinctID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: mysticID
		});
		typeMessage(channelID, "<:spark:346144078905212928>: There is no shelter from the storm! Spark welcomes <@!" + userID + "> to <:instinct:346141360132325377>");
	} else {
		team = false;
	}
		
	return team;
}

function checkAreas(channelID, userID, message){
	var city = false;
		
	//Add to Richmond role
	if (message.search(/richmond/i) != -1) {
		logger.info('Assigning richmond role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: richmondID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Richmond?  That's great! I'll sign you up for Richmond notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to Armada Role
	if (message.search(/armada/i) != -1) {
		logger.info('Assigning armada role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: armadaID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Armada?  That's great! I'll sign you up for Armada notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to New Haven role
	if (message.search(/new haven/i) != -1) {
		logger.info('Assigning newhaven role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: newHavenID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in New Haven?  That's great! I'll sign you up for New Haven notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to New Baltimore role
	if (message.search(/new baltimore/i) != -1) {
		logger.info('Assigning newbaltimore role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: newBaltimoreID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in New Baltimore?  That's great! I'll sign you up for New Baltimore notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to Memphis role
	if (message.search(/memphis/i) != -1) {
		logger.info('Assigning memphis role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: memphisID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Memphis?  That's great! I'll sign you up for Memphis notifications.  (You can turn this off later.)");
		city = true;
	} 
	
	//Add to Chesterfield role
	if (message.search(/chesterfield/i) != -1) {
		logger.info('Assigning chesterfield role to ' + bot.users[userID].username );
		bot.addToRole({
			serverID: bot.channels[channelID].guild_id,
			userID: userID,
			roleID: chesterfieldID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Chesterfield?  That's great! I'll sign you up for Chesterfield notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Say something if they mention other key place names
	if (city == false 
		&& (message.search(/detroit/i) != -1 || message.search(/macomb/i) != -1 || message.search(/clemens/i) != -1 
			|| message.search(/claire shore/i) != -1 || message.search(/algonac/i) != -1 )) {
		logger.info('Sending informational city role message to ' + bot.users[userID].username );
		typeMessage(channelID, "<@!" + userID + ">, just FYI we serve Northeast Macomb (Armada, Memphis, Richmond, New Haven, & New Baltimore). You are certainly welcome to join even if you only play in these areas occasionally!" );
		city = true;
	}
		
	return city;
};

function sendRules(channelID, memberTag) {
	if (memberTag == undefined) {
		//TODO: create error
	} else {
		//send rules and !gotcha instructions
		logger.info('Sending rules to ' + memberTag );
		bot.sendMessage({
			to: channelID,
			message: "OK, " + memberTag + ", you are almost ready to go! Just look over these rules:\n\n"
				+ "**COMMUNITY RULES**\n"
				+ "- Please treat your fellow Trainers with dignity and respect. Rudeness and mean-spirited comments will not be tolerated here. Our community is all about having fun and helping each other out. This is extremely important since we are involved with planning real-world meetups. We want everyone to feel comfortable and safe both online and out in the field.\n\n"
				+ "- As we are a group revolving around an all-ages video game, coarse language and inappropriate topics are not allowed here. Whether or not a topic is appropriate is up to individual admin discretion.\n\n"
				+ "- Do not take any frustrations out on fellow Trainers in the community. We understand that Raids can often not go as planned, whether it's due to technical difficulty with Pokémon GO, other Trainers not being available for a Raid, or just bad luck. There will always be more Raids, and thus more chances to catch what you're hunting for.\n\n"
				+ "- No discussion of or links to programs or services that violate Pokémon GO's terms of service. We aim to play the game the way it was intended, and thus will not be employing any scanner bots or tolerate discussion of cheating methods here (such as \"spoofing\"). You are allowed to report Raids found through scanners or bots, but do not link to said scanner or bot software.\n\n"
				+ "Enter the command **!gotcha** to signify that you've read these rules and are ready to participate in our community!"
		});
	}
};

function deleteUserMentions(channelID, userID) {
	var messageIDs = [];
	
	bot.getMessages({
		channelID: channelID,
		limit: 50
	}, function(err, messages) {
		if (err) {
			console.log(err.name + " " + err.statusCode + " " + err.statusMessage);
		} else {
			for(var i=0; i < messages.length; i++){
				for(var j=0; j < messages[i].mentions.length; j++){
					if (messages[i].mentions[j].id == userID) {
						logger.info("Deleting message. id:" + messages[i].id);
						messageIDs.push(messages[i].id);
					}
				}
			}
			
			setTimeout(function() {
				if (messageIDs.length == 1) {
					bot.deleteMessage({
						channelID: channelID, 
						messageID: messageIDs[0]
					});
				} else {
					deleteMessages(channelID, messageIDs);
				}
			}, 1000);
		}
	});
};

function deleteUserMessages(channelID, userID) {
	var messageIDs = [];
	
	bot.getMessages({
		channelID: channelID,
		limit: 50
	}, function(err, messages) {
		if (err) {
			console.log(err.name + " " + err.statusCode + " " + err.statusMessage);
		} else {
			for(var i=0; i < messages.length; i++){
				if (messages[i].author.id == userID) {
					logger.info("Deleting message. id:" + messages[i].id);
					messageIDs.push(messages[i].id);
				}
			}
			
			setTimeout(function() {
				if (messageIDs.length == 1) {
					bot.deleteMessage({
						channelID: channelID, 
						messageID: messageIDs[0]
					});
				} else {
					deleteMessages(channelID, messageIDs);
				}
			}, 1000);
		}
	});
};

function deleteMessages(channelID, messageIDs) {
	bot.deleteMessages({
		channelID: channelID,
		messageIDs: messageIDs,
	}, function(err,m) {
		if (err) {
			console.log(err.name + " " + err.statusCode + " " + err.statusMessage);
			if (err.statusCode == 429) { 
				setTimeout(function() {
					deleteMessages(channelID, messageIDs);
				}, err.response.retry_after);
			}
		}
	});
};


function typeMessage(channelID, message) {
		bot.simulateTyping(channelID);
		setTimeout(function() {
			bot.sendMessage({
				to: channelID,
				message: message
			});
		}, 4000);
};
