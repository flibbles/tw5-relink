/*\
module-type: library

This handles all logging and alerts Relink emits.

\*/

exports.getString = function(outputType, title, options) {
	title = "$:/plugins/flibbles/relink/language/" + title;
	return options.wiki.renderTiddler(outputType, title, options);
};

var logger;

exports.warn = function(string, options) {
	if (!logger) {
		logger = new $tw.utils.Logger("Relinker");
	}
	logger.alert(string);
};

exports.reportFailures = function(failureList, options) {
	var alertString = this.getString("text/html", "Error/ReportFailedRelinks", options)
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
	this.warn(alertString + "\n" + reportList.join(""));
};
