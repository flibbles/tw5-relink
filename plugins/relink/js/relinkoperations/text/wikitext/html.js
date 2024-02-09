/*\
module-type: relinkwikitextrule

Handles replacement in attributes of widgets and html elements
This is configurable to select exactly which attributes of which elements
should be changed.

<$link to="TiddlerTitle" />

\*/

var utils = require("./utils.js");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var htmlOperators = relinkUtils.getModulesByTypeAsHashmap('relinkhtml', 'name');

exports.name = "html";

exports.report = function(text, callback, options) {
	var element = this.nextTag.tag;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = this.parser.context;
	for (var operator in htmlOperators) {
		htmlOperators[operator].report(this.nextTag, this.parser, function(title, blurb, style) {
			callback(title, '<' + blurb + ' />', style);
		}, nestedOptions);
	}
	this.parse();
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var widgetEntry = {};
	widgetEntry.attributes = Object.create(null);
	widgetEntry.element = this.nextTag.tag;
	var elem = this.nextTag;
	var originalTag = elem.tag;
	var changed = false;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = this.parser.context;
	for (var operator in htmlOperators) {
		var entry = htmlOperators[operator].relink(elem, this.parser, fromTitle, toTitle, nestedOptions);
		if (entry) {
			if (entry.output) {
				changed = true;
			}
			if (entry.impossible) {
				widgetEntry.impossible = true;
			}
		}
	}
	// We swap in the original tag in case it changed. We need the old tag
	// to find the proper closing tag. Parsing must come after the htmlmodules
	// because those might change the context for the inner body.
	var newTag = elem.tag;
	elem.tag = originalTag;
	var tag = this.parse()[0];
	if (tag.children) {
		for (var i = 0; i < tag.children.length; i++) {
			var child = tag.children[i];
			if (child.output) {
				changed = true;
			}
			if (child.impossible) {
				widgetEntry.impossible = true;
			}
		}
	}
	if (changed) {
		var builder = new Rebuilder(text, elem.start);
		builder.add(newTag, elem.start+1, getEndOfTag(elem, text));
		for (var attributeName in elem.attributes) {
			var attr = elem.attributes[attributeName];
			var quotedValue;
			switch (attr.type) {
			case 'string':
				if (attr.valueless) {
					continue;
				}
				var quote = relinkUtils.determineQuote(text, attr);
				quotedValue = utils.wrapAttributeValue(attr.value, quote)
				if (quotedValue === undefined) {
					widgetEntry.impossible = true;
					continue;
				}
				break;
			case 'indirect':
				quotedValue = "{{" + attr.textReference + "}}";
				break;
			case 'filtered':
				quotedValue = "{{{" + attr.filter + "}}}";
				break;
			case 'macro':
				if (attr.output) {
					quotedValue = attr.output;
				} else {
					quotedValue = undefined;
				}
				// Else If output isn't set, this wasn't ever changed
				break;
			case 'substituted':
				var ticIndex = attr.rawValue.lastIndexOf("`");
				if (ticIndex < 0) {
					quotedValue = "`" + attr.rawValue + "`";
				} else if (ticIndex < attr.rawValue.length-1
						&& attr.rawValue.indexOf("```") < 0) {
					quotedValue = "```" + attr.rawValue + "```";
				} else {
					// We can't have a tic at the end; can't have triple tic.
					widgetEntry.impossible = true;
				}
				break;
			}
			var ptr = attr.start;
			ptr = $tw.utils.skipWhiteSpace(text, ptr);
			if (attributeName !== attr.name) {
				// Ooh, the attribute name changed
				builder.add(attr.name, ptr, ptr + attributeName.length);
			}
			if (quotedValue) {
				// We have a new attribute value
				ptr += attributeName.length;
				ptr = $tw.utils.skipWhiteSpace(text, ptr);
				ptr++; // For the equals
				ptr = $tw.utils.skipWhiteSpace(text, ptr);
				builder.add(quotedValue, ptr, attr.end);
			}
		}
		if (tag.children) {
			for (var i = 0; i < tag.children.length; i++) {
				var child = tag.children[i];
				if (child.output) {
					builder.add(child.output, child.start, child.end);
				}
			}
		}
		var closingTag = '</' + elem.tag + '>';
		var startClosingTag = this.parser.pos - closingTag.length;
		if (text.substring(startClosingTag, this.parser.pos) === closingTag) {
			// Replace the closing tag in case the tag changed.
			builder.add(newTag, startClosingTag + 2, this.parser.pos-1);
		}
		widgetEntry.output = builder.results(this.parser.pos);
	}
	if (widgetEntry.output || widgetEntry.impossible) {
		return widgetEntry;
	}
	return undefined;
};

function getEndOfTag(element, text) {
	var regExp = /[^a-zA-Z\-\$\.]/g;
	regExp.lastIndex = element.start+1;
	var match = regExp.exec(text);
	return match.index;
};
