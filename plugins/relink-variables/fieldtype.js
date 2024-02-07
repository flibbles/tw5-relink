/*\
module-type: relinkfieldtype
title: $:/plugins/flibbles/relink-variables/fieldtype.js
type: application/javascript

This manages the variable type, which is like list, wikitext, markdown, etc...
Except that this type points to a variable, not a tiddler.

\*/

var utils = require("./utils.js");

exports.name = 'variable';

exports.report = function(value, callback, options) {
	var def = options.settings.getMacroDefinition(value);
	if (def && def.tiddler) {
		callback(utils.prefix + def.tiddler + ' ' + value);
	}
};

exports.relink = function(value, fromTitle, toTitle, options) {
	var cleanFrom = utils.removePrefix(fromTitle);
	if (cleanFrom !== null) {
		var def = options.settings.getMacroDefinition(value);
		if (def && (cleanFrom === def.tiddler + ' ' + value)) {
			var cleanTo = utils.removePrefix(toTitle, def.tiddler);
			if (!cleanTo) {
				return {impossible: true};
			}
			return {output: cleanTo};
		}
	}
};
