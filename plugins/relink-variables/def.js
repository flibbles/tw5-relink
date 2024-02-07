/*\
module-type: relinkdef
title: $:/plugins/flibbles/relink-variables/def.js
type: application/javascript

\*/

var utils = require("./utils.js");

exports.name = 'variables';

exports.report = function() {
	// While we'll relink definition names, we don't actually
	// report on them since that would be redundant.
	// The user is looking at the definition to see what's referencing it.
};

exports.relink = function(definition, fromTitle, toTitle, options) {
	var cleanFrom = utils.removePrefix(fromTitle);
	// We skip the immediate context, because that's THIS definition
	var tiddler = options.settings.parent.getFocus().title;
	if (tiddler
	&& cleanFrom !== null
	&& cleanFrom === tiddler + ' ' + definition.name) {
		var cleanTo = utils.removePrefix(toTitle, tiddler);
		if (!cleanTo
		|| cleanTo.indexOf(' ') >= 0
		|| cleanTo.indexOf('(') >= 0) {
			return {impossible: true};
		}
		definition.name = cleanTo;
		return {output: true};
	}
};
