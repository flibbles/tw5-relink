/*\
module-type: relinkwikitextrule

Handles CamelCase links

WikiLink

but not:

~WikiLink

\*/

var utils = require("./utils.js");

exports.name = "wikilink";

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = undefined;
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== '~') {
		entry = {name: "wikilink"};
		if (toTitle.match(this.matchRegExp) && toTitle[0] !== '~') {
			entry.output = toTitle;
		} else if (utils.canBePretty(toTitle)) {
			entry.pretty = true;
			entry.output = "[[" + toTitle + "]]";
		} else {
			var ph = this.parser.getPlaceholderFor(toTitle);
			entry.placeholder = true;
			entry.widget = true;
			entry.output = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
		}
	}
	return entry;
};
