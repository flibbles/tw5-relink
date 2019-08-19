/*\

Handles replacement in attributes of widgets and html elements

<$link to="TiddlerTitle" />

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var prefix = "$:/config/flibbles/relink/attributes/";
var secretCache = "__relink_text_attributes";
var elemRegExp = /<([^\/ ][^ ]*)(\s+[^>]+)\/?>/g;
var attrRegExp = /([\S=]+)(\s*=\s*['"])(.*?)['"]/g;

//newlines in element
// "<elem> attr="from here""

exports['attribute'] = function(tiddler, text, fromTitle, toTitle, options) {
	var attributes = getManagedAttributes(options),
		isModified = false,
		builder = [],
		buildIndex = 0,
		match,
		attr;
	elemRegExp.lastIndex = 0;
	while (match = elemRegExp.exec(text)) {
		var element = attributes[match[1]];
		if (!element) {
			continue;
		}
		attrRegExp.lastIndex = 0;
		while(attr = attrRegExp.exec(match[2])) {
			var attribute = element[attr[1]];
			if (!attribute) {
				continue;
			}
			var relink = utils.selectRelinker(attribute);
			var handler = new AttributeHandler(tiddler, attr[3]);
			var value = relink(handler, fromTitle, toTitle);
			if (value != undefined) {
				var valueStart = match.index + match[1].length + 1 + attr.index + attr[1].length + attr[2].length;
				builder.push(text.substr(buildIndex, valueStart));
				builder.push(value);
				buildIndex = valueStart + attr[3].length;

				isModified = true;
			}
		}
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
