/*\
This specifies logic for replacing a single-tiddler field. This is the
simplest kind of field type. One title swaps out for the other.
\*/

exports.name = 'title';

/**Returns undefined if no change was made.
 */
exports.relink = function(value, fromTitle, toTitle, options) {
	if (value === fromTitle) {
		return toTitle;
	}
	return undefined;
};

// This is legacy support for when 'title' was known as 'field'
exports.aliases = ['field', 'yes'];
