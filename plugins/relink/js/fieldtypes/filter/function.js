/*\

Handles reporting of [function[]] operators.

\*/

exports.name = "function";

exports.report = function(filterParseTree, callback, options) {
	forEachOperand(filterParseTree, options, function(name, operand, handler, index) {
		handler.report(operand.text, function(title, blurb, style) {
			callback(title, '[function[' + name + ']' + ','.repeat(index) + '[' + (blurb || '') + ']]', style);
		}, options);
	});
};

exports.relink = function(filterParseTree, fromTitle, toTitle, options) {
	var output = {};
	forEachOperand(filterParseTree, options, function(name, operand, handler, index) {
		var entry = handler.relink(operand.text, fromTitle, toTitle, options);
		if (entry) {
			if (entry.output) {
				output.changed = true;
				operand.text = entry.output;
			}
			if (entry.impossible) {
				output.impossible = true;
			}
		}
	});
	return output;
};

// Calls the callback for every applicable operand of a function operator
function forEachOperand(filterParseTree, options, callback) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			var titleOp = operator.operands[0];
			if (operator.operator === "function"
			&& !titleOp.variable && !titleOp.indirect
			&& titleOp.text) {
				var funcName = titleOp.text;
				var managedMacro = options.settings.getMacro(funcName);
				if (managedMacro) {
					var def = options.settings.getMacroDefinition(funcName);
					if (def && def.isFunctionDefinition) {
						for (var index = 1; index < operator.operands.length; index++) {
							var operand = operator.operands[index];
							if (!operand.variable && !operand.indirect
							&& def.params.length >= index) {
								var paramName = def.params[index-1].name;
								var handler = managedMacro[paramName];
								if (handler) {
									callback(funcName, operand, handler, index);
								}
							}
						}
					}
				}
			}
		}
	}
};
