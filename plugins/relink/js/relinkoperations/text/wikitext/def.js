/*\
module-type: library

This is a generic def rule that manages both fnprocdef and macrodef.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');
var defOperators = utils.getModulesByTypeAsHashmap('relinkdef', 'name');

exports.reportDefinition = function(text, definition, callback, options) {
	var setParseTreeNode = this.parse();
	var context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, definition.multiline);
	if (endMatch) {
		definition.body = endMatch[2];
		var newOptions = Object.create(options);
		newOptions.settings = context;
		for (var operator in defOperators) {
			defOperators[operator].report(definition, callback, newOptions);
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	context.parameterFocus = false;
};

exports.relinkDefinition = function(text, definition, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse(),
		entry,
		context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, definition.multiline);
	if (endMatch) {
		definition.body = endMatch[2];
		var newOptions = Object.create(options);
		newOptions.settings = context;
		for (var operator in defOperators) {
			entry = defOperators[operator].relink(definition, fromTitle, toTitle, newOptions);
		}
		if (entry && entry.output) {
			entry.output = definition.signature + endMatch[1] + entry.output + endMatch[0];
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
