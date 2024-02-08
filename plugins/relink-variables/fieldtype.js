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

exports.reportForTitle = function(value, callback, defTitle) {
	callback(utils.prefix + defTitle + ' ' + value);
};

exports.relink = function(value, fromTitle, toTitle, options) {
	var def = options.settings.getMacroDefinition(value);
	if (def) {
		return this.relinkForTitle(value, fromTitle, toTitle, def.tiddler);
	}
};

exports.relinkForTitle = function(value, fromTitle, toTitle, defTitle) {
	var cleanFrom = utils.removePrefix(fromTitle);
	if (cleanFrom !== null) {
		if (cleanFrom === defTitle + ' ' + value) {
			var cleanTo = utils.removePrefix(toTitle, defTitle);
			if (!cleanTo) {
				return {impossible: true};
			}
			return {output: cleanTo};
		}
	}
};
