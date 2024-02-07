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
	if (!nestedInDefinition(options.settings) && cleanFrom !== null) {
		// Should I ask a widget for this definition instead?
		var tiddler = options.settings.widget.getVariable('currentTiddler');
		if (tiddler && (cleanFrom === tiddler + ' ' + definition.name)) {
			var cleanTo = utils.removePrefix(toTitle, tiddler);
			if (!cleanTo
			|| cleanTo.indexOf(' ') >= 0
			|| cleanTo.indexOf('(') >= 0) {
				return {impossible: true};
			}
			definition.name = cleanTo;
			return {output: true};
		}
	}
};

function nestedInDefinition(context) {
	// We skip the immediate context, because that's THIS definition
	context = context.parent;
	while (context) {
		if (context.parameterFocus) {
			return true;
		}
		context = context.parent;
	}
	return false;
};
