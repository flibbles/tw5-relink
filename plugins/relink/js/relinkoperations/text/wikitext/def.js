/*\
module-type: library

This is a generic def rule that manages both fnprocdef and macrodef.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var defOperators = utils.getModulesByTypeAsHashmap('relinkdef', 'name');

exports.report = function(text, callback, options) {
	// fnprocdef and macrodef have their own implementations of createDefinition
	// They create a modifiable object from the respective rule matches.
	var definition = this.createDefinition();
	var setParseTreeNode = this.parse();
	var context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(this.parser.source, this.parser.pos, definition);
	if (endMatch) {
		definition.body = endMatch[2];
		options.settings = context
		for (var operator in defOperators) {
			defOperators[operator].report(definition, callback, options);
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	context.parameterFocus = false;
	context.placeholderList = undefined;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	// fnprocdef and macrodef have their own implementations of createDefinition
	// They create a modifiable object from the respective rule matches.
	var definition = this.createDefinition();
	var setParseTreeNode = this.parse(),
		entry,
		context = this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(this.parser.source, this.parser.pos, definition);
	if (endMatch) {
		definition.body = endMatch[2];
		options.settings = context;
		for (var operator in defOperators) {
			var result = defOperators[operator].relink(definition, fromTitle, toTitle, options);
			if (result) {
				entry = entry || {};
				if (result.output) {
					entry.output = true;
				}
				if (result.impossible) {
					entry.impossible = true;
				}
			}
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
		if (entry && entry.output) {
			entry.output = reassembleSignature(definition, this.match[0]) + endMatch[1] + definition.body + endMatch[0];
		}
	}
	context.parameterFocus = false;
	context.placeholderList = undefined;
	return entry;
};

function reassembleSignature(definition, text) {
	// Reconstruct the definition. Might be tricky because we need to preserve whitespace within the parameters.
	var builder = new Rebuilder(text);
	builder.add(definition.type, 1, text.search(/[^\w\\]/));
	var pos = builder.index;
	builder.add(definition.name, skipWhitespace(text, pos), text.indexOf('(', pos));
	pos = builder.index;
	if (definition.parameters) {
		builder.add(definition.parameters, skipWhitespace(text, pos+1), text.indexOf(')'));
	}
	return builder.results();
};

function skipWhitespace(text, pos) {
	return text.substr(pos).search(/\S/)+pos;
};

// Return another match for the body, but tooled uniquely
// m[1] = whitespace before body
// m[2] = body
// m.index + m[0].length -> end of match
function getBodyMatch(text, pos, definition) {
	var whitespace,
		valueRegExp;
	if (definition.multiline) {
		valueRegExp = new RegExp("\\r?\\n[^\\S\\n\\r]*\\\\end[^\\S\\n\\r]*(?:" + $tw.utils.escapeRegExp(definition.name) + ")?(?:\\r?\\n|$)", "mg");
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
