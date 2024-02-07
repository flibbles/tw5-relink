/*\
module-type: relinkwikitextrule

Handles pragma function/procedure/widget definitions.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');
var defOperators = utils.getModulesByTypeAsHashmap('relinkdef', 'name');

exports.name = "fnprocdef";

exports.report = function(text, callback, options) {
	var setParseTreeNode = this.parse(),
		m = this.match,
		name = m[2];
	var context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, m[5]);
	if (endMatch) {
		var newOptions = Object.create(options);
		newOptions.settings = context;
		for (var operator in defOperators) {
			defOperators[operator].report(m[1], name, endMatch[2], callback, newOptions);
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	context.parameterFocus = false;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse(),
		entry,
		m = this.match,
		name = m[2],
		params = m[3],
		multiline = m[5];
	var context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, multiline);
	if (endMatch) {
		var value = endMatch[2],
			handler = getHandler(m[1]),
			newOptions = Object.create(options);
		newOptions.settings = context;
		// Relink the contents
		entry = handler.relink(value, fromTitle, toTitle, newOptions);
		if (entry && entry.output) {
			entry.output = m[0] + endMatch[1] + entry.output + endMatch[0];
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	context.parameterFocus = false;
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
