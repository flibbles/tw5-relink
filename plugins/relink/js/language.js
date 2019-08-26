/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.logRelink = function(message, args) {
	var raw = exports.log[message];
	if (raw) {
		// This is cheap, but whatevs. To do a proper
		// rendering would require working through a wiki
		// object. Too heavy weight for log messages.
		var msg = raw.replace(/<<([^<>]+)>>/g, function(match, key) {
			return args[key] || ("<<"+key+">>");
		});
		if (raw.indexOf('%c') >= 0) {
			// Doing a little bit of bold so the user sees
			// where we had to jump through hoops.
			console.log("%c" + msg, "", "font-weight: bold;");
		} else {
			console.log(msg);
		}
	} else {
		console.warn("No such log message: " + message);
	}
};

exports.log = {
	"attribute": "Renaming '<<from>>' to '<<to>>' in <<<element>> <<attribute>> /> attribute of tiddler '<<tiddler>>'",
	"attribute-placeholder": "Renaming '<<from>>' to '<<to>>' in <<<element>> <<attribute>> /> attribute of tiddler '<<tiddler>>' %cby creating placeholder macros",
	"field": "Renaming '<<from>>' to '<<to>>' in <<field>> of tiddler '<<tiddler>>'",
	"import": "Renaming '<<from>>' to '<<to>>' in \\import filter operand of tiddler '<<tiddler>>'",
	"macrodef": "Renaming '<<from>>' to '<<to>>' in <<macro>> definition of tiddler '<<tiddler>>'",
	"prettylink": "Renaming '<<from>>' to '<<to>>' in prettylink of tiddler '<<tiddler>>'",
	"prettylink-placeholder": "Renaming '<<from>>' to '<<to>>' in prettylink of tiddler '<<tiddler>>' %cby creating placeholder macros",
	"transclude": "Renaming '<<from>>' to '<<to>>' in transclusion of tiddler '<<tiddler>>'",
	"wikilink": "Renaming '<<from>>' to '<<to>>' in CamelCase link of tiddler '<<tiddler>>'",
	"wikilink-pretty": "Renaming '<<from>>' to '<<to>>' in CamelCase link of tiddler '<<tiddler>>' %cby converting it into a prettylink"
};
