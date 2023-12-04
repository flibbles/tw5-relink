/*\
module-type: library

Utility methods for the wikitext relink rules.

\*/

exports.makeWidget = function(parser, tag, attributes, body) {
	if (!parser.context.allowWidgets()) {
		return undefined;
	}
	var string = '<' + tag;
	for (var attr in attributes) {
		var value = attributes[attr];
		if (value !== undefined) {
			var quoted = exports.wrapAttributeValue(value);
			if (!quoted) {
				// It's not possible to make this widget
				return undefined;
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

exports.makePrettylink = function(parser, title, caption) {
	var output;
	if (parser.context.allowPrettylinks() && canBePrettylink(title, caption)) {
		if (caption !== undefined) {
			output = "[[" + caption + "|" + title + "]]";
		} else {
			output = "[[" + title + "]]";
		}
	} else if (caption !== undefined) {
		var safeCaption = sanitizeCaption(parser, caption);
		if (safeCaption !== undefined) {
			output = exports.makeWidget(parser, '$link', {to: title}, safeCaption);
		}
	} else if (exports.shorthandPrettylinksSupported(parser.wiki)) {
		output = exports.makeWidget(parser, '$link', {to: title});
	}
	return output;
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

/**Return true if value can be used inside a prettylink.
 */
function canBePrettylink(value, customCaption) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']' && (customCaption !== undefined || value.indexOf('|') < 0);
};

function sanitizeCaption(parser, caption) {
	var plaintext = parser.wiki.renderText("text/plain", "text/vnd.tiddlywiki", caption);
	if (plaintext === caption && caption.indexOf("</$link>") <= 0) {
		return caption;
	} else {
		return exports.makeWidget(parser, '$text', {text: caption});
	}
};

exports.containsPlaceholders = function(string) {
	// Does it contain a variable placeholder?
	if (/\$\(([^\)\$]+)\)\$/.test(string)) {
		return true;
	}
	// Does it contain a filter placeholder?
	var filterStart = string.indexOf("${");
	if (filterStart >= 0 && string.indexOf("}$", filterStart+3) >= 0) {
		return true;
	}
	// If no, then it's just a string.
	return false;
};

var whitelist = ["", "'", '"', '"""'];
var choices = {
	"": function(v) {return !/([\/\s<>"'`=])/.test(v) && v.length > 0; },
	"'": function(v) {return v.indexOf("'") < 0; },
	'"': function(v) {return v.indexOf('"') < 0; },
	'"""': function(v) {return v.indexOf('"""') < 0 && v[v.length-1] != '"';},
};
var _backticksSupported;

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
	if (_backticksSupported === undefined) {
		var test = $tw.wiki.renderText("text/plain", "text/vnd.tiddlywiki", "<$link to=`test`/>");
		_backticksSupported = (test === "test");
		if (_backticksSupported) {
			// add in support for the backtick to the lists
			whitelist.push('`', '```');
			choices['`'] = function(v) {return v.indexOf('`') < 0 && !exports.containsPlaceholders(v); };
			choices['```'] = function(v) {return v.indexOf('```') < 0 && v[v.length-1] != '`' && !exports.containsPlaceholders(v);};
		}
	}
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
		"[[": function(v) {return "[["+v+"]]"; },
		"`": function(v) {return '`'+v+'`'; },
		'```': function(v) {return '```'+v+'```'; }
	};
	var chosen = wrappers[wrapper];
	if (chosen) {
		return chosen(value);
	} else {
		return undefined;
	}
};

function canBePrettyOperand(value) {
	return value.indexOf(']') < 0;
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
