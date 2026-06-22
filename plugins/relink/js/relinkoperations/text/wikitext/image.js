/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[img[tiddler.jpg]]

[img width=23 height=24 [Description|tiddler.jpg]]

\*/

var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var utils = require("./utils.js");
var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var attributeOperators = relinkUtils.getModulesByTypeAsHashmap('relinkhtmlattributes', 'name');
var attrTypeOperators = $tw.modules.getModulesByTypeAsHashmap('relinkattributetype');

exports.name = "image";

exports.report = function(text, callback, options) {
	for (var attributeName in this.nextImage.attributes) {
		var attr = this.nextImage.attributes[attributeName];
		if (attributeName === "source") {
			var tooltip = this.nextImage.attributes.tooltip;
			var blurb = '[img[' + (tooltip ? tooltip.value : '') + ']]';
			callback(attr.value, blurb);
		} else if (attributeName !== "tooltip") {
			reportAttribute(this.parser, attr, callback, options);
		}
	}
	this.parser.pos = this.nextImage.end;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var ptr = this.nextImage.start,
		builder = new Rebuilder(text, ptr),
		makeWidget = false,
		skipSource = false,
		imageEntry;
	if (this.nextImage.attributes.source.value === fromTitle && !canBePretty(toTitle, this.nextImage.attributes.tooltip)) {
		if (this.parser.context.allowWidgets() && utils.wrapAttributeValue(toTitle)) {
			makeWidget = true;
			builder.add("<$image", ptr, ptr+4);
		} else {
			// We won't be able to make a wdget to replace
			// the source attribute. We check now so we don't
			// prematurely convert into a widget.
			// Keep going in case other attributes need replacing.
			skipSource = true;
		}
	}
	ptr += 4; //[img
	var inSource = false;
	for (var attributeName in this.nextImage.attributes) {
		var attr = this.nextImage.attributes[attributeName];
		if (attributeName === "source" || attributeName === "tooltip") {
			if (inSource) {
				ptr = text.indexOf('|', ptr);
			} else {
				ptr = text.indexOf('[', ptr);
				inSource = true;
			}
			if (makeWidget) {
				if (" \t\n".indexOf(text[ptr-1]) >= 0) {
					builder.add('', ptr, ptr+1);
				} else {
					builder.add(' ', ptr, ptr+1);
				}
			}
			ptr += 1;
		}
		if (attributeName === "source") {
			ptr = text.indexOf(attr.value, ptr);
			if (attr.value === fromTitle) {
				if (makeWidget) {
					var quotedValue = utils.wrapAttributeValue(toTitle);
					if (quotedValue === undefined) {
						builder.impossible = true;
					} else {
						builder.add("source="+quotedValue, ptr, ptr+fromTitle.length);
					}
				} else if (!skipSource) {
					builder.add(toTitle, ptr, ptr+fromTitle.length);
				} else {
					builder.impossible = true;
				}
			}
			ptr = text.indexOf(']]', ptr);
			if (makeWidget) {
				builder.add("/>", ptr, ptr+2);
			}
			ptr += 2;
		} else if (attributeName === "tooltip") {
			if (makeWidget) {
				ptr = text.indexOf(attr.value, ptr);
				var quotedValue = utils.wrapAttributeValue(attr.value);
				builder.add("tooltip="+quotedValue, ptr, ptr+attr.value.length);
			}
		} else {
			ptr = relinkAttribute(this.parser, attr, builder, fromTitle, toTitle, options);
		}
	}
	this.parser.pos = ptr;
	if (builder.changed() || builder.impossible) {
		imageEntry = {
			output: builder.results(ptr),
			impossible: builder.impossible };
	}
	return imageEntry;
};

function reportAttribute(parser, attribute, callback, options) {
	var typeHandler = attrTypeOperators[attribute.type];
	if (typeHandler) {
		typeHandler.report({tag: '$image'}, attribute, attributeOperators, function(title, blurb, style) {
			callback(title, '[img ' + attribute.name + '=' + (blurb || '') + ']', style);
		}, options);
	}
};

function relinkAttribute(parser, attribute, builder, fromTitle, toTitle, options) {
	var text = builder.text;
	var ptr = text.indexOf(attribute.name, attribute.start);
	ptr += attribute.name.length;
	ptr = text.indexOf('=', ptr);
	ptr = $tw.utils.skipWhiteSpace(text, ptr+1);
	var typeHandler = attrTypeOperators[attribute.type];
	if (typeHandler) {
		var entry = typeHandler.relink({tag: "$image"}, attribute, attributeOperators, parser.source, fromTitle, toTitle, options);
		if (entry && entry.output) {
			builder.add(typeHandler.reassemble(attribute, options), ptr, attribute.end);
		}
		if (entry && entry.impossible) {
			builder.impossible = true;
		}
	}
	return attribute.end;
};

function canBePretty(title, tooltip) {
	return title.indexOf(']') < 0 && (tooltip || title.indexOf('|') < 0);
};
