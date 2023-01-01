/*\

Handles reporting of filter operators.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");

exports.name = "operators";

exports.report = function(filterParseTree, callback, options) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			for (var index = 1; index <= operator.operands.length; index++) {
				var operand = operator.operands[index-1];
				var display = operator.operator === 'title'? '': operator.operator;
				if (operator.suffix) {
					display += ':' + operator.suffix;
				}
				// Now add any commas if this is a later operand
				for (var x = 1; x < index; x++) {
					display += ',';
				}
				if (operand.indirect) {
					refHandler.report(operand.text, function(title, blurb) {
						callback(title, (run.prefix || '') + '[' + (operator.prefix || '') + display + '{' + (blurb || '') + '}]');
					}, options);
				} else if (operand.variable) {
					// TODO: Handle macros here. They can take arguments now
					continue;
				} else if (operand.text) {
					var handler = fieldType(options.settings, operator, index, options)
					if (handler) {
						handler.report(operand.text, function(title, blurb) {
							if (blurb
							|| operator.operator !== 'title'
							|| run.operators.length > 1
							|| operator.prefix
							|| operator.suffix) {
								callback(title, (run.prefix || '') + '[' + (operator.prefix || '') + display + '[' + (blurb || '') + ']]');
							} else {
								callback(title, run.prefix);
							}
						}, options);
					}
				}
			}
		}
	}
};

// Returns the relinker needed for a given operator, or returns undefined.
function fieldType(context, operator, index, options) {
	var op = operator.operator,
		suffix = operator.suffix,
		rtn = (suffix && context.getOperator(op + ':' + suffix, index))
		   || context.getOperator(op, index);
	if (!rtn && index == 1) {
		// maybe it's a field operator?
		rtn = (op === 'field' && context.getFields()[suffix])
		   || (!suffix && !options.wiki.getFilterOperators()[op] && context.getFields()[op]);
	}
	return rtn;
};

