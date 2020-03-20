/*\
module-type: relinkwikitextrule

Handles replacement in attributes of widgets and html elements
This is configurable to select exactly which attributes of which elements
should be changed.

<$link to="TiddlerTitle" />

\*/

var utils = require("./utils.js");
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var html = require("$:/core/modules/parsers/wikiparser/rules/html.js");
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var refHandler = settings.getRelinker('reference');
var filterHandler = settings.getRelinker('filter');
var macrocall = require("./macrocall.js");

exports.name = "html";

exports.relink = function(text, fromTitle, toTitle, logger, options) {
	var managedElement = settings.getAttributes(options)[this.nextTag.tag],
		builder = new Rebuilder(text, this.nextTag.start);
	var importFilterAttr;
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
		var oldLength, quotedValue, quote,
			logArguments = {name: "attribute"};
		if (attr.type === "string") {
			var handler = getAttributeHandler(this.nextTag, attributeName, options);
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			var extendedOptions = $tw.utils.extend({placeholder: this.parser}, options);
			oldLength = attr.value.length;
			var value = handler.relink(attr.value, fromTitle, toTitle, logger, extendedOptions);
			if (value === undefined) {
				continue;
			}
			if (extendedOptions.usedPlaceholder) {
				logArguments.placeholder = true;
			}
			quote = utils.determineQuote(text, attr);
			quotedValue = utils.wrapAttributeValue(value,quote);
			if (quotedValue === undefined) {
				// The value was unquotable. We need to make
				// a macro in order to replace it.
				value = this.parser.getPlaceholderFor(value,handler.name)
				attr.type = "macro";
				quotedValue = "<<"+value+">>";
				logArguments.placeholder = true;
			}
		} else if (attr.type === "indirect") {
			oldLength = attr.textReference.length;
			quote = "{{";
			var newRef = refHandler.relinkInBraces(attr.textReference, fromTitle, toTitle, logger, options);
			if (!newRef) {
				continue;
			}
			quotedValue = "{{"+newRef+"}}";
		} else if (attr.type === "filtered") {
			var extendedOptions = $tw.utils.extend({placeholder: this.parser}, options);
			oldLength = attr.filter.length
			var filter = filterHandler.relink(attr.filter, fromTitle, toTitle, logger, extendedOptions);
			if (filter === undefined) {
				continue;
			}
			if (!canBeFilterValue(filter)) {
				// Although I think we can actually do this one.
				logger.add({name: "filter", impossible: true});
				continue;
			}
			quotedValue = "{{{" + filter + "}}}";
			quote = "{{{";
		} else if (attr.type === "macro") {
			var macro = attr.value;
			oldLength = attr.value.length;
			var macroString = macrocall.relinkAttribute(macro, text, this.parser, fromTitle, toTitle, logger, options);
			if (macroString === undefined) {
				continue;
			}
			// TODO: Let's not hack like this. attr.value is
			// expected to be a string of the unquoted value below.
			// Make this better when I can.
			oldLength = (macro.end-macro.start)-4;
			quote = "<<";
			quotedValue = macroString;
		} else {
			continue;
		}
		if (this.nextTag.tag === "$importvariables" && attributeName === "filter") {
			// If this is an import variable filter, we gotta
			// remember this new value when we import lower down.
			importFilterAttr = quotedValue;
		}
		// account for the quote if it's there.
		// We count backwards from the end to preserve whitespace
		var valueStart = attr.end
		               - (quote.length*2)
		               - oldLength;
		builder.add(quotedValue, valueStart, attr.end);

		logArguments.element = this.nextTag.tag,
		logArguments.attribute = attributeName
		logger.add(logArguments);
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
	return builder.results(this.nextTag.end);
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

function canBeFilterValue(value) {
	return value.indexOf("}}}") < 0 && value.substr(value.length-2) !== '}}';
};
