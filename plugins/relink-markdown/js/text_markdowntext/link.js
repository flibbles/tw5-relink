/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink-markdown/text/markdowntext/link.js
type: application/javascript

Handles markdown links

[caption](#link)

\*/

var utils = require("$:/plugins/flibbles/relink-markdown/utils/markdown");
var markdown = utils.getType('markdown');

exports.name = "markdownlink";
exports.types = {inline: true};

exports.init = function(parser) {
	this.parser = parser;
};

exports.findNextMatch = function(startPos) {
	this.endMatch = this.matchLink(this.parser.source, startPos);
	return this.endMatch ? this.endMatch.index : undefined;
};

/**A zero side-effect method which returns a regexp which pretended to match
 * the whole link, caption and all. I do this instead of just using a
 * regexp to begin with, because markdown links require context-free grammar
 * matching.
 * Currently, it doesn't properly set match[0]. No need as of yet.
 * 1. "!"
 * 2. caption
 * 3. "\s*<?#?"
 * 4. "link"
 * 5. "\s*'tooltip'"
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
		var subPos = pos + caption.length+2;
		if (text.charAt(subPos) !== '(') {
			continue;
		}
		++subPos; // Skip over that '('
		// Now we need to find the preamble before the link.
		var preambleRegExp = /(\s*\<\s*#?)|(\s*#?)/g;
		preambleRegExp.lastIndex = subPos;
		var preambleMatch = preambleRegExp.exec(text);
		subPos += preambleMatch[0].length;
		// Now that we know what kind of link we have, let's try and get it.
		var link, closingBracket = '';
		if (preambleMatch[1]) { // We have the "#<.. ..>" style link
			var bracketRegExp = /([^\>\n\r]+?)(\s*>)/g;
			bracketRegExp.lastIndex = subPos;
			var bracketMatch = bracketRegExp.exec(text);
			if (!bracketMatch) {
				continue;
			}
			link = bracketMatch[1];
			subPos = bracketRegExp.lastIndex;
			closingBracket = bracketMatch[2];
		} else { // We have the "#..." style link
			link = extractUnquotedLink(text, subPos);
			if (!link) {
				continue;
			}
			subPos += link.length;
		}
		// match[1] and match[2] are the "!" and "caption", filled in later.
		var tooltipRegExp = /((?:\s+(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\([^)]*\)))?\s*)\)/g;
		tooltipRegExp.lastIndex = subPos;
		var tooltipMatch = tooltipRegExp.exec(text);
		if (tooltipMatch
		&& tooltipMatch.index === subPos
		&& utils.indexOfParagraph(tooltipMatch[0]) < 0) {
			match = [null, "", caption, preambleMatch[0], link, closingBracket + tooltipMatch[1]];
			if (text.charAt(pos-1) === "!") {
				match.index = pos-1;
				match[1] = "!";
			} else {
				match.index = pos;
			}
			match[0] = text.substring(match.index, tooltipRegExp.lastIndex);
		}
	} while (!match);
	return match;
};

exports.report = function(text, callback, options) {
	var em = this.endMatch,
		caption = em[2],
		prefix = em[1],
		isImage = (prefix === '!'),
		hash = isImage ? em[3].trim() : '#',
		link = em[4],
		hasHash = em[3].lastIndexOf('#') >= 0;
	this.parser.pos = em.index + em[0].length;
	if (!isImage) {
		markdown.report(caption, function(title, blurb, style) {
			callback(title, prefix + '[' + (blurb || '') + '](' + hash + link + ')', style);
		}, options);
	}
	if (isImage || hasHash) {
		var safeCaption = utils.abridgeString(caption, 18);
		try {
			var decodedLink = utils.decodeLink(link);
			// If the link doesn't have a hash, it can't have any escaping
			if (hasHash || (decodedLink === link)) {
				callback(decodedLink, em[1] + '[' + safeCaption + '](' + hash + ')');
			}
		} catch (e) {
			// It must be a malformed link. Not our problem.
			// Just move on.
		}
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var entry = {},
		em = this.endMatch,
		modified = false,
		caption = em[2],
		isImage = (em[1] === '!'),
		link = em[4];
	this.parser.pos = em.index + em[0].length;
	if (!isImage) {
		var newCaption = markdown.relink(caption, fromTitle, toTitle, options);
		if (newCaption) {
			if (newCaption.output) {
				if (this.canBeCaption(newCaption.output)) {
					caption = newCaption.output;
					modified = true;
				} else {
					entry.impossible = true;
				}
			}
			if (newCaption.impossible) {
				entry.impossible = true;
			}
		}
	}
	// I don't know why internal images links don't use the '#', but links
	// do, but that's just how it is.
	// image lines can have the '#' or not. Though if they do, they can't
	// have any escaping.
	var hasHash = em[3].lastIndexOf('#') >= 0;
	try {
		var decodedLink = utils.decodeLink(link);
		if (hasHash || (isImage && (decodedLink === link))) {
			if (decodedLink === fromTitle) {
				link = utils.encodeLink(toTitle);
				if (link !== toTitle && !hasHash) {
					// If this is an image without a hash, and the title
					// required any escaping at all, then we need to add one.
					em[3] = (em[3] || '') + '#';
				}
				modified = true;
			}
		}
	} catch (e) {
		// It must be a malformed link. Not our problem.
		// Keep going in case the caption needs relinking.
	}
	if (modified) {
		// This way preserves whitespace
		entry.output = em[1]+"["+caption+"]("+em[3]+link+em[5]+")";
	}
	if (modified || entry.impossible) {
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

function extractUnquotedLink(text, pos) {
	var p = pos;
	var depth = 0;
	while (true) {
		var c = text.charAt(p);
		if (!c) {
			return undefined;
		} else if (c === '(') {
			depth++;
		} else if(c === ')') {
			if (depth === 0) {
				return text.substring(pos, p);
			}
			depth--;
		} else if (/\s/.test(c)) {
			if (depth === 0) {
				return text.substring(pos, p);
			}
			return undefined;
		}
		++p;
	}
};
