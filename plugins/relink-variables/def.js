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
	if (cleanFrom !== null) {
		// Should I ask a widget for this definition instead?
		var tiddler = options.settings.widget.getVariable('currentTiddler');
		if (tiddler && (cleanFrom === tiddler + ' ' + definition.name)) {
			var cleanTo = utils.removePrefix(toTitle, tiddler);
			if (!cleanTo) {
				return {impossible: true};
			}
			definition.name = cleanTo;
			return {output: true};
		}
	}
};
