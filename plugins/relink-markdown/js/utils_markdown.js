/*\
module-type: library
title: $:/plugins/flibbles/relink/js/utils/markdown.js
type: application/javascript

Methods used in markdown parsing.

\*/

// tiddlywiki/markdown can't handle having these characters escaped, so we
// need to unescape them.
var problemChars = {
	"23": "#",
	"24": "$",
	"26": "&",
	"2B": "+",
	"2C": ",",
	"2F": "/",
	"3A": ":",
	"3B": ";",
	"3D": "=",
	"3F": "?",
	"40": "@",
};

exports.encodeLink = function(title) {
	var encoded = encodeURIComponent(title),
		balance = 0;
	encoded = encoded.replace(/[\(\)]/g, function(p) {
		if (p === '(') {
			balance++;
		} else {
			if (balance <= 0) {
				return '%29';
			}
			balance--;
		}
		return p;
	});
	while (balance--) {
		var i = encoded.lastIndexOf('(');
		encoded = encoded.substr(0, i) + '%28' + encoded.substr(i+1);
	}
	// tiddlywiki/markdown can't handle these characters escaped
	return encoded.replace(/%([0-9A-F]{2})/g, function(str, code) {
		return problemChars[code] || str;
	});
};
