/*\
module-type: relinkwikitextrule

Handles CamelCase links

WikiLink

but not:

~WikiLink

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var utils = require("./utils.js");

exports.name = "wikilink";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
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
		} else if (utils.canBePretty(toTitle)) {
			log("wikilink-pretty", logArguments);
			return "[[" + toTitle + "]]";
		} else {
			var ph = this.parser.getPlaceholderFor(toTitle);
			log("wikilink-placeholder", logArguments);
			return `<$link to=${ph}><$text text=${ph}/></$link>`;
		}
	}
	return undefined;
};
