/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');

exports.name = "macrodef";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	// This macro is not available should we need to make one.
	this.parser.reserve(m[1]);
	// !m[3] means it's not a multiline macrodef
	var placeholder = /^relink-(filter-)?(\d+)$/.exec(m[1]);
	if (placeholder && m[2] === '' && !m[3]) {
		this.parser.pos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
		var valueRegExp = /([^\n\r]+)(\r?\n)/mg;
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match) {
			if (placeholder[1]) {
				// This is a filter
				var extendedOptions = Object.assign({placeholder: this.parser}, options);
				var relinkedFilter = filterHandler(match[1], fromTitle, toTitle, extendedOptions);
				if (relinkedFilter !== undefined) {
					var message = "macrodef";
					if (extendedOptions.usedPlaceholder) {
						message = "macrodef-placeholder";
					}
					log(message, {
						from: fromTitle,
						to: toTitle,
						tiddler: tiddler.fields.title,
						macro: m[1]
					});
					this.parser.pos += match[0].length;
					return `\\define ${m[1]}() ${relinkedFilter}${match[2]}`;
				}
			} else {
				// This is a title
				if (match[1] === fromTitle) {
					log("macrodef", {
						from: fromTitle,
						to: toTitle,
						tiddler: tiddler.fields.title,
						macro: m[1]
					});
					this.parser.pos += match[0].length;
					return `\\define ${m[1]}() ${toTitle}${match[2]}`;
				}
			}
		}
	}
	return undefined;
};
