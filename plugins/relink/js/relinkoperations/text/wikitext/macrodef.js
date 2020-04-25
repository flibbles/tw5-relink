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
	var setParseTreeNode = this.parse(),
		macroEntry,
		m = this.match,
		placeholder = /^relink-(?:(\w+)-)?(\d+)$/.exec(m[1]),
		whitespace;
	options.settings.addMacroDefinition(setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	if (placeholder && m[2] === '') {
		var valueRegExp;
		// m[3] means it's a multiline macrodef
		if (m[3]) {
			valueRegExp = /\r?\n\\end[^\S\n\r]*(?:\r?\n|$)/mg;
			whitespace = m[3];
		} else {
			var newPos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
			valueRegExp = /(?:\r?\n|$)/mg;
			whitespace = text.substring(this.parser.pos, newPos);
			this.parser.pos = newPos;
		}
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match) {
			var handler = settings.getType(placeholder[1] || 'title');
			if (handler) {
				var value = text.substring(this.parser.pos, match.index);
				var entry = handler.relink(value, fromTitle, toTitle, options);
				if (entry !== undefined) {
					macroEntry = new MacrodefEntry(m[1], entry);
					if (entry.output) {
						macroEntry.output = this.makePlaceholder(m[1], whitespace+entry.output+match[0]);
					}
				}
			}
			this.parser.pos = match.index + match[0].length;
		}
	}
	return macroEntry;
};

exports.makePlaceholder = function(name, content) {
	return "\\define " + name + "()" + content;
};
