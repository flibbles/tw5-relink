/*\
title: $:/plugins/flibbles/relink-fieldnames/suffixes.js
module-type: relinkfilter
type: application/javascript

Handles reporting of filter operators.

\*/

var utils = require("./utils.js");

exports.name = "suffixes";

exports.report = function(filterParseTree, callback, options) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			var settings = options.settings.getConfig('suffixes')[operator.operator];
			if (settings) {
				settings[1].report(operator.suffix, function(title, blurb) {
					var newBlurb = '[' + operator.operator + ':' + (blurb || '');
					for (var index = 0; index < operator.operands.length; index++) {
						if (index > 0) {
							newBlurb += ',';
						}
						var operand = operator.operands[index];
						if (operand.indirect) {
							newBlurb += '{' + utils.abridge(operand.text) + '}';
						} else if (operand.variable) {
							newBlurb += '<' + utils.abridge(operand.text) + '>';
						} else {
							newBlurb += '[' + utils.abridge(operand.text) + ']';
						}
					}
					callback(title, newBlurb + ']');
				}, options);
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
			var settings = options.settings.getConfig('suffixes')[operator.operator];
			var operatorChanged = false;
			if (settings) {
				var handler = settings[1];
				if (handler) {
					var entry = handler.relink(operator.suffix, fromTitle, toTitle, options);
					if (entry) {
						if (entry.output) {
							if (entry.output.search(/[\[\{<\/]/) < 0) {
								output.changed = true;
								operatorChanged = true;
								operator.suffix = entry.output;
							} else {
								entry.impossible = true;
							}
						}
						if (entry.impossible) {
							output.impossible = true;
						}
					}
				}
			}
		}
	}
	return output;
};
