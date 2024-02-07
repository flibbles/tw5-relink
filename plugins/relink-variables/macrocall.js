/*\
module-type: relinkmacrocall
title: $:/plugins/flibbles/relink-variables/macrocall.js
type: application/javascript

Handles relinking of variables in <<macrocall>> format.

\*/

var utils = require("./utils.js");

exports.name = 'variables';

exports.report = function(context, macro, callback, options) {
	var def = options.settings.getMacroDefinition(macro.name);
	if (def) {
		var blurb = '';
		for (var i = 0; i < macro.params.length; i++) {
			var param = macro.params[i];
			blurb += ' ' + param.value;
		}
		callback(utils.prefix + def.tiddler + ' ' + macro.name, blurb);
	}
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var cleanFrom = utils.removePrefix(fromTitle);
	if (cleanFrom !== null) {
		var def = options.settings.getMacroDefinition(macro.name);
		if (def && (cleanFrom === def.tiddler + ' ' + macro.name)) {
			var cleanTo = utils.removePrefix(toTitle, def.tiddler);
			if (!cleanTo) {
				return {impossible: true};
			}
			macro.attributes['$variable'].value = cleanTo;
			return {output: macro};
		}
	}
};
