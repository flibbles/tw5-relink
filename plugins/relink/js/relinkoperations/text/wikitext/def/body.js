/*\


\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");

exports.name = "body";

exports.report = function(type, name, body, callback, options) {
	var handler = getHandler(type, name),
		newOptions = Object.create(options);
	if (handler) {
		var entry = handler.report(body, function(title, blurb) {
			var macroStr = '\\' + type + ' ' + name + '()';
			if (blurb) {
				macroStr += ' ' + blurb;
			}
			callback(title, macroStr);
		}, newOptions);
	}
};

// Return another match for the body, but tooled uniquely
// m[1] = whitespace before body
// m[2] = body
// m.index + m[0].length -> end of match
function getBodyMatch(text, pos, isMultiline) {
	var whitespace,
		valueRegExp;
	if (isMultiline) {
		valueRegExp = /\r?\n\\end[^\S\n\r]*(?:\r?\n|$)/mg;
		whitespace = '';
	} else {
		valueRegExp = /(?:\r?\n|$)/mg;
		var newPos = $tw.utils.skipWhiteSpace(text, pos);
		whitespace = text.substring(pos, newPos);
		pos = newPos;
	}
	valueRegExp.lastIndex = pos;
	var match = valueRegExp.exec(text);
	if (match) {
		match[1] = whitespace;
		match[2] = text.substring(pos, match.index);
	}
	return match;
};

function getHandler(macroType, macroName) {
	var type;
	switch (macroType) {
	case "function":
		type = "filter";
		break;
	case "define":
		/**This returns the handler to use for a macro
		 * By default, we treat them like wikitext, but Relink used to make
		 * little macros as placeholders. If we find one, we must return
		 * the correct handler for what that placeholder represented.
		 */
		var placeholder = /^relink-(?:(\w+)-)?\d+$/.exec(macroName);
		// normal macro or special placeholder?
		if (placeholder) {
			type = placeholder[1] || 'title';
			break;
		}
	default:
		type = 'wikitext';
	}
	return utils.getType(type);
};
