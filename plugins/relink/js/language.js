/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.logRelink = function(message, args) {
	var msg = exports.log[message];
	if (msg) {
		for (var key in args) {
			// This is cheap, but whatevs. To do a proper
			// rendering would require working through a wiki
			// object. Too heavy weight for log messages.
			msg = msg.replace("<<"+key+">>", args[key]);
		}
		console.log(msg);
	} else {
		console.warn("No such log message: " + message);
	}
};

exports.log = {
	"import": "Renaming '<<from>>' to '<<to>>' in \\import filter operand of tiddler '<<tiddler>>'",
	"attribute": "Renaming '<<from>>' to '<<to>>' in <<type>> attribute <$<<element>> <<attribute>> /> of tiddler '<<tiddler>>'",
	"field": "Renaming '<<from>>' to '<<to>>' in <<field>> of tiddler '<<tiddler>>'"
};
