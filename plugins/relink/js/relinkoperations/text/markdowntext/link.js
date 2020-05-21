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
	this.matchRegExp = /\[[\s\S]*\]\(/mg;
};

exports.findNextMatch = function(startPos) {
	this.matchRegExp.lastIndex = startPos;
	this.match = this.matchRegExp.exec(this.parser.source);
	if (!this.match) {
		return undefined;
	}
	var capEnd = this.indexOfClose(this.parser.source, this.match.index, '[', ']');
	if (capEnd < 0) {
		return undefined;
	}
	this.caption = this.parser.source.substring(this.match.index+1, capEnd);
	if (this.caption.match(/\n\s*\n/)) {
		return undefined;
	}
	var linkStart = capEnd + 1;
	this.close = this.indexOfClose(this.parser.source, linkStart, '(', ')');
	if (this.close < 0) {
		return undefined;
	}
	var internalStr = this.parser.source.substring(linkStart+1, this.close);
	this.closeRegExp = /^([^\S\n]*(?:\n[^\S\n]*)?#)([\S]+)([^\S\n]*(?:\n[^\S\n]*)?)$/;
	this.endMatch = this.closeRegExp.exec(internalStr);
	if (this.endMatch) {
		return this.match.index;
	}
	return undefined;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry,
		em = this.endMatch,
		fromEncoded = utils.encodeLink(fromTitle);
	var title = em[2];
	this.parser.pos = this.close+1;
	if (title === fromEncoded) {
		var entry = new MarkdownLinkEntry();
		entry.caption = this.caption;
		// This way preserves whitespace
		entry.output = "["+this.caption+"]("+em[1]+utils.encodeLink(toTitle)+em[3]+")";
	}
	return entry;
};

exports.indexOfClose = function(text, pos, openChar, closeChar) {
	var close = pos-1,
		open = pos; // First char is open
	do {
		close = text.indexOf(closeChar, close+1);
		if (close < 0) {
			return -1;
		}
		open = text.indexOf(openChar, open+1);
	} while (open >= 0 && open <= close);
	return close;
};
