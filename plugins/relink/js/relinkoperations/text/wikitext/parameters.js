/*\
module-type: relinkwikitextrule

Handles parameters pragma.

\parameters(...)

\*/

exports.name = "parameters";

exports.report = function(text, callback, options) {
	operate(this, options);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	operate(this, options);
};

function operate(rule, options) {
	var parser = rule.parser;
	var parseTreeNode = rule.parse();
	var attributes = parseTreeNode[0].orderedAttributes;
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i].name;
		parser.context.addParameter(attribute);
	}
};
