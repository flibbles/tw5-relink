/*\
module-type: library
title: $:/plugins/flibbles/relink/js/utils/markdown.js
type: application/javascript

Methods used in markdown parsing.

\*/

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
	return encoded;
};
