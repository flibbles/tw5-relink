/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');

exports.name = "macrodef";

function MacrodefEntry(macroName, bodyEntry) {
	this.macro = macroName;
	this.body = bodyEntry;
};
MacrodefEntry.prototype.name = "macrodef";
MacrodefEntry.prototype.eachChild = function(block) { return block(this.body);};
MacrodefEntry.prototype.report = function() {
	var macroStr = "\\define " + this.macro + "()";
	if (this.body.report) {
		return this.body.report().map(function(report) {
			return macroStr + " " + report;
		});
	} else {
		return [macroStr];
	}
};

exports.report = function(text, callback, options) {
	var setParseTreeNode = this.parse(),
		macroEntry,
		m = this.match,
		name = m[1];
	this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, m[3]);
	if (endMatch) {
		var value = endMatch[2],
			handler = utils.getType(getActiveType(name, m[2]));
		if (handler) {
			var entry = handler.report(value, function(blurb, title) {
				var macroStr = '\\define ' + name + '()';
				if (blurb) {
					macroStr += ' ' + blurb;
				}
				callback(macroStr, title);
			}, options);
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse(),
		macroEntry,
		m = this.match,
		name = m[1],
		params = m[2],
		multiline = m[3];
	this.parser.context = new VariableContext(this.parser.context, setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var endMatch = getBodyMatch(text, this.parser.pos, multiline);
	if (endMatch) {
		var value = endMatch[2],
			type = getActiveType(name, params),
			handler = utils.getType(type || 'wikitext');
		if (handler) {
			// If this is an active relink placeholder, then let's remember it
			if (type && options.placeholder) {
				options.placeholder.registerExisting(name, value);
			}
			// Relink the contents
			var entry = handler.relink(value, fromTitle, toTitle, options);
		}
		if (entry !== undefined) {
			macroEntry = new MacrodefEntry(name, entry);
			if (entry.output) {
				macroEntry.output = m[0] + endMatch[1] + entry.output + endMatch[0];
			}
		}
		this.parser.pos = endMatch.index + endMatch[0].length;
	}
	return macroEntry;
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

function getActiveType(macroName, parameters) {
	// TODO: Don't need to group that number
	var placeholder = /^relink-(?:(\w+)-)?(\d+)$/.exec(macroName);
	// normal macro or special placeholder?
	if (placeholder && parameters === '') {
		return placeholder[1] || 'title';
	}
	return undefined;
};
