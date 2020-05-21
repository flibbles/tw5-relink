/*\
module-type: relinkmarkdowntextrule

Handles markdown links

[caption](#link)

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils/markdown");
var settings = require("$:/plugins/flibbles/relink/js/settings");
var wikitext = settings.getType('wikitext');

function MarkdownLinkEntry() {};
MarkdownLinkEntry.prototype.name = "markdownlink";
MarkdownLinkEntry.prototype.report = function() {
	var output = [];
	if (this.captionEntry) {
		$tw.utils.each(this.captionEntry.report(), function(report) {
			output.push("[" + (report || '') + "](#" + this.link + ")");
		});
	};
	if (this.newLink) {
		output.push("[" + this.caption + "](#)");
	}
	return output;
};

exports.name = "markdownlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	this.start = startPos-1;
	this.endMatch = undefined;
	do {
		this.start = this.parser.source.indexOf('[', this.start+1);
		if (this.start < 0) {
			return undefined;
		}
		this.caption = this.getEnclosed(this.parser.source, this.start, '[', ']');
		if (this.caption === undefined) {
			continue;
		}
		var linkStart = this.start + this.caption.length+2;
		if (this.parser.source[linkStart] !== '(') {
			continue;
		}
		var internalStr = this.getEnclosed(this.parser.source, linkStart, '(', ')');
		if (internalStr === undefined) {
			continue;
		}
		this.closeRegExp = /^([^\S\n]*(?:\n[^\S\n]*)?#)([\S]+)([^\S\n]*(?:\n[^\S\n]*)?)$/;
		this.endMatch = this.closeRegExp.exec(internalStr);
	} while (!this.endMatch);
	return this.start;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = new MarkdownLinkEntry(),
		em = this.endMatch,
		modified = false,
		fromEncoded = utils.encodeLink(fromTitle),
		caption = this.caption,
		link = em[2];
	this.parser.pos = this.start + this.caption.length + em[0].length + 4;
	var newCaption = wikitext.relink(caption, fromTitle, toTitle, options);
	if (newCaption) {
		modified = true;
		entry.captionEntry = newCaption;
		caption = newCaption.output;
	}
	if (link === fromEncoded) {
		modified = true;
		entry.linkChanged = true;
		// This way preserves whitespace
		link = toTitle;
	}
	if (modified) {
		entry.link = link;
		entry.caption = caption;
		entry.output = "["+caption+"]("+em[1]+utils.encodeLink(link)+em[3]+")";
		return entry;
	}
	return undefined;
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
