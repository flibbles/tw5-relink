/*\

This looks for fromTitle where it's escaped for markdown. But this one
only installs if it looks like a markdown parser is plugged in.

\*/

var _enabled;
function markdownEnabled(options) {
	if (_enabled === undefined) {
		var test = $tw.wiki.renderText("text/html", "text/x-markdown", "[test](#test)");
		_enabled = test.indexOf("<a") >= 0;
	}
	return _enabled;
};

exports.survey = function(text, fromTitle, options) {
	return markdownEnabled() && text.indexOf(escapeString(fromTitle)) >= 0;
};

function escapeString(title) {
	return title.replace(' ', '%20');
};
