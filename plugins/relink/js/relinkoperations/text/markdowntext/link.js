/*\
module-type: relinkmarkdowntextrule

Handles markdown links

[caption](#link)

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");

function MarkdownLinkEntry() {};
MarkdownLinkEntry.prototype.name = "markdownlink";
MarkdownLinkEntry.prototype.report = function() {
	return ["[" + this.caption + "](#)"];
};

exports.name = "markdownlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /\[([^\]]+)\]\(/mg;
};

exports.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	if (this.match) {
		var linkStart = this.match.index + this.match[0].length;
		this.close = this.indexOfClose(this.parser.source, linkStart);
		if (this.close >= 0) {
			var internalStr = this.parser.source.substring(linkStart, this.close);
			this.closeRegExp = /^([^\S\n]*(?:\n[^\S\n]*)?#)([\S]+)([^\S\n]*(?:\n[^\S\n]*)?)$/;
			this.endMatch = this.closeRegExp.exec(internalStr);
			if (this.endMatch) {
				return this.match.index;
			}
		}
	}
	return undefined;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry,
		m = this.match,
		em = this.endMatch,
		fromEncoded = utils.encodeLink(fromTitle);
	var title = em[2];
	this.parser.pos = this.close+1;
	if (title === fromEncoded) {
		var entry = new MarkdownLinkEntry();
		entry.caption = m[1];
		// This way preserves whitespace
		entry.output = "["+m[1]+"]("+em[1]+utils.encodeLink(toTitle)+em[3]+")";
	}
	return entry;
};

exports.indexOfClose = function(text, pos) {
	var close = pos-1,
		open = pos-1;
	do {
		close = text.indexOf(')', close+1);
		if (close < 0) {
			return -1;
		}
		open = text.indexOf('(', open+1);
	} while (open >= 0 && open <= close);
	return close;
};
