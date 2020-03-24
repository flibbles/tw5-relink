/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var settings = require("$:/plugins/flibbles/relink/js/settings");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = "macrodef";

exports.relink = function(text, fromTitle, toTitle, options) {
	var setParseTreeNode = this.parse();
	var parentWidget = this.parser.getVariableWidget();
	var setWidget = parentWidget.makeChildWidget(setParseTreeNode[0]);
	setWidget.computeAttributes();
	setWidget.execute();
	this.parser.addWidget(setWidget);
	// Parse set the pos pointer, but we don't want to skip the macro body.
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	// This macro is not available should we need to make one.
	this.parser.reserve(m[1]);
	// !m[3] means it's not a multiline macrodef
	var placeholder = /^relink-(?:(\w+)-)?(\d+)$/.exec(m[1]);
	if (placeholder && m[2] === '' && !m[3]) {
		this.parser.pos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
		var valueRegExp = /([^\n\r]+)(\r?\n)/mg;
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match) {
			var handler = settings.getRelinker(placeholder[1] || 'title');
				// This is a filter
			var entry = handler.relink(match[1], fromTitle, toTitle, options);
			if (entry !== undefined) {
				var macroEntry = new EntryNode("macrodef");
				macroEntry.macro = m[1];
				macroEntry.add(entry);
				this.parser.pos += match[0].length;
				macroEntry.output = "\\define "+m[1]+"() "+entry.output+match[2];
				return macroEntry;
			}
		}
	}
	return undefined;
};
