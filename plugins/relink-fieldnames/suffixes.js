/*\
title: $:/plugins/flibbles/relink-fieldnames/suffixes.js
module-type: relinkfilter
type: application/javascript

Handles reporting of filter operators.

\*/

exports.name = "suffixes";

exports.report = function(filterParseTree, callback, options) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			var settings = options.settings.getConfig('suffixes')[operator.operator];
			if (settings) {
				for (var index = 0; index < operator.suffixes.length; index++) {
					if (settings[index+1]) {
						var value = operator.suffixes[index];
						settings[index+1].report(value, function(title, blurb) {
							var newBlurb = '[' + operator.operator;
							for (var x = 0; x < operator.suffixes.length; x++) {
								newBlurb += ':';
								if (x !== index) {
									newBlurb += operator.suffixes[x].value;
								}
							}
							callback(title, newBlurb + ']');
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
			var settings = options.settings.getConfig('suffixes')[operator.operator];
			var operatorChanged = false;
			if (settings) {
				for (var index = 0; index < operator.suffixes.length; index++) {
					var handler = settings[index+1];
					if (handler) {
						var value = operator.suffixes[index][0];
						var entry = handler.relink(value, fromTitle, toTitle, options);
						if (entry) {
							if (entry.output) {
								output.changed = true;
								operatorChanged = true;
								operator.suffixes[index][0] = entry.output;
							}
							if (entry.impossible) {
								output.impossible = true;
							}
						}
					}
				}
			}
			if (operatorChanged) {
				operator.suffix = operator.suffixes.map(function(afix) {
					return afix.join(',');
				}).join(':');
			}
		}
	}
	return output;
};
