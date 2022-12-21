/*\ 
Handles replacement in widgets which allow arbitrary attributes that
correspond to tiddler fields.

\*/

exports.name = "fieldwidgets";

exports.report = function(element, parser, callback, options) {
	var regexp = parser.context.getFieldWidgets()[element.tag];
	if (regexp) {
		for (var attributeName in element.attributes) {
			var attr = element.attributes[attributeName];
			if (attr.type === "string") {
				var results = regexp.exec(attributeName);
				if (results) {
					var handler = parser.context.getFields()[results[1]];
					if (handler) {
						handler.report(attr.value, function(title, blurb) {
							if (blurb) {
								callback(title, element.tag + ' ' + attributeName + '="' + blurb + '"');
							} else {
								callback(title, element.tag + ' ' + attributeName);
							}
						}, options);
					}
				}
			}
		}
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	var changed = undefined;
	var impossible = undefined;
	var regexp = parser.context.getFieldWidgets()[element.tag];
	if (regexp) {
		for (var attributeName in element.attributes) {
			var attr = element.attributes[attributeName];
			if (attr.type === "string") {
				var results = regexp.exec(attributeName);
				if (results) {
					var handler = parser.context.getFields()[results[1]];
					if (handler) {
						var entry = handler.relink(attr.value, fromTitle, toTitle, options);
						if (entry) {
							if (entry.output) {
								attr.value = entry.output;
								attr.handler = handler.name;
								changed = true;
							}
							if (entry.impossible) {
								impossible = true;
							}
						}
					}
				}
			}
		}
	}
	if (changed || impossible) {
		return {output: changed, impossible: impossible};
	}
};
