/*\
module-type: relinksurveyor
title: $:/plugins/flibbles/relink/js/surveyors/markdown.js
type: application/javascript

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
	return _enabled && options.type === "text/x-markdown";
};

var decoded, encoded;

exports.survey = function(text, fromTitle, options) {
	if (markdownEnabled(options)) {
		if (fromTitle !== decoded) {
			decoded = fromTitle;
			// Because survey can be called thousands of times with the same
			// fromTitle, we have a one-value cache for holding that value's
			// encoded version.
			// It's an optimization, but that's what the surveyors are for.
			// Encoding is expensive.
			encoded = utils.encodeLink(decoded);
			if (encoded === decoded) {
				// The two are the same. So the raw surveyor will find it.
				// No need for this one.
				encoded = null;
			}
		}
		if (encoded !== null) {
			return text.indexOf(encoded) >= 0;
		}
	}
	return false;
};
