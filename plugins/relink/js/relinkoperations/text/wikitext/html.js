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
		htmlOperators[operator].report(this.nextTag, this.parser, function(title, blurb) {
			callback(title, '<' + blurb + ' />');
		}, nestedOptions);
	}
	this.parse();
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var widgetEntry = {};
	widgetEntry.attributes = Object.create(null);
	widgetEntry.element = this.nextTag.tag;
	var elem = this.nextTag;
	var changed = false;
	var nestedOptions = Object.create(options);
	nestedOptions.settings = this.parser.context;
	for (var operator in htmlOperators) {
		var entry = htmlOperators[operator].relink(this.nextTag, this.parser, fromTitle, toTitle, nestedOptions);
		if (entry) {
			if (entry.output) {
				changed = true;
			}
			if (entry.impossible) {
				widgetEntry.impossible = true;
			}
		}
	}
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
					// The value was unquotable. We need to make
					// a macro in order to replace it.
					if (!options.placeholder) {
						// but we can't...
						widgetEntry.impossible = true;
						continue;
					} else {
						var value = options.placeholder.getPlaceholderFor(attr.value,attr.handler)
						quotedValue = "<<"+value+">>";
					}
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
		widgetEntry.output = builder.results(this.parser.pos);
	}
	if (widgetEntry.output || widgetEntry.impossible) {
		return widgetEntry;
	}
	return undefined;
};
