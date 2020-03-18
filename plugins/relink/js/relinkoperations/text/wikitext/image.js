/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[img[tiddler.jpg]]

[img width=23 height=24 [Description|tiddler.jpg]]

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');
var macrocall = require("./macrocall.js");
var CannotRelinkError = require("$:/plugins/flibbles/relink/js/errors.js").CannotRelinkError;
var utils = require("./utils.js");

exports.name = "image";

exports.relink = function(text, fromTitle, toTitle, logger, options) {
	var ptr = this.nextImage.start;
	var builder = new Rebuilder(text, ptr);
	var makeWidget = false;
	var logArguments = {name: "image"};
	if (this.nextImage.attributes.source.value === fromTitle && !canBePretty(toTitle, this.nextImage.attributes.tooltip)) {
		makeWidget = true;
		builder.add("<$image", ptr, ptr+4);
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
						var key = this.parser.getPlaceholderFor(toTitle);
						builder.add("source=<<"+key+">>", ptr, ptr+fromTitle.length);
						logArguments.placeholder = true;
						logArguments.widget = true;

					} else {
						builder.add("source="+quotedValue, ptr, ptr+fromTitle.length);
						logArguments.widget = true;
					}
				} else {
					builder.add(toTitle, ptr, ptr+fromTitle.length);
				}
				logger.add(logArguments);
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
			ptr = relinkAttribute(attr, this.parser, builder, fromTitle, toTitle, logger, options);
		}
	}
	this.parser.pos = ptr;
	return builder.results(ptr);
};

function relinkAttribute(attribute, parser, builder, fromTitle, toTitle, logger, options) {
	var text = builder.text;
	var ptr = text.indexOf(attribute.name, attribute.start);
	ptr += attribute.name.length;
	ptr = text.indexOf('=', ptr);
	if (attribute.type === "string") {
		ptr = text.indexOf(attribute.value, ptr)
		var quote = utils.determineQuote(text, attribute);
		// ignore first quote. We already passed it
		ptr += quote.length + attribute.value.length;
	} else if (attribute.type === "indirect") {
		ptr = text.indexOf('{{', ptr);
		var quote = "{{";
		var ref = $tw.utils.parseTextReference(attribute.textReference);
		var end = ptr + attribute.textReference.length + 4;
		if (ref.title === fromTitle) {
			if (toTitle.indexOf("}") >= 0) {
				throw new CannotRelinkError();
			}
			ref.title = toTitle;
			var value = refHandler.toString(ref);
			builder.add("{{"+value+"}}", ptr, end);
		}
		ptr = end;
	} else if (attribute.type === "filtered") {
		ptr = text.indexOf('{{{', ptr);
		var end = ptr + attribute.filter.length + 6;
		var extendedOptions = $tw.utils.extend({placeholder: parser}, options);
		var filter = filterHandler.relink(attribute.filter, fromTitle, toTitle, logger, extendedOptions);
		if (filter !== undefined) {
			if (!canBeFilterValue(filter)) {
				throw new CannotRelinkError();
			}
			attribute.filter = filter;
			var quoted = "{{{"+filter+"}}}";
			builder.add(quoted, ptr, end);
		}
		ptr = end;
	} else if (attribute.type === "macro") {
		ptr = text.indexOf("<<", ptr);
		var end = attribute.value.end;
		var macro = attribute.value;
		oldValue = attribute.value;
		var newMacro = macrocall.relinkMacroInvocation(macro, text, parser, fromTitle, toTitle, logger, options);
		if (newMacro !== undefined) {
			if (macrocall.mustBeAWidget(newMacro)) {
				throw new CannotRelinkError();
			}
			var macroString = macrocall.macroToString(newMacro, text, parser, options);
			builder.add(macroString, ptr, end);
		}
		ptr = end;
	}
	return ptr;
};

function canBeFilterValue(value) {
	return value.indexOf("}}}") < 0 && value.substr(value.length-2) !== '}}';
};

function canBePretty(title, tooltip) {
	return title.indexOf(']') < 0 && (tooltip || title.indexOf('|') < 0);
};
