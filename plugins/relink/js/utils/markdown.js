/*\
module-type: library

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
		encoded = encoded.replace('(', '%28');
	}
	return encoded;
};
