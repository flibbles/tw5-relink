/*\
module-type: relinksurveyor
title: $:/plugins/flibbles/relink/js/surveyors/markdown.js
type: application/javascript

This looks for fromTitle where it's escaped for markdown. But this one
only installs if it looks like a markdown parser is plugged in.

\*/

var _rules;
function getRules() {
	if (_rules === undefined) {
		_rules = [];
		var names = ["markdownlink", "markdownfootnote"];
		// We also need our own rule to be activated and present
		$tw.utils.each($tw.modules.types.wikirule, function(module) {
			var exp = module.exports
			if (names.indexOf(exp.name) >= 0) {
				_rules.push(exp);
			}
		});
	}
	return _rules;
};

exports.survey = function(text, fromTitle, options) {
	if (options.type === "text/x-markdown") {
		var modules = getRules();
		for (var i = 0; i < modules.length; i++) {
			if (modules[i].survey(text)) {
				return true;
			}
		}
	}
	return false;
};
