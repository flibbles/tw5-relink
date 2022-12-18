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
var refHandler = relinkUtils.getType('reference');
var filterHandler = relinkUtils.getType('filter');
var macrocall = require("./macrocall.js");
var htmlOperators = relinkUtils.getModulesByTypeAsHashmap('relinkhtml', 'name');

exports.name = "html";

exports.report = function(text, callback, options) {
	var element = this.nextTag.tag;
	for (var attributeName in this.nextTag.attributes) {
		var attr = this.nextTag.attributes[attributeName];
		var nextEql = text.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			continue;
		}
		var oldLength, quotedValue = undefined, entry;
		if (attr.type === "string") {
			var handler;
			var setting = this.parser.context.getAttribute(this.nextTag.tag);
			if (setting) {
				handler = setting[attributeName];
			}
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			handler.report(attr.value, function(title, blurb) {
				if (blurb) {
					callback(title, '<' + element + ' ' + attributeName + '="' + blurb + '" />');
				} else {
					callback(title, '<' + element + ' ' + attributeName + ' />');
				}
			}, options);
		} else if (attr.type === "indirect") {
			entry = refHandler.report(attr.textReference, function(title, blurb) {
				callback(title, '<' + element + ' ' + attributeName + '={{' + (blurb || '') + '}} />');
			}, options);
		} else if (attr.type === "filtered") {
			entry = filterHandler.report(attr.filter, function(title, blurb) {
				callback(title, '<' + element + ' ' + attributeName + '={{{' + blurb + '}}} />');
			}, options);
		} else if (attr.type === "macro") {
			var macro = attr.value;
			entry = macrocall.reportAttribute(this.parser, macro, function(title, blurb) {
				callback(title, '<' + element + ' ' + attributeName + '=' + blurb + ' />');
			}, options);
		}
		if (quotedValue === undefined) {
			continue;
		}
	}
	for (var operator in htmlOperators) {
		htmlOperators[operator].report(this.nextTag, this.parser, callback, options);
	}
	this.parse();
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var widgetEntry = {};
	widgetEntry.attributes = Object.create(null);
	widgetEntry.element = this.nextTag.tag;
	var elem = this.nextTag;
	var changed = false;
	for (var attributeName in this.nextTag.attributes) {
		var attr = this.nextTag.attributes[attributeName];
		var nextEql = text.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			attr.valueless = true;
			continue;
		}
		var oldLength, quotedValue = undefined, entry;
		var nestedOptions = Object.create(options);
		nestedOptions.settings = this.parser.context;
		switch (attr.type) {
		case 'string':
			var handler = getAttributeHandler(this.parser.context, this.nextTag, attributeName, options);
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			entry = handler.relink(attr.value, fromTitle, toTitle, nestedOptions);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				attr.value = entry.output;
				attr.handler = handler.name;
				changed = true;
			}
			break;
		case 'indirect':
			entry = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				attr.textReference = entry.output;
				changed = true;
			}
			break;
		case 'filtered':
			entry = filterHandler.relinkInBraces(attr.filter, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				attr.filter = entry.output;
				changed = true;
			}
			break;
		case 'macro':
			var macro = attr.value;
			entry = macrocall.relinkAttribute(this.parser, macro, text, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				attr.output = entry.output;
				attr.value = $tw.utils.parseMacroInvocation(entry.output, 0);
				changed = true;
			}
		}
		if (entry.impossible) {
			widgetEntry.impossible = true;
		}
	}
	for (var operator in htmlOperators) {
		var entry = htmlOperators[operator].relink(this.nextTag, this.parser, fromTitle, toTitle, options);
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
			var quoatedValue;
			switch (attr.type) {
			case 'string':
				if (attr.valueless) {
					continue;
				}
				var quote = utils.determineQuote(text, attr);
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
					// If output isn't set, this wasn't ever changed
					continue;
				}
				break;
			}
			var ptr = attr.start;
			ptr = $tw.utils.skipWhiteSpace(text, ptr);
			ptr += attr.name.length;
			ptr = $tw.utils.skipWhiteSpace(text, ptr);
			ptr++; // For the equals
			ptr = $tw.utils.skipWhiteSpace(text, ptr);
			builder.add(quotedValue, ptr, attr.end);
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

/** Returns the field handler for the given attribute of the given widget.
 *  If this returns undefined, it means we don't handle it. So skip.
 */
function getAttributeHandler(context, widget, attributeName, options) {
	if (widget.tag === "$macrocall") {
		var nameAttr = widget.attributes["$name"];
		if (nameAttr) {
			var macro = context.getMacro(nameAttr.value);
			if (macro) {
				return macro[attributeName];
			}
		}
	} else {
		var element = context.getAttribute(widget.tag);
		if (element) {
			return element[attributeName];
		}
	}
	return undefined;
};
