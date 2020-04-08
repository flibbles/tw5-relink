/*\
module-type: relinkwikitextrule

Handles replacement in attributes of widgets and html elements
This is configurable to select exactly which attributes of which elements
should be changed.

<$link to="TiddlerTitle" />

\*/

var utils = require("./utils.js");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var refHandler = settings.getRelinker('reference');
var filterHandler = settings.getRelinker('filter');
var macrocall = require("./macrocall.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = "html";

var HtmlEntry = EntryNode.newType("html");

HtmlEntry.prototype.report = function() {
	var self = this;
	return this.children.map(function(child) {
		return "<" + self.element + " " + child.attribute + " />";
	});
};

var AttributeEntry = EntryNode.newType("attribute");

AttributeEntry.prototype.report = function() {
	return [this.attribute];
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var managedElement = settings.getAttributes(options)[this.nextTag.tag],
		builder = new Rebuilder(text, this.nextTag.start);
	var importFilterAttr;
	var widgetEntry = new HtmlEntry();
	for (var attributeName in this.nextTag.attributes) {
		var attr = this.nextTag.attributes[attributeName];
		var nextEql = text.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			continue;
		}
		if (this.nextTag.tag === "$importvariables" && attributeName === "filter") {
			importFilterAttr = attr;
		}
		var oldLength, quotedValue, entry,
			attrEntry = new AttributeEntry();
		if (attr.type === "string") {
			var handler = getAttributeHandler(this.nextTag, attributeName, options);
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			entry = handler.relink(attr.value, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (!entry.impossible) {
				var quote = utils.determineQuote(text, attr);
				oldLength = attr.value.length + (quote.length * 2);
				quotedValue = utils.wrapAttributeValue(entry.output,quote);
				if (quotedValue === undefined) {
					// The value was unquotable. We need to make
					// a macro in order to replace it.
					var value = this.parser.getPlaceholderFor(entry.output,handler.name)
					quotedValue = "<<"+value+">>";
					attrEntry.placeholder = true;
				}
			}
		} else if (attr.type === "indirect") {
			entry = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (!entry.impossible) {
				// +4 for '{{' and '}}'
				oldLength = attr.textReference.length + 4;
				quotedValue = "{{"+entry.output+"}}";
			}
		} else if (attr.type === "filtered") {
			entry = filterHandler.relinkInBraces(attr.filter, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (!entry.impossible) {
				// +6 for '{{{' and '}}}'
				oldLength = attr.filter.length + 6;
				quotedValue = "{{{"+ entry.output +"}}}";
			}
		} else if (attr.type === "macro") {
			var macro = attr.value;
			entry = macrocall.relinkAttribute(macro, text, this.parser, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (!entry.impossible) {
				// already includes '<<' and '>>'
				oldLength = macro.end-macro.start;
				quotedValue = entry.output;
			}
		}
		attrEntry.add(entry);
		attrEntry.element = this.nextTag.tag,
		widgetEntry.element = this.nextTag.tag,
		attrEntry.attribute = attributeName
		widgetEntry.add(attrEntry);
		if (quotedValue === undefined) {
			continue;
		}
		if (this.nextTag.tag === "$importvariables" && attributeName === "filter") {
			// If this is an import variable filter, we gotta
			// remember this new value when we import lower down.
			importFilterAttr = quotedValue;
		}
		// We count backwards from the end to preserve whitespace
		var valueStart = attr.end - oldLength;
		builder.add(quotedValue, valueStart, attr.end);
	}
	if (importFilterAttr) {
		processImportFilter(importFilterAttr, this.parser, options);
	}
	this.parser.pos = this.nextTag.end;
	if (widgetEntry.children.length > 0) {
		widgetEntry.output = builder.results(this.nextTag.end);
		return widgetEntry;
	}
	return undefined;
};

/** Returns the field handler for the given attribute of the given widget.
 *  If this returns undefined, it means we don't handle it. So skip.
 */
function getAttributeHandler(widget, attributeName, options) {
	if (widget.tag === "$macrocall") {
		var nameAttr = widget.attributes["$name"];
		var macro = settings.getMacros(options)[nameAttr.value];
		if (macro) {
			return macro[attributeName];
		}
	} else {
		var element = settings.getAttributes(options)[widget.tag];
		if (element) {
			return element[attributeName];
		}
	}
	return undefined;
};

function computeAttribute(attribute, parser, options) {
	var value;
	if(attribute.type === "filtered") {
		var parentWidget = parser.getVariableWidget();
		value = options.wiki.filterTiddlers(attribute.filter,parentWidget)[0] || "";
	} else if(attribute.type === "indirect") {
		var parentWidget = parser.getVariableWidget();
		value = options.wiki.getTextReference(attribute.textReference,"",parentWidget.variables.currentTiddler.value);
	} else if(attribute.type === "macro") {
		var parentWidget = parser.getVariableWidget();
		value = parentWidget.getVariable(attribute.value.name,{params: attribute.value.params});
	} else { // String attribute
		value = attribute.value;
	}
	return value;
};

// This processes a <$importvariables> filter attribute and adds any new
// variables to our parser.
function processImportFilter(importAttribute, parser, options) {
	if (typeof importAttribute === "string") {
		// It was changed. Reparse it. It'll be a quoted
		// attribute value. Add a dummy attribute name.
		importAttribute = $tw.utils.parseAttribute("p="+importAttribute, 0)
	}
	var importFilter = computeAttribute(importAttribute, parser, options);
	var parentWidget = parser.getVariableWidget();
	var varHolder = options.wiki.relinkGenerateVariableWidget(importFilter, parentWidget);
	parser.addWidget(varHolder);
};
