/*\
module-type: relinkfilteroperator
title: $:/plugins/flibbles/relink-variables/filter.js
type: application/javascript

This filter operator returns the names of all variables which are exportable by this tiddler. It does not remove duplicates.

[[myTiddler]relink:variables[]] -> variables in order of appearance

\*/

exports.variables = function(source, operator, options) {
	var results = [];
	source(function(tiddler, title) {
		var parser = options.wiki.parseTiddler(title);
		if (parser) {
			// ptn stands for parseTreeNode
			var ptn = parser.tree[0];
			while (ptn
			&& ptn.type === "set"
			&& (ptn.isMacroDefinition || ptn.isFunctionDefinition || ptn.isProcedureDefinition || ptn.isWidgetDefinition)) {
				var name = ptn.attributes.name.value;
				results.push(name);
				ptn = ptn.children && ptn.children[0];
			}
		}
	});
	return results;
};
