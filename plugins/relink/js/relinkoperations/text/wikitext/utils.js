/*\
module-type: library

Utility methods for the wikitext relink rules.

\*/

exports.makeWidget = function(context, tag, attributes, body, options) {
	if (!context.allowWidgets()) {
		return undefined;
	}
	var string = '<' + tag;
	for (var attr in attributes) {
		var value = attributes[attr];
		if (value !== undefined) {
			var quoted = exports.wrapAttributeValue(value);
			if (!quoted) {
				if (!options.placeholder) {
					// It's not possible to make this widget
					return undefined;
				}
				var category = getPlaceholderCategory(context, tag, attr);
				quoted = '<<' + options.placeholder.getPlaceholderFor(value, category, options) + '>>';
			}
			string += ' ' + attr + '=' + quoted;
		}
	}
	if (body !== undefined) {
		string += '>' + body + '</' + tag + '>';
	} else {
		string += '/>';
	}
	return string;
};

function getPlaceholderCategory(context, tag, attribute) {
	var element = context.getAttribute(tag);
	var rule = element && element[attribute];
	// titles go to relink-\d
	// plaintext goes to relink-plaintext-\d
	// because titles are way more common, also legacy
	if (rule === undefined) {
		return 'plaintext';
	} else {
		rule = rule.fields.text;
		if (rule === 'title') {
			rule = undefined;
		}
		return rule;
	}
};

exports.makePrettylink = function(parser, tiddler, caption, options) {
	var output;
	if (parser.context.allowPrettylinks() && this.canBePrettylink(tiddler, caption)) {
		output = prettyLink(tiddler, caption);
	} else if (caption !== undefined) {
		var safeCaption = sanitizeCaption(parser.context, caption, options);
		if (safeCaption !== undefined) {
			output = exports.makeWidget(parser.context, '$link', {to: tiddler}, safeCaption, options);
		}
	} else if (exports.shorthandPrettylinksSupported(parser.wiki)) {
		output = exports.makeWidget(parser.context, '$link', {to: tiddler}, undefined, options);
	} else if (parser.context.allowWidgets() && parser.options.placeholder) {
		// If we don't have a caption, we must resort to
		// placeholders anyway to prevent link/caption desync
		// from later relinks.
		// It doesn't matter whether the tiddler is quotable.
		var ph = parser.options.placeholder.getPlaceholderFor(tiddler, undefined, options);
		output = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
	}
	return output;
};

function prettyLink(title, caption) {
	if (caption !== undefined) {
		return "[[" + caption + "|" + title + "]]";
	} else {
		return "[[" + title + "]]";
	}
};

/**Return true if value can be used inside a prettylink.
 */
exports.canBePrettylink = function(value, customCaption) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']' && (customCaption !== undefined || value.indexOf('|') < 0);
};

/**In version 5.1.20, Tiddlywiki made it so <$link to"something" /> would
 * use "something" as a caption. This is preferable. However, Relink works
 * going back to 5.1.14, so we need to have different handling for both
 * cases.
 */
var _supported;
exports.shorthandPrettylinksSupported = function(wiki) {
	if (_supported === undefined) {
		var test = wiki.renderText("text/plain", "text/vnd.tiddlywiki", "<$link to=test/>");
		_supported = (test === "test");
	}
	return _supported;
};

function sanitizeCaption(context, caption, options) {
	var plaintext = options.wiki.renderText("text/plain", "text/vnd.tiddlywiki", caption);
	if (plaintext === caption && caption.indexOf("</$link>") <= 0) {
		return caption;
	} else {
		return exports.makeWidget(context, '$text', {text: caption}, undefined, options);
	}
};

/**Finds an appropriate quote mark for a given value.
 *
 *Tiddlywiki doesn't have escape characters for attribute values. Instead,
 * we just have to find the type of quotes that'll work for the given title.
 * There exist titles that simply can't be quoted.
 * If it can stick with the preference, it will.
 *
 * return: Returns the wrapped value, or undefined if it's impossible to wrap
 */
exports.wrapAttributeValue = function(value, preference) {
	var whitelist = ["", "'", '"', '"""'];
	var choices = {
		"": function(v) {return !/([\/\s<>"'=])/.test(v) && v.length > 0; },
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; },
		'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';}
	};
	if (choices[preference] && choices[preference](value)) {
		return wrap(value, preference);
	}
	for (var i = 0; i < whitelist.length; i++) {
		var quote = whitelist[i];
		if (choices[quote](value)) {
			return wrap(value, quote);
		}
	}
	// No quotes will work on this
	return undefined;
};

/**Like wrapAttribute value, except for macro parameters, not attributes.
 *
 * These are more permissive. Allows brackets,
 * and slashes and '<' in unquoted values.
 */
exports.wrapParameterValue = function(value, preference) {
	var whitelist = ["", "'", '"', '[[', '"""'];
	var choices = {
		"": function(v) {return !/([\s>"'=])/.test(v); },
		"'": function(v) {return v.indexOf("'") < 0; },
		'"': function(v) {return v.indexOf('"') < 0; },
		"[[": exports.canBePrettyOperand,
		'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';}
	};
	if (choices[preference] && choices[preference](value)) {
		return wrap(value, preference);
	}
	for (var i = 0; i < whitelist.length; i++) {
		var quote = whitelist[i];
		if (choices[quote](value)) {
			return wrap(value, quote);
		}
	}
	// No quotes will work on this
	return undefined;
};

function wrap(value, wrapper) {
	var wrappers = {
		"": function(v) {return v; },
		"'": function(v) {return "'"+v+"'"; },
		'"': function(v) {return '"'+v+'"'; },
		'"""': function(v) {return '"""'+v+'"""'; },
		"[[": function(v) {return "[["+v+"]]"; }
	};
	var chosen = wrappers[wrapper];
	if (chosen) {
		return chosen(value);
	} else {
		return undefined;
	}
};

exports.canBePrettyOperand = function(value) {
	return value.indexOf(']') < 0;
};

/**Given some text, and a param or  attribute within that text, this returns
 * what type of quotation that attribute is using.
 *
 * param: An object in the form {end:, ...}
 */
exports.determineQuote = function(text, param) {
	var pos = param.end-1;
	if (text[pos] === "'") {
		return "'";
	}
	if (text[pos] === '"') {
		if (text.substr(pos-2, 3) === '"""') {
			return '"""';
		} else {
			return '"';
		}
	}
	if (text.substr(pos-1,2) === ']]' && text.substr((pos-param.value.length)-3, 2) === '[[') {
		return "[[";
	}
	return '';
};

// Finds the newline at the end of a string and returns it. Empty string if
// none exists.
exports.getEndingNewline = function(string) {
	var l = string.length;
	if (string[l-1] === '\n') {
		return (string[l-2] === '\r') ? "\r\n" : "\n";
	}
	return "";
};
