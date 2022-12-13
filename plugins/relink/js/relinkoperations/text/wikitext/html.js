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
	var managedElement = this.parser.context.getAttribute(this.nextTag.tag);
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
			var handler = getAttributeHandler(this.parser.context, this.nextTag, attributeName, options);
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
	var managedElement = this.parser.context.getAttribute(this.nextTag.tag),
		builder = new Rebuilder(text, this.nextTag.start);
	var widgetEntry = {};
	widgetEntry.attributes = Object.create(null);
	widgetEntry.element = this.nextTag.tag;
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
				var quote = utils.determineQuote(text, attr);
				oldLength = attr.value.length + (quote.length * 2);
				quotedValue = utils.wrapAttributeValue(entry.output,quote);
				if (quotedValue === undefined) {
					// The value was unquotable. We need to make
					// a macro in order to replace it.
					if (!options.placeholder) {
						// but we can't...
						entry.impossible = true;
					} else {
						var value = options.placeholder.getPlaceholderFor(entry.output,handler.name)
						quotedValue = "<<"+value+">>";
					}
				}
				attr.value = entry.output;
			}
			break;
		case 'indirect':
			entry = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				// +4 for '{{' and '}}'
				oldLength = attr.textReference.length + 4;
				quotedValue = "{{"+entry.output+"}}";
				attr.textReference = entry.output;
			}
			break;
		case 'filtered':
			entry = filterHandler.relinkInBraces(attr.filter, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				// +6 for '{{{' and '}}}'
				oldLength = attr.filter.length + 6;
				quotedValue = "{{{"+ entry.output +"}}}";
				attr.filter = entry.output;
			}
			break;
		case 'macro':
			var macro = attr.value;
			entry = macrocall.relinkAttribute(this.parser, macro, text, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.output) {
				// already includes '<<' and '>>'
				oldLength = macro.end-macro.start;
				quotedValue = entry.output;
				attr.value = $tw.utils.parseMacroInvocation(entry.output, 0);
			}
		}
		if (entry.impossible) {
			widgetEntry.impossible = true;
		}
		if (quotedValue === undefined) {
			continue;
		}
		// We count backwards from the end to preserve whitespace
		var valueStart = attr.end - oldLength;
		builder.add(quotedValue, valueStart, attr.end);
	}
	for (var operator in htmlOperators) {
		htmlOperators[operator].relink(this.nextTag, this.parser, fromTitle, toTitle, options);
	}
	var tag = this.parse()[0];
	if (tag.children) {
		for (var i = 0; i < tag.children.length; i++) {
			var child = tag.children[i];
			if (child.output) {
				builder.add(child.output, child.start, child.end);
			}
			if (child.impossible) {
				widgetEntry.impossible = true;
			}
		}
	}
	if (builder.changed() || widgetEntry.impossible) {
		widgetEntry.output = builder.results(this.parser.pos);
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
