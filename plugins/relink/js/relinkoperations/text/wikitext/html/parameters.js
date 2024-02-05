/*\

Handles replacement in $macrocall widgets

\*/

exports.name = "parameters";

exports.report = function(element, parser, callback, options) {
	if (element.tag === "$parameters") {
		processParameters(element, parser, options);
	}
};

exports.relink = function(element, parser, fromTitle, toTitle, options) {
	if (element.tag === "$parameters") {
		processParameters(element, parser, options);
	}
};

function processParameters(element, parser, options) {
	var attributes = element.orderedAttributes;
	var index = 0;
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i].name;
		if (attribute[0] == '$') {
			if (attribute[1] == '$') {
				attribute = attribute.substr(1);
			} else {
				continue;
			}
		}
		parser.context.addParameter(attribute);
		++index;
	}
};
