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
	return utils.getType(macroType === "function"? "filter": "wikitext");
};
