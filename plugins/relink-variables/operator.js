/*\
module-type: relinkfilteroperator
title: $:/plugins/flibbles/relink-variables/operator.js
type: application/javascript

This filter operator returns the names of all variables which are exportable by this tiddler. It does not remove duplicates.

[[myTiddler]relink:variables[]] -> variables in order of appearance

\*/

exports.variables = function(source, operator, options) {
	var results = [];
	source(function(tiddler, title) {
		if (tiddler && tiddler.fields['module-type'] === "macro") {
			// This is a javascript module, probably
			var module = require(title);
			if (module && module.name) {
				results.push(module.name);
			}
		} else {
			var parser = options.wiki.parseTiddler(title);
			if (parser) {
				// ptn stands for parseTreeNode
				var ptn = parser.tree[0];
				while (ptn && (
				ptn.type === "set"
				|| ptn.type === "parameters"
				|| ptn.type === "setvariable")) {
					if (!ptn.isRelinkDefinition
					&& (ptn.isMacroDefinition
					 || ptn.isFunctionDefinition
					 || ptn.isProcedureDefinition
					 || ptn.isWidgetDefinition)) {
						var name = ptn.attributes.name.value;
						results.push(name);
					}
					ptn = ptn.children && ptn.children[0];
				}
			}
		}
	});
	return results;
};
