/*\
title: $:/plugins/flibbles/relink/js/fieldtypes/field.js
type: application/javascript
module-type: relinkfield

This specifies logic for replacing a single-tiddler field. This is the
simplest kind of field type.

\*/

/**Returns undefined if no change was made.
 */
exports.field = function(handler, fromTitle, toTitle) {
	var fieldValue = handler.value();
	if (fieldValue === fromTitle) {
		handler.log('field', (fieldValue || ""), toTitle);
		return toTitle;
	}
	return undefined;
};
