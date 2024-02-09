/*\
title: $:/plugins/flibbles/relink-fieldnames/filters/suffixes.js
module-type: relinkfilter
type: application/javascript

Handles reporting/relinking of filter operator suffixes using a hidden whitelist.

\*/

var utils = require("../utils.js");

exports.name = "suffixes";

exports.report = function(filterParseTree, callback, options) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			var settings = options.settings.getConfig('suffixes')[operator.operator];
			if (settings) {
				settings[1].report(operator.suffix, function(title, blurb, style) {
					callback(title, '[' + operator.operator + ':' + (blurb || '') + utils.blurbOperands(operator) + ']', style);
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
