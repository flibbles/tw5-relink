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

exports.relink = function(text, fromTitle, toTitle, options) {
	var managedElement = settings.getAttributes(options)[this.nextTag.tag],
		builder = new Rebuilder(text, this.nextTag.start);
	var importFilterAttr;
	var widgetEntry = new EntryNode("html");
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
		var oldLength, quotedValue,
			attrEntry = new EntryNode("attribute");
		if (attr.type === "string") {
			var handler = getAttributeHandler(this.nextTag, attributeName, options);
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			var entry = handler.relink(attr.value, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			if (entry.impossible) {
				attrEntry.add(entry);
				widgetEntry.add(attrEntry);
				continue;
			}
			var quote = utils.determineQuote(text, attr);
			oldLength = attr.value.length + (quote.length * 2);
			quotedValue = utils.wrapAttributeValue(entry.output,quote);
			if (quotedValue === undefined) {
				// The value was unquotable. We need to make
				// a macro in order to replace it.
				var value = this.parser.getPlaceholderFor(entry.output,handler.name)
				// TODO: I think I can scrap this line.
				attr.type = "macro";
				quotedValue = "<<"+value+">>";
				attrEntry.placeholder = true;
			}
			attrEntry.add(entry);

		} else if (attr.type === "indirect") {
			var newRef = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, options);
			if (newRef === undefined) {
				continue;
			}
			if (newRef.impossible) {
				attrEntry.add(newRef);
				widgetEntry.add(attrEntry);
				continue;
			}
			// +4 for '{{' and '}}'
			oldLength = attr.textReference.length + 4;
			quotedValue = "{{"+newRef.output+"}}";
		} else if (attr.type === "filtered") {
			var filterEntry = filterHandler.relinkInBraces(attr.filter, fromTitle, toTitle, options);
			if (filterEntry === undefined) {
				continue;
			}
			if (filterEntry.impossible) {
				attrEntry.add(filterEntry);
				widgetEntry.add(attrEntry);
				continue;
			}
			// +6 for '{{{' and '}}}'
			oldLength = attr.filter.length + 6;
			quotedValue = "{{{" + filterEntry.output + "}}}";
			attrEntry.add(filterEntry);
		} else if (attr.type === "macro") {
			var macro = attr.value;
			var entry = macrocall.relinkAttribute(macro, text, this.parser, fromTitle, toTitle, options);
			if (entry === undefined) {
				continue;
			}
			attrEntry.add(entry);
			widgetEntry.add(attrEntry);
			if (!entry.output) {
				continue;
			}
			// already includes the 4 carrot brackets
			oldLength = macro.end-macro.start;
			quotedValue = entry.output;
		} else {
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

		attrEntry.element = this.nextTag.tag,
		attrEntry.attribute = attributeName
		widgetEntry.add(attrEntry);
	}
	if (importFilterAttr) {
		if (typeof importFilterAttr === "string") {
			// It was changed. Reparse it. It'll be a quoted
			// attribute value. Add a dummy attribute name.
			importFilterAttr = $tw.utils.parseAttribute("p="+importFilterAttr, 0)
		}
		var importFilter = computeAttribute(importFilterAttr, this.parser, options);
		var parentWidget = this.parser.getVariableWidget();
		var varHolder = options.wiki.relinkGenerateVariableWidget(importFilter, parentWidget);
		this.parser.addWidget(varHolder);
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
