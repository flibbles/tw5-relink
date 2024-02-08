/*\
module-type: relinkhtml
title: $:/plugins/flibbles/relink-variables/html.js
type: application/javascript

Relinks \widgets in their html element form. (i.e. <$my.widget />)

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');

exports.name = 'variables';

exports.report = function(element, parser, callback, options) {
	if (element.tag.indexOf('.') >= 0 && element.tag[0] === '$') {
		var def = options.settings.getMacroDefinition(element.tag);
		if (!def || !def.isWidgetDefinition) {
			// Whoops the definition isn't actually a widget
			return;
		}
		varRelinker.report(element.tag, function(title, blurb) {
			blurb = '';
			var attrs = element.orderedAttributes;
			for (var i = 0; i < attrs.length; i++) {
				var attr = attrs[i];
				blurb += ' ' + attr.name + '=';
				switch (attr.type) {
				case 'string':
					blurb += '"' + attr.value + '"';
					break;
				case 'indirect':
					blurb += '{{' + attr.textReference + '}}';
					break;
				case 'filtered':
					blurb += '{{{' + attr.filter.trim() + '}}}';
					break;
				case 'macro':
					blurb += '<<' + attr.value.name + '>>';
					break;
				case 'substituted':
					blurb += '`' + attr.rawValue + '`';
					break;
				}
			}
			callback(title, blurb);
		}, options);
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var output;
	if (element.tag.indexOf('.') >= 0 && element.tag[0] === '$') {
		var entry = varRelinker.relink(element.tag, fromTitle, toTitle, options);
		var def = options.settings.getMacroDefinition(element.tag);
		if (entry && def && def.isWidgetDefinition) {
			output = output || {};
			if (entry.output) {
				if (entry.output[0] !== '$'
				|| entry.output.indexOf('.') < 0
				|| entry.output.search(/[^a-zA-Z\-\$\.]/) >= 0) {
					output.impossible = true;
				} else {
					element.tag = entry.output;
					output.output = true;
				}
			}
			if (entry.impossible) {
				output.impossible = true;
			}
		}
	}
	return output;
};
