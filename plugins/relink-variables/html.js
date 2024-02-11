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
		if (def && def.isWidgetDefinition) {
			varRelinker.reportForTitle(element.tag, function(title, blurb, style) {
				blurb = formBlurb(element, 33);
				if (blurb.length > 60) {
					blurb = formBlurb(element, 18);
				}
				if (blurb.length > 60) {
					blurb = formBlurb(element);
				}
				callback(title, blurb, style);
			}, def.tiddler);
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var output;
	if (element.tag.indexOf('.') >= 0 && element.tag[0] === '$') {
		var def = options.settings.getMacroDefinition(element.tag);
		if (def && def.isWidgetDefinition) {
			var entry = varRelinker.relinkForTitle(element.tag, fromTitle, toTitle, def.tiddler);
			if (entry) {
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
	}
	return output;
};

function wrapValue(value) {
	if (!/([\/\s<>"'`=])/.test(value) && value.length > 0) {
		return value;
	} else if (value.indexOf('"') < 0) {
		return '"' + value + '"';
	} else {
		return '\'' + value + '\'';
	}
};

function formBlurb(element, maxLength) {
	var blurb = '';
	var attrs = element.orderedAttributes;
	for (var i = 0; i < attrs.length; i++) {
		var attr = attrs[i];
		blurb += ' ' + attr.name + '=';
		switch (attr.type) {
		case 'string':
			blurb += wrapValue(utils.abridgeString(attr.value, maxLength));
			break;
		case 'indirect':
			blurb += '{{' + attr.textReference + '}}';
			break;
		case 'filtered':
			blurb += '{{{' + utils.abridgeString(attr.filter.trim(), maxLength) + '}}}';
			break;
		case 'macro':
			blurb += '<<' + attr.value.name + '>>';
			break;
		case 'substituted':
			blurb += '`' + utils.abridgeString(attr.rawValue, maxLength) + '`';
			break;
		}
	}
	return blurb;
};
