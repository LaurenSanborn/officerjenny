var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

var jennyID = '548564374562799636';

/* var serverID = '548679023614492685';
var welcomeChannelID = '548679023614492693'; */
var serverID = '339135606502457344'; 			
var testChannelID = '549428035611394050';  		//jenny-test
var welcomeChannelID = '470378095103311872';	//real channel

//roleIDs
/* var adminID = "549311659274010624";
var richmondID = '548701435047444485';
var armadaID = '548720881241948161';
var newHavenID = '548720934484180992';
var newBaltimoreID = '548721654956556319';
var memphisID = '548721018471055370';
var mysticID = '548726406318653440';
var valorID = '548726370113683456';
var instinctID = '548726323984728104'; */

//roleIDs
var adminID = "343213676767215626";
var richmondID = '408038839601332224';
var armadaID = '408038356556054548';
var newHavenID = '408038898636423168';
var newBaltimoreID = '408038954634444818';
var memphisID = '408038488504795158';
var mysticID = '343212056423432194';
var valorID = '343212127294849024';
var instinctID = '343211717570068481';
	
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('guildMemberAdd', function(member) { 
	sendWelcome(welcomeChannelID, "<@!" + member.id + ">");
});

bot.on('messageCreate', function (user, userID, channelID, message, evt) {
	if (userID != jennyID && (channelID == welcomeChannelID || channelID == testChannelID) ) {
		
		logger.info("incoming message:" + message);
		logger.info("message id:" + evt.d.id);
		
		// Our bot first needs to know if it is being asked to execute a command
		// It will listen for messages that will start with `!`
		if (message.substring(0, 1) == '!') {
			var args = message.substring(1).split(' ');
			var cmd = args[0];
			var memberTag = args[1];
			logger.info(args);
       
			args = args.splice(1);
			switch(cmd) {
				// resend welcome prompt
				case 'welcome':
					sendWelcome(channelID, memberTag);
					break;
				// display rules
				case "rules":
					sendRules(channelID, memberTag);
					break;
				case "tutorial":
					// This is a Meowth command, but we still want to trigger the next question if they complete this step
					setTimeout(function() {
						sendRules(channelID, "<@!" + userId + ">");
					}, 50000);
					break;
			}
			bot.deleteMessage({
				channelID: channelID, 
				messageID: evt.d.id
			});
		//Check for screen shot (assumes an attachment is the screen shot)
		} else if (evt.d.attachments.length == 1) {
			typeMessage(channelID, "Oh, is that the screen shot I asked for?  If so, an <@&" + adminID + "> will come by sometime soon to review it. Thanks!");
			setTimeout(function() {
				typeMessage(channelID, "While we wait, could you tell me about yourself?  What team are you on (**Instinct**, **Mystic**, **Valor**)?");
			}, 10000);
			logger.info(evt.d.attachments[0].url);
			logger.info(evt.d.attachments[0].filename);
			bot.uploadFile({
				to: "256626217711697921",  //to me!
				file: evt.d.attachments[0].url,  //?
				message: user + " - welcome message attachment"
			});
		//Look for team keywords
		} else if (checkTeams(channelID, userID, message)) {
			setTimeout(function() {
				typeMessage(channelID, "Next, <@!" + userID + ">, tell me: where do you play \(**Armada**, **Memphis**, **Richmond**, **New Haven**, **New Baltimore**\)?");
			}, 10000);
		//Look for area keywords
		} else if (checkAreas(channelID, userID, message)) {
			setTimeout(function() {
				typeMessage(channelID, "<@!" + userID + ">, FYI this server uses Meowth bot to coordinate raids. It’s a little difficult to get used to, but very handy once you get the hang of it. There is an (optional) in-depth Meowth tutorial. To try it out, type: **!tutorial**");
			}, 10000);
		}
	}
	 
});

