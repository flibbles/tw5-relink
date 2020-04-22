/*\
module-type: relinkfilteroperator

This filter returns all input tiddlers which are a source of
relink configuration.

`[all[tiddlers+system]relink:source[macros]]`

\*/

exports.signatures = function(source,operator,options) {
	var category = operator.suffix;
	var plugin = operator.operand;
	var config = options.wiki.getRelinkConfig();
	if (category === "macros") {
		return Object.keys(config.getMacros());
	}
	if (category === "attributes") {
		return Object.keys(config.getAttributes());
	}
	if (category === "operators") {
		return Object.keys(config.getOperators());
	}
	if (category === "fields") {
		return Object.keys(config.getFields());
	}
	return [];
};
