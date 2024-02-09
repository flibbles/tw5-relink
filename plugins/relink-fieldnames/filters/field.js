/*\
title: $:/plugins/flibbles/relink-fieldnames/filters/field.js
module-type: relinkfilter
type: application/javascript

Handles reporting/relinking of shorthand [[field:{field}[]] operators.

\*/

var utils = require("../utils.js");

exports.name = "field";

exports.after = ['operators'];

exports.report = function(filterParseTree, callback, options) {
	var operators = options.wiki.getFilterOperators();
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			if (!operators[operator.operator]
			&& !utils.isReserved(operator.operator, options)) {
				callback(operator.operator, "[field:" + utils.blurbOperands(operator) + "]", {soft: true});
			}
		}
	}
};

exports.relink = function(filterParseTree, fromTitle, toTitle, options) {
	var output = {};
	if (!utils.isReserved(fromTitle, options)) {
		for (var i = 0; i < filterParseTree.length; i++) {
			var run = filterParseTree[i];
			for (var j = 0; j < run.operators.length; j++) {
				var operator = run.operators[j];
				if (operator.operator === fromTitle
				&& !options.wiki.getFilterOperators()[fromTitle]) {
					if (toTitle.search(/[\[\{<\/]/) >= 0
					|| utils.isReserved(toTitle, options)) {
						// can't be an operator or a suffix. we must fail.
						output.impossible = true;
					} else {
						if (options.wiki.getFilterOperators()[toTitle]
						|| toTitle.indexOf(':') >= 0) {
							// It can't use the shorthand without causing problems
							// we use longhand field operator
							operator.operator = "field";
							operator.suffix = toTitle;
						} else {
							operator.operator = toTitle;
						}
						output.changed = true;
					}
				}
			}
		}
	}
	return output;
};
