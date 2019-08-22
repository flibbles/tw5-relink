/*\
This specifies logic for replacing a single-tiddler field. This is the
simplest kind of field type. One title swaps out for the other.
\*/

/**Returns undefined if no change was made.
 */
exports.title = function(handler, fromTitle, toTitle, options) {
	var fieldValue = handler.value();
	if (fieldValue === fromTitle) {
		handler.log('field', (fieldValue || ""), toTitle);
		return toTitle;
	}
	return undefined;
};

// This is legacy support for when 'title' was known as 'field'
exports.field = exports.title;
