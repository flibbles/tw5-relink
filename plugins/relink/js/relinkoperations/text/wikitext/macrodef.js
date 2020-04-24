/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var settings = require("$:/plugins/flibbles/relink/js/settings");

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

exports.relink = function(text, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse();
	var macroEntry;
	options.settings.addMacroDefinition(setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	// !m[3] means it's not a multiline macrodef
	var placeholder = /^relink-(?:(\w+)-)?(\d+)$/.exec(m[1]);
	if (placeholder && m[2] === '') {
		var valueRegExp;
		if (m[3]) {
			valueRegExp = /\r?\n\\end[^\S\n\r]*(?:\r?\n|$)/mg;
		} else {
			valueRegExp = /(?:\r?\n|$)/mg;
			this.parser.pos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
		}
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match) {
			var handler = settings.getRelinker(placeholder[1] || 'title');
			if (handler) {
				var value = text.substring(this.parser.pos, match.index);
				var entry = handler.relink(value, fromTitle, toTitle, options);
				if (entry !== undefined) {
					macroEntry = new MacrodefEntry(m[1], entry);
					if (entry.output) {
						macroEntry.output = this.makePlaceholder(m[1], entry.output+match[0], m[3]);
					}
				}
			}
			this.parser.pos = match.index + match[0].length;
		}
	}
	return macroEntry;
};

exports.makePlaceholder = function(name, content, multiline) {
	if (multiline) {
		return "\\define " + name + "()\n" + content;
	} else {
		return "\\define " + name + "() " + content;
	}
};
