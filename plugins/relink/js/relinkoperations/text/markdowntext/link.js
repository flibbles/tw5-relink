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
	this.caption = this.getEnclosed(this.parser.source, this.match.index, '[', ']');
	if (this.caption === undefined) {
		return undefined;
	}
	var linkStart = this.match.index + this.caption.length+2;
	var internalStr = this.getEnclosed(this.parser.source, linkStart, '(', ')');
	if (internalStr === undefined) {
		return undefined;
	}
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
	this.parser.pos = this.match.index + this.caption.length + em[0].length + 4;
	if (title === fromEncoded) {
		var entry = new MarkdownLinkEntry();
		entry.caption = this.caption;
		// This way preserves whitespace
		entry.output = "["+this.caption+"]("+em[1]+utils.encodeLink(toTitle)+em[3]+")";
	}
	return entry;
};

exports.getEnclosed = function(text, pos, openChar, closeChar) {
	var capEnd = this.indexOfClose(text, pos, openChar, closeChar);
	if (capEnd < 0) {
		return undefined;
	}
	var enclosed = text.substring(pos+1, capEnd);
	if (enclosed.match(/\n\s*\n/)) {
		// Paragraph breaks are not allowed
		return undefined;
	}
	return enclosed;
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
