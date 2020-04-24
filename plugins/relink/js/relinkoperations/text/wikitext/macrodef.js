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
	options.settings.addMacroDefinition(setParseTreeNode[0]);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	// !m[3] means it's not a multiline macrodef
	var placeholder = /^relink-(?:(\w+)-)?(\d+)$/.exec(m[1]);
	if (placeholder && m[2] === '' && !m[3]) {
		this.parser.pos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
		var valueRegExp = /([^\n\r]+)($|\r?\n)/mg;
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match) {
			var handler = settings.getRelinker(placeholder[1] || 'title');
			if (!handler) {
				// Skip it, and the body too
				this.parser.pos += match[0].length;
			} else {
				// This is a filter
				var entry = handler.relink(match[1], fromTitle, toTitle, options);
				if (entry !== undefined) {
					var macroEntry = new MacrodefEntry(m[1], entry);
					this.parser.pos += match[0].length;
					if (entry.output) {
						macroEntry.output = this.makePlaceholder(m[1], entry.output+match[2]);
					}
					return macroEntry;
				}
			}
		}
	}
	return undefined;
};

exports.makePlaceholder = function(name, content) {
	return "\\define " + name + "() " + content;
};
