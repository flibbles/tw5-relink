/*\ 
Handles replacement in widgets which allow arbitrary attributes that
correspond to tiddler fields.

\*/

exports.name = "fields";

exports.getHandler = function(context, element, attributeName) {
	var regexp = context.getConfig("fieldwidgets")[element.tag];
	if (regexp) {
		var results = regexp.exec(attributeName);
		if (results && results[0] === attributeName) {
			return context.getFields()[results[1]];
		}
	}
};