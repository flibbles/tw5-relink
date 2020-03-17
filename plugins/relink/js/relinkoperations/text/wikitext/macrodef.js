/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var settings = require("$:/plugins/flibbles/relink/js/settings");

exports.name = "macrodef";

exports.relink = function(text, fromTitle, toTitle, logger, options) {
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
			var extendedOptions = $tw.utils.extend({placeholder: this.parser}, options);
			var value = handler.relink(match[1], fromTitle, toTitle, extendedOptions);
			if (value !== undefined) {
				var logArguments = {
					name: "macrodef",
					macro: m[1]
				};
				if (extendedOptions.usedPlaceholder) {
					logArguments.placeholder = true;
				}
				logger.add(logArguments);
				this.parser.pos += match[0].length;
				return "\\define "+m[1]+"() "+value+match[2];
			}
		}
	}
	return undefined;
};
