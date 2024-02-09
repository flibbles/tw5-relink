/*\
title: $:/plugins/flibbles/relink-fieldnames/filters/search.js
module-type: relinkfilter
type: application/javascript

Handles reporting/relinking of the search operator, which is very complicated

\*/

var utils = require("../utils.js");

exports.name = "search";

exports.report = function(filterParseTree, callback, options) {
	var inverted = false;
	eachSuffix(filterParseTree, function(title, rawEntry, operator, index) {
		if (index === 0 && rawEntry[0] === '-') {
			inverted = true;
		}
		if (!utils.isReserved(title, options)) {
			var blurb = inverted? "[search:-": "[search:";
			if (operator.suffixes[1]) {
				blurb += ':' + operator.suffixes[1].join(',');
			}
			callback(title, blurb + utils.blurbOperands(operator) + "]", {soft: true});
		}
	});
};

exports.relink = function(filterParseTree, fromTitle, toTitle, options) {
	var output = {};
	if (!utils.isReserved(fromTitle, options)) {
		eachSuffix(filterParseTree, function(title, rawEntry, operator, index) {
			if (title === fromTitle) {
				if (utils.isReserved(toTitle, options)
				|| toTitle.search(/[\[\{<\/,:]/) >= 0
				|| (index == 0
					&& rawEntry[0] !== '-'
					&& (toTitle[0] === '-' || toTitle === '*'))) {
					output.impossible = true;
				} else {
					output.changed = true;
					return toTitle;
				}
			}
		});
	}
	return output;
};

function eachSuffix(filterParseTree, callback) {
	for (var i = 0; i < filterParseTree.length; i++) {
		var run = filterParseTree[i];
		for (var j = 0; j < run.operators.length; j++) {
			var operator = run.operators[j];
			var opChanged = false;
			if (operator.operator === 'search' && operator.suffix) {
				var list = operator.suffixes[0];
				for (var index = 0; index < list.length; index++) {
					var title = list[index];
					var raw = title;
					if (index === 0) {
						if (title[0] === '-') {
							title = title.substr(1);
						} else if (title === '*') {
							continue;
						}
					}
					var newValue = callback(title, raw, operator, index);
					if (newValue) {
						list[index] = (index === 0 && raw[0] === '-') ?
							'-' + newValue:
							newValue;
						opChanged = true;
					}
				}
			}
			if (opChanged) {
				// There was a change. reassemble the suffix
				operator.suffix = operator.suffixes.map(function(part) {
					return part.join(',');
				}).join(':');
			}
		}
	}
};
