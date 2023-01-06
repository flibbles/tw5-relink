/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "macrocall";

exports.getHandler = function(element, attributeName, options) {
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			var setting = options.settings.getMacro(nameAttr.value);
			return setting && setting[attributeName];
		}
	}
};
