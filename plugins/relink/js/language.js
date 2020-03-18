/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.Logger = function(title, from, to) {
	this.title = title;
	this.from = from;
	this.to = to;
	this.logs = [];
};

exports.Logger.prototype.add = function(args) {
	this.logs.push(args);
};

exports.Logger.prototype.addToFailures = function(list) {
	for (var i = 0; i < this.logs.length; i++) {
		var args = this.logs[i];
		if (args.impossible) {
			list.push(this.title);
		}
	}
};

exports.Logger.prototype.logAll = function(options) {
	if (options.quiet) {
		return;
	}
	for (var i = 0; i < this.logs.length; i++) {
		var args = this.logs[i];
		if (args.impossible) {
			continue;
		}
		args.tiddler = this.title;
		args.to = this.to;
		args.from = this.from;
		exports.logRelink(args.name, args, options);
	}
};

exports.logRelink = function(message, args, options) {
	if (options.quiet) {
		return;
	}
	var raw = exports.log[message];
	if (raw) {
		raw = "Renaming '"+args.from+"' to '"+args.to+"' in " + raw + " of tiddler '"+args.tiddler+"'";
		if (args.placeholder) {
			if (args.widget) {
				raw = raw + " %cby converting it into a widget and creating placeholder macros";
			} else {
				raw = raw + " %cby creating placeholder macros";
			}
		} else if (args.widget) {
			raw = raw + " %cby converting it into a widget";
		}
		if (args.pretty) {
			raw = raw + " %cby converting it into a prettylink";
		}
		// This is cheap, but whatevs. To do a proper
		// rendering would require working through a wiki
		// object. Too heavy weight for log messages.
		var msg = raw.replace(/<<([^<>]+)>>/g, function(match, key) {
			var value = args[key];
			if (key === "field") {
				value = descriptor(value);
			};
			return value || ("<<"+key+">>");
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

exports.getString = function(title, options) {
	title = "$:/plugins/flibbles/relink/language/" + title;
	return options.wiki.renderTiddler("text/plain", title,
	                                  {variables: options.variables});
};

exports.failureAlert = "Relink was unable to update the following tiddlers due to the complexity of the title:";

exports.reportFailures = function(failureList) {
	var reportList = failureList.map(function(f) {return "\n   " + f});
	console.warn(exports.failureAlert + reportList);
};

exports.log = {
	"attribute": "<<<element>> <<attribute>> /> attribute",
	"field": "<<field>>",
	"filteredtransclude": "filtered transclusion",
	"image": "image",
	"import": "\\import filter",
	"macrodef": "<<macro>> definition",
	"prettylink": "prettylink",
	"transclude": "transclusion",
	"wikilink": "CamelCase link",
};

function descriptor(field) {
	if (field === "tags") {
		return "tags";
	} else {
		return field + " field" ;
	}
};
