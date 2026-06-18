/*\
module-type: relinkmacrocall
title: $:/plugins/flibbles/relink-variables/macrocall.js
type: application/javascript

Handles relinking of variables in <<macrocall>> format.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');

exports.name = 'variables';

exports.report = function(context, macro, callback, options) {
	varRelinker.report(macro.name, function(title, blurb, style) {
		var blurb = formBlurb(macro, 33);
		if (blurb.length > 50) {
			blurb = formBlurb(macro, 18);
		}
		if (blurb.length > 50) {
			blurb = formBlurb(macro, 23, 0);
		}
		callback(title, blurb, style);
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

function formBlurb(macro, maxLength, truncLength) {
	var blurb = '';
	for (var i = 0; i < macro.params.length; i++) {
		var param = macro.params[i];
		var value = '';
		if (param.name !== "$variable") {
			var handler = attrTypeOperators[param.type];
			if (handler) {
				var raw = handler.rawString(param);
				var innerString = utils.abridgeString(raw, maxLength, truncLength);
				value = handler.wrap(innerString);
			}
			// TODO: What does this do if value never got set?
			blurb += ' ' + (!param.isPositional && param.name? param.name + ': ': '') + value;
		}
	}
	return blurb;
};
