/*\
module-type: relinkfilter
title: $:/plugins/flibbles/relink-variables/filter.js
type: application/javascript

Takes care of relinking functions used in filters (i.e. [my.func[]])

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils.js");
var varRelinker = utils.getType('variable');

exports.name = "variables";

exports.report = function(filterParseTree, callback, options) {
	forEachFunctionOperator(filterParseTree, options, function(operator, def) {
		varRelinker.reportForTitle(operator.operator, function(title, blurb, style) {
			blurb = [];
			for (var i = 0; i < operator.operands.length; i++) {
				var operand = operator.operands[i];
				if (operand.indirect) {
					blurb.push('{' + operand.text + '}');
				} else if (operand.variable) {
					blurb.push('<' + operand.text + '>');
				} else if (operand.text) {
					blurb.push('[' + operand.text + ']');
				} else {
					blurb.push('');
				}
			}
			callback(title, '[' + blurb.join(',') + ']', style);
		}, def.tiddler);
	});
};

exports.relink = function(filterParseTree, fromTitle, toTitle, options) {
	var output = {};
	forEachFunctionOperator(filterParseTree, options, function(operator, def) {
		var entry = varRelinker.relinkForTitle(operator.operator, fromTitle, toTitle, def.tiddler);
		if (entry) {
			if (entry.output) {
				if (entry.output.indexOf('.') < 0
				|| entry.output.search(/[\[\{<\/]/) >= 0) {
					output.impossible = true;
				} else {
					operator.operator = entry.output;
					output.changed = true;
				}
			}
			if (entry.impossible) {
				output.impossible = true;
			}
		}
	});
	return output;
};

function forEachFunctionOperator(filterParseTree, options, method) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			if (operator.operator.indexOf('.') >= 0) {
				var def = options.settings.getMacroDefinition(operator.operator);
				if (def && def.isFunctionDefinition) {
					method(operator, def);
				}
			}
		}
	}
};
