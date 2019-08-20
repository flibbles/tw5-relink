/*\

Handles replacement in attributes of widgets and html elements

<$link to="TiddlerTitle" />

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var html = require("$:/core/modules/parsers/wikiparser/rules/html.js");
var prefix = "$:/config/flibbles/relink/attributes/";
var secretCache = "__relink_text_attributes";

exports['attribute'] = function(tiddler, text, fromTitle, toTitle, options) {
	var managedElements = getManagedAttributes(options),
		isModified = false,
		builder = [],
		buildIndex = 0,
		index = 0,
		match;
	while (match = html.findNextTag(text, index, options)) {
		var managedElement = managedElements[match.tag];
		if (managedElement) {
			for (var attributeName in match.attributes) {
				var expectedType = managedElement[attributeName];
				if (!expectedType) {
					continue;
				}
				var attr = match.attributes[attributeName];
				var relink = utils.selectRelinker(expectedType);
				var handler = new AttributeHandler(tiddler, attr.value);
				var value = relink(handler, fromTitle, toTitle);
				if (value != undefined) {
					var nextEql = text.indexOf('=', attr.start);
					// This is the rare case of changing
					// title "true" to something else when
					// "true" is implicit, like <$link to />
					// We ignore those.
					if (nextEql < 0 || nextEql > attr.end) {
						continue;
					}
					var quote = determineQuote(text, attr);
					console.log("QUOTE:", quote);
					// account for the quote if it's there.
					var valueStart = attr.end - (quote.length*2) - attr.value.length;
					builder.push(text.substring(buildIndex, valueStart));
					// If it wasn't quoted, quote it now to be safe.
					builder.push(wrapValue(value, quote));
					buildIndex = valueStart + attr.value.length + (quote.length*2);
					isModified = true;
				}
			}
		}
		index = match.end;
	}
	if (isModified) {
		builder.push(text.substr(buildIndex));
		return builder.join('');
	}
	return undefined;
	//while ((ptr = text.indexOf('<', ptr)) > 0) {
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

/**Tiddlywiki doesn't have escape characters for attribute values. Instead,
 * we just have to find the type of quotes that'll work for the given title.
 * There exist titles that simply can't be quoted.
 * If it can stick with the preference, it will.
 */
function wrapValue(value, preference) {
	var choices = ["'", '"', '"""'];
	if (preference) {
		if (value.indexOf(preference) < 0) {
			return preference + value + preference;
		}
	} else if (preference === '') {
		if (!/([\/\s<>"'=])/.test(value)) {
			return value;
		}
	}
	for (var i = 0; i < choices.length; i++) {
		if (value.indexOf(choices[i]) < 0) {
			return choices[i] + value + choices[i];
		}
	}
	throw new RuntimeError("Relink does not know how to relink to such a bizarre title: " + value);
};

function AttributeHandler(tiddler, value) {
	this.tiddler = tiddler;
	this._value = value;
};

AttributeHandler.prototype.log = function(adjective, from, to) {
	console.log(`Renaming attribute ${adjective} '${from}' to '${to}' of tiddler '${this.tiddler.fields.title}'`);
};

AttributeHandler.prototype.value = function() {
	return this._value;
};
/**Just like with relinkoperations/custom.js, we cache the value of this
 * method inside the options, because it's better than regenerating it for
 * every single tiddler.
 * See ../custom.js for more details.
 */
function getManagedAttributes(options) {
	var attributes = options[secretCache];
	if (attributes === undefined) {
		attributes = Object.create(null);
		options.wiki.eachShadowPlusTiddlers(function(tiddler, title) {
			if (title.startsWith(prefix)) {
				var basename = title.substr(prefix.length);
				var pair = splitAtFirst(basename, '/');
				var name = pair[0];
				attributes[name] = attributes[name] || Object.create(null);
				attributes[name][pair[1]] = tiddler.fields.text;
			}
		});
		options[secretCache] = attributes;
	}
	return attributes;
};

function splitAtFirst(string, character) {
	var index = string.indexOf(character);
	if (index < 0) {
		return [string, undefined];
	} else {
		return [string.substr(0, index), string.substr(index+1)]
	}
};
