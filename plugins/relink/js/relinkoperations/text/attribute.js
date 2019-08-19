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
					var valueStart = attr.end - 1 - attr.value.length;
					builder.push(text.substring(buildIndex, valueStart));
					builder.push(value);
					buildIndex = valueStart + attr.value.length;
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
