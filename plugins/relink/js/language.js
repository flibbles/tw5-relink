/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

var prettylink = require("$:/plugins/flibbles/relink/js/relinkoperations/text/wikitext/prettylink.js");
var Placeholder = require("$:/plugins/flibbles/relink/js/utils/placeholder.js");

exports.eachImpossible = function(rootEntry, method) {
	if (rootEntry.eachChild) {
		rootEntry.eachChild(function(child) {
			exports.eachImpossible.call(this, child, method);
		});
	}
	if (rootEntry.impossible) {
		method(rootEntry);
	}
};

exports.logAll = function(entry, title, from, to) {
	var report = entry.report();
	for (var i = 0; i < report.length; i++) {
		console.log(logRelink(report[i], title, from, to));
	}
};

function logRelink(raw, title, from, to) {
	return "Renaming '"+from+"' to '"+to+"' in '" + title + "': "+raw;
};

// This wraps alert so it can be monkeypatched during testing.
exports.alert = function(message) {
	alert(message);
};

exports.getString = function(title, options) {
	title = "$:/plugins/flibbles/relink/language/" + title;
	return options.wiki.renderTiddler("text/plain", title, options);
};

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
