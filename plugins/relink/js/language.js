/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.logRelink = function(message, args) {
	var msg = exports.log[message];
	if (msg) {
		// This is cheap, but whatevs. To do a proper
		// rendering would require working through a wiki
		// object. Too heavy weight for log messages.
		msg = msg.replace(/<<([^>]+)>>/g, function(match, key) {
			return args[key] || ("<<"+key+">>");
		});
		console.log(msg);
	} else {
		console.warn("No such log message: " + message);
	}
};

exports.log = {
	"attribute": "Renaming '<<from>>' to '<<to>>' in <<type>> attribute <$<<element>> <<attribute>> /> of tiddler '<<tiddler>>'",
	"field": "Renaming '<<from>>' to '<<to>>' in <<field>> of tiddler '<<tiddler>>'",
	"import": "Renaming '<<from>>' to '<<to>>' in \\import filter operand of tiddler '<<tiddler>>'",
	"macrodef": "Renaming '<<from>>' to '<<to>>' in <<macro>> definition of tiddler '<<tiddler>>'",
	"prettylink": "Renaming '<<from>>' to '<<to>>' in prettylink of tiddler '<<tiddler>>'",
	"prettylink-placeholder": "Renaming '<<from>>' to '<<to>>' in prettylink of tiddler '<<tiddler>>' by creating placeholder macros",
	"transclude": "Renaming '<<from>>' to '<<to>>' in transclusion of tiddler '<<tiddler>>'",
	"wikilink": "Renaming '<<from>>' to '<<to>>' in CamelCase link of tiddler '<<tiddler>>'",
	"wikilink-pretty": "Renaming '<<from>>' to '<<to>>' in CamelCase link of tiddler '<<tiddler>>' by converting it into a prettylink"
};
