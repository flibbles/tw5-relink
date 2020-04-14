/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

var prettylink = require("$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/prettylink.js");
var Placeholder = require("$:/plugins/flibbles/relink/js/utils/placeholder.js");

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

exports.logAll = function(entry, title, from, to, options) {
	var raw = exports.log[entry.name];
	if (entry.impossible) {
		return;
	}
	if (raw) {
		exports.logRelink(raw, entry, title, from, to, options);
		return;
	}
	if (!entry.children) {
		return;
	}
	for (var i = 0; i < entry.children.length; i++) {
		var args = entry.children[i];
		exports.logAll(args, title, from, to, options);
	}
};

exports.logRelink = function(raw, args, title, from, to, options) {
	raw = "Renaming '"+from+"' to '"+to+"' in " + raw + " of tiddler '"+title+"'";
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
		return value || ("<<"+key+">>"); });
	if (raw.indexOf('%c') >= 0) {
		// Doing a little bit of bold so the user sees
		// where we had to jump through hoops.
		console.log("%c" + msg, "", "font-weight: bold;");
	} else {
		console.log(msg);
	}
};

// This wraps alert so it can be monkeypatched during testing.
exports.alert = function(message) {
	alert(message);
};

exports.getString = function(title, options) {
	title = "$:/plugins/flibbles/relink/language/" + title;
	return options.wiki.renderTiddler("text/plain", title, options);
};

exports.failureAlert = "Relink was unable to update the following tiddlers due to the complexity of the title:";
var logger;

exports.reportFailures = function(failureList, options) {
	if (!logger) {
		logger = new $tw.utils.Logger("Relinker");
	}
	var alertString = this.getString("Error/ReportFailedRelinks", options)
	var placeholder = new Placeholder(options);
	var phOptions = $tw.utils.extend({placeholder: placeholder}, options);
	var alreadyReported = Object.create(null);
	var reportList = [];
	$tw.utils.each(failureList, function(f) {
		if (!alreadyReported[f]) {
			if ($tw.browser) {
				reportList.push("\n* " + prettylink.makeLink(f, undefined, phOptions));
			} else {
				reportList.push("\n* " + f);
			}
			alreadyReported[f] = true;
		}
	});
	logger.alert(placeholder.getPreamble() + alertString + "\n" + reportList.join(""));
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
