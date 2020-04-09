/*\
module-type: relinkwikitextrule

Handles CamelCase links

WikiLink

but not:

~WikiLink

\*/

var utils = require("./utils.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = "wikilink";

var WikilinkEntry = EntryNode.newType("wikilink");

WikilinkEntry.prototype.report = function() {
	return ["~" + this.link];
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = undefined;
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== '~') {
		entry = new WikilinkEntry();
		entry.link = fromTitle;
		if (toTitle.match(this.matchRegExp) && toTitle[0] !== '~') {
			entry.output = toTitle;
		} else if (utils.canBePretty(toTitle)) {
			entry.pretty = true;
			entry.output = "[[" + toTitle + "]]";
		} else {
			var ph = options.placeholder.getPlaceholderFor(toTitle);
			entry.placeholder = true;
			entry.widget = true;
			entry.output = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
		}
	}
	return entry;
};
