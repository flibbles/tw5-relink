/*\ 
Handles replacement in widgets which allow arbitrary attributes that
correspond to tiddler fields.

\*/

exports.name = "fields";

exports.getHandler = function(element, attributeName, options) {
	var regexp = options.settings.getConfig("fieldwidgets")[element.tag];
	if (regexp) {
		var results = regexp.exec(attributeName);
		if (results && results[0] === attributeName) {
			return options.settings.getFields()[results[1]];
		}
	}
};
