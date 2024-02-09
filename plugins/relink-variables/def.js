/*\
module-type: relinkdef
title: $:/plugins/flibbles/relink-variables/def.js
type: application/javascript

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');


exports.name = 'variables';

exports.report = function() {
	// While we'll relink definition names, we don't actually
	// report on them since that would be redundant.
	// The user is looking at the definition to see what's referencing it.
};

exports.relink = function(definition, fromTitle, toTitle, options) {
	// We skip the immediate context, because that's THIS definition
	var tiddler = options.settings.parent.getFocus().title;
	if (tiddler) {
		var entry = varRelinker.relinkForTitle(definition.name, fromTitle, toTitle, tiddler);
		if (entry && entry.output) {
			definition.name = entry.output;
			entry.output = true;
		}
		return entry;
	}
};
