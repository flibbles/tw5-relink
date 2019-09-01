/*\
module-type: relinkwikitextrule

Handles replacement in attributes of widgets and html elements
This is configurable to select exactly which attributes of which elements
should be changed.

<$link to="TiddlerTitle" />

\*/

var utils = require("./utils.js");
var html = require("$:/core/modules/parsers/wikiparser/rules/html.js");
var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var settings = require('$:/plugins/flibbles/relink/js/settings.js');
var referenceHandler = settings.getRelinker('reference');
var CannotRelinkError = require("$:/plugins/flibbles/relink/js/CannotRelinkError.js");

exports.name = "html";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	var managedElement = settings.getAttributes(options)[this.nextTag.tag],
		builder = [],
		buildIndex = this.nextTag.start;
	for (var attributeName in this.nextTag.attributes) {
		var attr = this.nextTag.attributes[attributeName];
		var nextEql = text.indexOf('=', attr.start);
		// This is the rare case of changing tiddler
		// "true" to something else when "true" is
		// implicit, like <$link to /> We ignore those.
		if (nextEql < 0 || nextEql > attr.end) {
			continue;
		}
		var value, quote, logMessage = "attribute";
		if (attr.type === "string") {
			if (!managedElement) {
				// We don't manage this element. Bye.
				continue;
			}
			var relinker = managedElement[attributeName];
			if (!relinker) {
				// We don't manage this attribute. Bye.
				continue;
			}
			var extendedOptions = Object.assign({placeholder: this.parser}, options);
			value = relinker(attr.value, fromTitle, toTitle, extendedOptions);
			if (value === undefined) {
				continue;
			}
			if (extendedOptions.usedPlaceholder) {
				logMessage = "attribute-placeholder";
			}
			quote = determineQuote(text, attr);
			var quoted = utils.wrapAttributeValue(value,quote);
			if (quoted === undefined) {
				// The value was unquotable. We need to make
				// a macro in order to replace it.
				quoted = "<<"+this.parser.getPlaceholderFor(value)+">>";
				logMessage = "attribute-placeholder";
			}
			value = quoted;
		} else if (attr.type === "indirect") {
			if (toTitle.indexOf("}") >= 0) {
				// Impossible replacement
				throw new CannotRelinkError();
			}
			quote = "{{";
			var ref = $tw.utils.parseTextReference(attr.textReference);
			if (ref.title !== fromTitle) {
				continue;
			}
			ref.title = toTitle;
			attr.value = attr.textReference;
			value = "{{"+referenceToString(ref)+"}}";
		} else {
			continue;
		}
		// account for the quote if it's there.
		var valueStart = attr.end
		               - (quote.length*2)
		               - attr.value.length;
		builder.push(text.substring(buildIndex, valueStart));
		var logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title,
			element: this.nextTag.tag,
			attribute: attributeName
		};
		builder.push(value);
		log(logMessage, logArguments);
		buildIndex = attr.end;
	}
	this.parser.pos = this.nextTag.end;
	if (builder.length > 0) {
		builder.push(text.substring(buildIndex, this.nextTag.end));
		return builder.join('');
	}
	return undefined;
};

function referenceToString(textReference) {
	var title = textReference.title || '';
	if (textReference.field) {
		return title + "!!" + textReference.field;
	} else if (textReference.index) {
		return title + "##" + textReference.index;
	}
	return title;
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
	return '';
};
