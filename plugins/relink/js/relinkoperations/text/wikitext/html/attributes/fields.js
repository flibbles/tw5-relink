/*\ 
Handles replacement in widgets which allow arbitrary attributes that
correspond to tiddler fields.

\*/

exports.name = "fields";

exports.getHandler = function(element, attribute, options) {
	var regexp = options.settings.getConfig("fieldattributes")[element.tag];
	if (regexp) {
		var results = regexp.exec(attribute.name);
		if (results && results[0] === attribute.name) {
			return options.settings.getFields()[results[1]];
		}
	}
};
