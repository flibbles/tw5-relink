/*\

Handles reporting of filter operators.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var titleHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/title");
var macrocall = require("$:/plugins/flibbles/relink/js/utils/macrocall.js");

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
					var macro = $tw.utils.parseMacroInvocation("<<"+operand.text+">>", 0);
					macrocall.report(options.settings, macro, function(title, blurb) {
						callback(title, (run.prefix || '') + '[' + (operator.prefix || '') + display + '<' + blurb + '>]');
					}, options);
					continue;
				} else if (operand.text) {
					var handler = fieldType(options.settings, operator, index, options)
					if (handler) {
						handler.report(operand.text, function(title, blurb) {
							if (blurb || !standaloneTitleRun(run)) {
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

exports.relink = function(filterParseTree, fromTitle, toTitle, options) {
	var output = {};
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			for (var index = 1; index <= operator.operands.length; index++) {
				var operand = operator.operands[index-1],
					entry = undefined;
				if (operand.indirect) {
					entry = refHandler.relinkInBraces(operand.text, fromTitle, toTitle, options);
				} else if (operand.variable) {
					entry = relinkMacro(options.settings, operand.text, fromTitle, toTitle, options);
				} else if (operand.text) {
					var handler = fieldType(options.settings, operator, index, options)
					if (handler) {
						entry = handler.relink(operand.text, fromTitle, toTitle, options);
						if (entry && entry.output) {
							operand.handler = handler.name;
						}
					}
				}
				if (entry) {
					if (entry.output) {
						output.changed = true;
						operand.text = entry.output;
					}
					if (entry.impossible) {
						output.impossible = true;
					}
				}
			}
		}
	}
	return output;
};

// Returns the relinker needed for a given operator, or returns undefined.
// This method should really be broken into three modules called relinkfilteroperator
function fieldType(context, operator, index, options) {
	var op = operator.operator,
		suffix = operator.suffix,
		rtn = (suffix && context.getOperator(op + ':' + suffix, index))
		   || context.getOperator(op, index);
	if (!rtn && op === 'contains' && index == 1) {
		// The 'contains' operator gets special handling
		suffix = suffix || 'list';
		var handler = context.getFields()[suffix];
		if (handler && (handler.name === 'list' || handler.name === 'filter')) {
			// Contains uses the title handler, but only if it's
			// searching a 'list' or 'filter' field.
			return titleHandler;
		}

	}
	if (!rtn && index == 1) {
		// maybe it's a field operator?
		rtn = (op === 'field' && context.getFields()[suffix])
		   || (!suffix && !options.wiki.getFilterOperators()[op] && context.getFields()[op]);
	}
	return rtn;
};

function standaloneTitleRun(run) {
	if (run.operators.length == 1) {
		var op = run.operators[0];
		return op.operator === 'title'
			&& !op.prefix
			&& !op.suffix;
	}
	return false;
};

// Takes care of relinking a macro, as well as putting it back together.
function relinkMacro(context, text, fromTitle, toTitle, options) {
	text = "<<" + text + ">>";
	var macro = $tw.utils.parseMacroInvocation(text, 0);
	var entry = macrocall.relink(context, macro, text, fromTitle, toTitle, false, options);
	if (entry && entry.output) {
		var string = macrocall.reassemble(entry.output, text, options);
		// We remove the surrounding brackets.
		string = string.substring(2, string.length-2);
		// And we make sure that no brackets remain
		if (string.indexOf(">") >= 0) {
			delete entry.output;
			entry.impossible = true;
		} else {
			entry.output = string;
		}
	}
	return entry;
};
