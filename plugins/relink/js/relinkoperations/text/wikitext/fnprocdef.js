/*\
module-type: relinkwikitextrule

Handles pragma function/procedure/widget definitions.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');

exports.name = "fnprocdef";

exports.report = function(text, callback, options) {
	var setParseTreeNode = this.parse(),
		m = this.match,
		name = m[2];
	this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, m[5]);
	if (endMatch) {
		var value = endMatch[2],
			handler = getHandler(m[1]);
		var entry = handler.report(value, function(title, blurb) {
			var macroStr = '\\' + m[1] + ' ' + name + '()';
			if (blurb) {
				macroStr += ' ' + blurb;
			}
			callback(title, macroStr);
		}, options);
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse(),
		entry,
		m = this.match,
		name = m[2],
		params = m[3],
		multiline = m[5];
	this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, multiline);
	if (endMatch) {
		var value = endMatch[2],
		handler = getHandler(m[1]);
		// Relink the contents
		entry = handler.relink(value, fromTitle, toTitle, options);
		if (entry && entry.output) {
			entry.output = m[0] + endMatch[1] + entry.output + endMatch[0];
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	return entry;
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

function getHandler(macroType) {
	return utils.getType(macroType === "function"? "filter": "wikitext");
};