function sendWelcome(channelID, memberTag) {
	var welcomeMessage;
	
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
	var team = false;
		
	//Add to Mystic role
	if (message.search(/mystic/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: mysticID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: instinctID
		});
		typeMessage(channelID, "<:blanche:346144078292844556>: Wisdom over instinct; calm over valor. Blanche welcomes <@!" + userID + "> to <:mystic:346141360337977354>");
		team = true;
	}
		
	//Add to Valor role
	if (message.search(/valor/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: mysticID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: instinctID
		});
		typeMessage(channelID, "<:candela:346144078989361152>: In darkest night we are the flame! Candela welcomes <@!" + userID + "> to <:valor:346141360031793154>");
		team = true;
	}
		
	//Add to Instinct role
	if (message.search(/instinct/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: instinctID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: valorID
		});
		bot.removeFromRole({
			serverID: serverID,
			userID: userID,
			roleID: mysticID
		});
		typeMessage(channelID, "<:spark:346144078905212928>: There is no shelter from the storm! Spark welcomes <@!" + userID + "> to <:instinct:346141360132325377>");
		team = true;
	}
		
	return team;
}

function checkAreas(channelID, userID, message){
	var city = false;
		
	//Add to Richmond role
	if (message.search(/richmond/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: richmondID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Richmond?  That's great! I'll sign you up for Richmond notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to Armada Role
	if (message.search(/armada/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: armadaID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Armada?  That's great! I'll sign you up for Armada notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to New Haven role
	if (message.search(/new haven/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: newHavenID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in New Haven?  That's great! I'll sign you up for New Haven notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to New Baltimore role
	if (message.search(/new baltimore/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: newBaltimoreID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in New Baltimore?  That's great! I'll sign you up for New Baltimore notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Add to Memphis role
	if (message.search(/memphis/i) != -1) {
		bot.addToRole({
			serverID: serverID,
			userID: userID,
			roleID: memphisID
		});
		typeMessage(channelID, "<@!" + userID + ">, you play in Memphis?  That's great! I'll sign you up for Memphis notifications.  (You can turn this off later.)");
		city = true;
	}
		
	//Say something if they mention other key place names
	if (city == false 
		&& (message.search(/detroit/i) != -1 || message.search(/macomb/i) != -1 || message.search(/clemens/i) != -1 
			|| message.search(/claire shore/i) != -1 || message.search(/algonac/i) != -1 )) {
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
		bot.sendMessage({
			to: channelID,
			message: "OK, " + memberTag + "you are almost ready to go! Just look over these rules:\n\n"
				+ "**COMMUNITY RULES**\n"
				+ "- Please treat your fellow Trainers with dignity and respect. Rudeness and mean-spirited comments will not be tolerated here. Our community is all about having fun and helping each other out. This is extremely important since we are involved with planning real-world meetups. We want everyone to feel comfortable and safe both online and out in the field.\n\n"
				+ "- As we are a group revolving around an all-ages video game, coarse language and inappropriate topics are not allowed here. Whether or not a topic is appropriate is up to individual admin discretion.\n\n"
				+ "- Do not take any frustrations out on fellow Trainers in the community. We understand that Raids can often not go as planned, whether it's due to technical difficulty with Pokémon GO, other Trainers not being available for a Raid, or just bad luck. There will always be more Raids, and thus more chances to catch what you're hunting for.\n\n"
				+ "- No discussion of or links to programs or services that violate Pokémon GO's terms of service. We aim to play the game the way it was intended, and thus will not be employing any scanner bots or tolerate discussion of cheating methods here (such as \"spoofing\"). You are allowed to report Raids found through scanners or bots, but do not link to said scanner or bot software.\n\n"
				+ "Enter the command **!gotcha** to signify that you've read these rules and are ready to participate in our community!"
		});
	}
};

function typeMessage(channelID, message) {
		bot.simulateTyping(channelID);
		setTimeout(function() {
			bot.sendMessage({
				to: channelID,
				message: message
			});
		}, 1000);
};