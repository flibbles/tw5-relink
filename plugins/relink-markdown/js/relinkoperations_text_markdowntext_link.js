/*\
module-type: wikirule
title: $:/plugins/flibbles/relink/js/relinkoperations/text/markdowntext/link.js
type: application/javascript

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
		var link = this.link;
		$tw.utils.each(this.captionEntry.report(), function(report) {
			output.push("[" + (report || '') + "](#" + link + ")");
		});
	};
	if (this.linkChanged) {
		var safeCaption = this.caption.replace(/\s+/mg, ' ');
		if (safeCaption.length > exports.reportCaptionLength) {
			safeCaption = safeCaption.substr(0, exports.reportCaptionLength) + "...";
		}
		output.push("[" + safeCaption + "](#)");
	}
	return output;
};

MarkdownLinkEntry.prototype.eachChild = function(method) {
	if (this.captionEntry) {
		method(this.captionEntry);
	}
};

exports.name = "markdownlink";
exports.types = {inline: true};

// This is the maximum length a reported caption may be
exports.reportCaptionLength = 15;

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	if (!this.parser.fromTitle || this.parser.type !== "text/x-markdown") {
		// This is an ordinary parser. Skip this.
		return undefined;
	}
	this.endMatch = this.matchLink(this.parser.source, startPos);
	return this.endMatch ? this.endMatch.index : undefined;
};

/**A zero side-effect method which returns a regexp which pretended to match
 * the whole link, caption and all. I do this instead of just using a
 * regexp to begin with, because markdown links require context-free grammar
 * matching.
 * Currently, it doesn't properly set match[0]. No need as of yet.
 */
exports.matchLink = function(text, pos) {
	pos = pos-1;
	var match = undefined;
	do {
		pos = text.indexOf('[', pos+1);
		if (pos < 0) {
			return undefined;
		}
		var caption = this.getEnclosed(text, pos, '[', ']');
		if (caption === undefined) {
			continue;
		}
		var linkStart = pos + caption.length+2;
		if (text[linkStart] !== '(') {
			continue;
		}
		var internalStr = this.getEnclosed(text, linkStart, '(', ')');
		if (internalStr === undefined) {
			continue;
		}
		var closeRegExp = /^()(\s*#)([\S]+)(\s*)$/;
		match = closeRegExp.exec(internalStr);
		if (match) {
			match[1] = caption;
			match.index = pos;
		}
	} while (!match);
	return match;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = new MarkdownLinkEntry(),
		em = this.endMatch,
		modified = false,
		caption = em[1],
		link = em[3];
	this.parser.pos = em.index + caption.length + em[0].length + 4;
	var newCaption = wikitext.relink(caption, fromTitle, toTitle, options);
	if (newCaption) {
		modified = true;
		entry.captionEntry = newCaption;
		if (newCaption.output) {
			if (this.canBeCaption(newCaption.output)) {
				caption = newCaption.output;
			} else {
				newCaption.impossible = true;
			}
		}
	}
	try {
		if (decodeURIComponent(link) === fromTitle) {
			modified = true;
			entry.linkChanged = true;
			link = utils.encodeLink(toTitle);
		}
	} catch (e) {
		// It must be a malformed link. Not our problem.
		// Keep going in case the caption needs relinking.
	}
	if (modified) {
		entry.link = link;
		entry.caption = caption;
		// This way preserves whitespace
		entry.output = "["+caption+"]("+em[2]+link+em[4]+")";
		return entry;
	}
	return undefined;
};

exports.canBeCaption = function(caption) {
	return this.indexOfClose(caption+']', -1, '[', ']') === caption.length;
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
