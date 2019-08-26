/*\
module-type: relinkwikitextrule

Handles CamelCase links

WikiLink

but not:

~WikiLink

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;

exports['wikilink'] = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== '~') {
		var logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		};
		if (toTitle.match(this.matchRegExp) && toTitle[0] !== '~') {
			log("wikilink", logArguments);
			return toTitle;
		} else {
			log("wikilink-pretty", logArguments);
			return "[[" + toTitle + "]]";
		}
	}
	return undefined;
};

