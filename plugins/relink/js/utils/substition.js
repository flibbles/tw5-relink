/*\

Handles relinking substitution text, like strings containing $(this)$.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var filterHandler = utils.getType('filter');
var macrocallHandler = require("./macrocall.js");

exports.report = function(string, callback, options) {
	var filterRegex = /\$\{([\S\s]+?)\}\$/g, filter;
	while (filter = filterRegex.exec(string)) {
		filterHandler.report(filter[1], function(title, blurb, style) {
			callback(title, '${' + blurb + '}$', style);
		}, options);
	}
	var varRegex = /\$\(([^\)\$]+)\)\$/g, varMatch;
	while (varMatch = varRegex.exec(string)) {
		macrocallHandler.report(options.settings, {name: varMatch[1], params: []}, function(title, blurb, style) {
			callback(title, '$(' + blurb + ')$', style);
		}, options);
	}
};

exports.relink = function(string, fromTitle, toTitle, options) {
	var entry;
	var changed = false;
	var newValue = string.replace(/\$\{([\S\s]+?)\}\$/g, function(match, filter) {
		var filterEntry = filterHandler.relink(filter, fromTitle, toTitle, options);
		if (filterEntry) {
			entry = entry || {};
			if (filterEntry.output) {
				// The only }$ should be the one at the very end
				if (filterEntry.output.indexOf("}$") < 0) {
					changed = true;
					match = '${' + filterEntry.output + '}$';
				} else {
					entry.impossible = true;
				}
			}
			if (filterEntry.impossible) {
				entry.impossible = true;
			}
		}
		return match;
	});
	newValue = newValue.replace(/\$\(([^\)\$]+)\)\$/g, function(match, varname) {
		var macroEntry = macrocall.relink(options.settings, {name: varname, params: []}, parser.source, fromTitle, toTitle, false, options);
		if (macroEntry) {
			if (macroEntry.output) {
				changed = true;
				match = '$(' + macroEntry.output.attributes.$variable.value + ')$';
			}
			if (macroEntry.impossible) {
				entry.impossible = true;
			}
		}
		return match;
	});
	if (changed) {
		entry.output = newValue;
	}
	return entry;
};
