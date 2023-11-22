/*\

Handles reporting of [function[]] operators.

\*/

exports.name = "function";

exports.report = function(filterParseTree, callback, options) {
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
									handler.report(operand.text, function(title, blurb) {
										callback(title, '[function[' + funcName + ']' + ','.repeat(index) + '[' + (blurb || '') + ']]');
									}, options);
								}
							}
						}
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
									var entry = handler.relink(operand.text, fromTitle, toTitle, options);
									if (entry) {
										if (entry.output) {
											// TODO: What's this line about?
											operand.handler = handler.name;
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
					}
				}
			}
		}
	}
	return output;
};
