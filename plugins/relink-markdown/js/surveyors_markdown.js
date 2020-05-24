/*\
module-type: relinksurveyor
title: $:/plugins/flibbles/relink/js/surveyors/markdown.js
type: application/javascript

This looks for fromTitle where it's escaped for markdown. But this one
only installs if it looks like a markdown parser is plugged in.

\*/

var _rule;
function getLinkRule() {
	if (_rule === undefined) {
		_rule = null;
		// We also need our own rule to be activated and present
		$tw.utils.each($tw.modules.types.wikirule, function(module) {
			var exp = module.exports
			if (exp.name === "markdownlink") {
				_rule = exp;
			}
		});
	}
	return _rule;
};

exports.survey = function(text, fromTitle, options) {
	if (options.type === "text/x-markdown") {
		var module = getLinkRule();
		if (module) {
			return module.matchLink(text, 0);
		}
	}
	return false;
};
