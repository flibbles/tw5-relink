/*\

This looks for fromTitle where it's escaped for markdown. But this one
only installs if it looks like a markdown parser is plugged in.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");

var _enabled;
function markdownEnabled(options) {
	if (_enabled === undefined) {
		var test = $tw.wiki.renderText("text/html", "text/x-markdown", "[test](#test)");
		_enabled = test.indexOf("<a") >= 0;
	}
	return _enabled;
};

exports.survey = function(text, fromTitle, options) {
	return markdownEnabled() && text.indexOf(utils.encodeLink(fromTitle)) >= 0;
};
