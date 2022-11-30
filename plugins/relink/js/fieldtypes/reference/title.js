/*\

This handles the title inside of references.

\*/

exports.name = 'title';

exports.report = function(reference, callback, options) {
	var title = reference.title;
	if (title) {
		if (reference.field) {
			callback(title, '!!' + reference.field);
		} else if (reference.index) {
			callback(title, '##' + reference.index);
		} else {
			callback(title);
		}
	}
};

exports.relink = function(reference, fromTitle, toTitle, options) {
	if ($tw.utils.trim(reference.title) === fromTitle) {
		// preserve user's whitespace
		reference.title = reference.title.replace(fromTitle, toTitle);
		return {output: reference};
	}
};
