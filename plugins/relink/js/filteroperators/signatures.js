/*\
module-type: relinkfilteroperator

This filter returns all input tiddlers which are a source of
relink configuration.

`[all[tiddlers+system]relink:source[macros]]`

\*/

exports.signatures = function(source,operator,options) {
	var category = operator.suffix;
	var plugin = operator.operand || null;
	var config = options.wiki.getRelinkConfig();
	var set = {};
	if (category === "macros") {
		set = config.getMacros();
	} else if (category === "attributes") {
		set = config.getAttributes();
	} else if (category === "operators") {
		set = config.getOperators();
	} else if (category === "fields") {
		set = config.getFields();
	}
	if (plugin === "$:/core") {
		// Core doesn't actually have any settings. We mean Relink
		plugin = "$:/plugins/flibbles/relink";
	}
	var signatures = [];
	for (var signature in set) {
		var source = set[signature].source;
		if (options.wiki.getShadowSource(source) === plugin) {
			signatures.push(signature);
		}
	}
	return signatures;
};
