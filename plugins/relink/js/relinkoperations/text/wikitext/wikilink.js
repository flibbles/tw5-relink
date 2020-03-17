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

exports.relink = function(text, fromTitle, toTitle, logger, options) {
	var out = undefined;
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== '~') {
		var logArguments = {name: "wikilink"};
		if (toTitle.match(this.matchRegExp) && toTitle[0] !== '~') {
			out = toTitle;
		} else if (utils.canBePretty(toTitle)) {
			logArguments.pretty = true;
			out = "[[" + toTitle + "]]";
		} else {
			var ph = this.parser.getPlaceholderFor(toTitle);
			logArguments.placeholder = true;
			logArguments.widget = true;
			out = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
		}
		logger.add(logArguments);
	}
	return out;
};
