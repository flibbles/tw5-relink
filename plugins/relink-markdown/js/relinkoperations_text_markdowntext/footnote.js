/*\
module-type: relinkmarkdownrule
title: $:/plugins/flibbles/relink-markdown/relinkoperations/text/markdowntext/footnote.js
type: application/javascript

Handles markdown footnotes

[1]: #link

\*/

var utils = require("$:/plugins/flibbles/relink-markdown/utils/markdown");

exports.name = "markdownfootnote";
exports.types = {block: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /\[((?:[^\\\]]|\\.)*)\]:(\s*)(#?)(\S+)([^\S\n]*(?:\n|$))/mg;
	this.maxIndent = 3;
};

exports.report = function(text, callback, options) {
	var m = this.match,
		decodedLink,
		entry;
	this.parser.pos = m.index + m[0].length;
	try {
		decodedLink = decodeURIComponent(m[4]);
	} catch (e) {
		// The link is malformed. Just skip it.
		return;
	}
	if (isActuallyLink(m, decodedLink, options)) {
		callback(decodedLink, '[' + utils.abridge(m[1]) + ']:');
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		link = m[4],
		entry,
		decodedLink;
	this.parser.pos = m.index + m[0].length;
	try {
		decodedLink = decodeURIComponent(m[4]);
	} catch (e) {
		// The link is malformed. Just skip it.
		return;
	}
	if (isActuallyLink(m, toTitle, options) && decodedLink === fromTitle) {
		var encodedTo = utils.encodeLink(toTitle);
		if (m[3] !== '#' && (encodedTo !== toTitle)) {
			// We need to add in a hash, because this old-type footnote can't
			// support the new title.
			m[3] = '#';
		}
		entry = { output: this.indentString + "[" + m[1] + "]:" + m[2] + m[3] + encodedTo + m[5] };
	}
	return entry;
};

function isActuallyLink(match, tiddlerTitle, options) {
	return match[1].charAt(0) !== '^'
		&& (match[3] === '#'
			|| (options.wiki.isImageTiddler(tiddlerTitle)
				&& decodeURIComponent(match[4]) === match[4]));
};
