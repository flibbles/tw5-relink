/*\
module-type: relinkmacrocall
title: $:/plugins/flibbles/relink-variables/macrocall.js
type: application/javascript

Handles relinking of variables in <<macrocall>> format.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');

exports.name = 'variables';

exports.report = function(context, macro, callback, options) {
	varRelinker.report(macro.name, function(title, blurb) {
		var blurb = '';
		var def = context.getMacroDefinition(macro.name);
		for (var i = 0; i < macro.params.length; i++) {
			var param = macro.params[i];
			blurb += ' ' + param.value;
		}
		callback(title, blurb);
	}, options);
};

exports.relink = function(context, macro, text, fromTitle, toTitle, options) {
	var entry = varRelinker.relink(macro.name, fromTitle, toTitle, options);
	if (entry && entry.output) {
		if (entry.output.search(/[>"'=]/) >= 0) {
			return {impossible: true};
		}
		if (!macro.attributes) {
			macro.attributes = {"$variable": {}};
		}
		macro.attributes['$variable'].value = entry.output;
		entry.output = macro;
	}
	return entry;
};
