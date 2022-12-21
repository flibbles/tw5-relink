/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "macrocall";

exports.getHandler = function(context, element, attributeName) {
	if (element.tag === "$macrocall") {
		var nameAttr = element.attributes["$name"];
		if (nameAttr) {
			return context.getMacro(nameAttr.value)[attributeName];
		}
	}
};
