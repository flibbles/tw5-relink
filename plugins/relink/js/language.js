/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

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
	var alreadyReported = Object.create(null);
	var reportList = [];
	$tw.utils.each(failureList, function(f) {
		if (!alreadyReported[f]) {
			if ($tw.browser) {
				// This might not make the link if the title is complicated.
				// Whatever.
				reportList.push("\n* [[" + f + "]]");
			} else {
				reportList.push("\n* " + f);
			}
			alreadyReported[f] = true;
		}
	});
	logger.alert(alertString + "\n" + reportList.join(""));
};

function logRelink(raw, title, from, to) {
	return "Renaming '"+from+"' to '"+to+"' in '" + title + "': "+raw;
};
