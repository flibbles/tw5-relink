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
	if (this.match[0] === fromTitle && this.match[0][0] !== $tw.config.textPrimitives.unWikiLink) {
		entry = new WikilinkEntry();
		entry.link = fromTitle;
		entry.output = this.makeWikilink(toTitle, options);
		if (entry.output === undefined) {
			entry.impossible = true;
		}
	}
	return entry;
};

exports.makeWikilink = function(title, options) {
	var rtn = undefined;
	if (title.match(this.matchRegExp) && title[0] !== $tw.config.textPrimitives.unWikiLink) {
		rtn = title;
	} else if (utils.canBePretty(title)) {
		rtn = "[[" + title + "]]";
	} else if (options.placeholder) {
		var ph = options.placeholder.getPlaceholderFor(title);
		rtn = "<$link to=<<"+ph+">>><$text text=<<"+ph+">>/></$link>";
	}
	return rtn;
};
