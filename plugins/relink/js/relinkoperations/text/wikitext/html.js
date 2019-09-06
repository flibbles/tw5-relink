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
var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');
var macrocall = require("./macrocall.js");
var CannotRelinkError = require("$:/plugins/flibbles/relink/js/errors.js").CannotRelinkError;

exports.name = "html";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
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
		var oldValue, quote, logMessage = "attribute";
		if (attr.type === "string") {
			var handler = getAttributeHandler(this.nextTag, attributeName, options);
			if (!handler) {
				// We don't manage this attribute. Bye.
				continue;
			}
			var extendedOptions = Object.assign({placeholder: this.parser}, options);
			oldValue = attr.value;
			var value = handler.relink(attr.value, fromTitle, toTitle, extendedOptions);
			if (value === undefined) {
				continue;
			}
			if (extendedOptions.usedPlaceholder) {
				logMessage = "attribute-placeholder";
			}
			quote = determineQuote(text, attr);
			attr.quotedValue = utils.wrapAttributeValue(value,quote);
			if (attr.quotedValue === undefined) {
				// The value was unquotable. We need to make
				// a macro in order to replace it.
				value = this.parser.getPlaceholderFor(value,handler.name)
				attr.type = "macro";
				attr.quotedValue = "<<"+value+">>";
				logMessage = "attribute-placeholder";
			}
			attr.value = value;
		} else if (attr.type === "indirect") {
			if (toTitle.indexOf("}") >= 0) {
				// Impossible replacement
				throw new CannotRelinkError();
			}
			oldValue = attr.textReference;
			quote = "{{";
			var ref = $tw.utils.parseTextReference(attr.textReference);
			if (ref.title !== fromTitle) {
				continue;
			}
			ref.title = toTitle;
			attr.textReference = refHandler.toString(ref);
			attr.quotedValue = "{{"+attr.textReference+"}}";
		} else if (attr.type === "filtered") {
			var extendedOptions = Object.assign({placeholder: this.parser}, options);
			oldValue = attr.filter
			var filter = filterHandler.relink(attr.filter, fromTitle, toTitle, extendedOptions);
			if (!canBeFilterValue(filter)) {
				// Although I think we can actually do this one.
				throw new CannotRelinkError();
			}
			attr.filter = filter;
			attr.quotedValue = "{{{" + filter + "}}}";
			quote = "{{{";
		} else if (attr.type === "macro") {
			var macro = attr.value;
			oldValue = attr.value;
			var value = macrocall.relinkMacroInvocation(tiddler, text, macro, this.parser, fromTitle, toTitle, options);
			if (value === undefined) {
				continue;
			}
			// TODO: Let's not hack like this. attr.value is
			// expected to be a string of the unquoted value below.
			// Make this better when I can.
			oldValue.length = (macro.end-macro.start)-4;
			quote = "<<";
			attr.quotedValue = value;
		} else {
			continue;
		}
		// account for the quote if it's there.
		// We count backwards from the end to preserve whitespace
		var valueStart = attr.end
		               - (quote.length*2)
		               - oldValue.length;
		builder.add(attr.quotedValue, valueStart, attr.end);
		var logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title,
			element: this.nextTag.tag,
			attribute: attributeName
		};
		log(logMessage, logArguments, options);
	}
	if (importFilterAttr) {
		var importFilter = computeAttribute(importFilterAttr, options);
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

function computeAttribute(attribute, options) {
	var value;
	if(attribute.type === "filtered") {
		value = options.wiki.filterTiddlers(attribute.filter,options.wiki)[0] || "";
	} else if(attribute.type === "indirect") {
		value = options.wiki.getTextReference(attribute.textReference,"",self.getVariable("currentTiddler"));
	} else if(attribute.type === "macro") {
		value = self.getVariable(attribute.value.name,{params: attribute.value.params});
	} else { // String attribute
		value = attribute.value;
	}
	return value;
};

function canBeFilterValue(value) {
	return value.indexOf("}}}") < 0 && !value.endsWith('}}');
};

/**Givin some text, and an attribute within that text, this returns
 * what type of quotation that attribute is using.
 */
function determineQuote(text, attr) {
	var pos = attr.end-1;
	if (text.startsWith("'", pos)) {
		return "'";
	}
	if (text.startsWith('"', pos)) {
		if (text.startsWith('"""', pos-2)) {
			return '"""';
		} else {
			return '"';
		}
	}
	// TODO: When merging this with the other determineQuote, attributes
	// wrapped in brackets actually have the brackets as part of the ittle
	return '';
};
