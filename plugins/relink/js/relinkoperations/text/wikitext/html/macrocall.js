/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "macrocall";

exports.report = function(element, parser, callback, options) {
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var macro = parser.context.getMacro(nameAttr.value);
			for (var attributeName in element.attributes) {
				var attr = element.attributes[attributeName];
				if (attr.type === "string") {
					var handler = macro[attributeName];
					if (handler) {
						handler.report(attr.value, function(title, blurb) {
							if (blurb) {
								callback(title, element + ' ' + attributeName + '="' + blurb + '"');
							} else {
								callback(title, element + ' ' + attributeName);
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
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var macro = parser.context.getMacro(nameAttr.value);
			for (var attributeName in element.attributes) {
				var attr = element.attributes[attributeName];
				if (attr.type === "string") {
					var handler = macro[attributeName];
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
