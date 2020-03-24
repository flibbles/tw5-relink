/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.Logger = function() {
	this.children = [];
};

exports.eachImpossible = function(rootEntry, method) {
	if (rootEntry.children && rootEntry.children.length > 0) {
		for (var i = 0; i < rootEntry.children.length; i++) {
			exports.eachImpossible.call(this, rootEntry.children[i], method);
		}
	}
	if (rootEntry.impossible) {
		method(rootEntry);
	}
};

exports.Logger.prototype.add = function(args) {
	if (args) {
		this.children.push(args);
	}
};

exports.Logger.prototype.logAll = function(title, from, to, options) {
	if (!this.children) {
		return;
	}
	for (var i = 0; i < this.children.length; i++) {
		var args = this.children[i];
		if (args.impossible) {
			continue;
		}
		args.tiddler = title;
		args.to = to;
		args.from = from;
		var raw = exports.log[args.name];
		if (raw) {
			exports.logRelink(raw, args, options);
		} else {
			exports.Logger.prototype.logAll.call(args, title, from, to, options);
		}
	}
};

exports.logRelink = function(raw, args, options) {
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
