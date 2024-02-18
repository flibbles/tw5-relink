/*\

Handles relinking substitution text, like strings containing $(this)$.

\*/

var utils = require('$:/plugins/flibbles/relink/js/utils.js');
var filterHandler = utils.getType('filter');
var macrocallHandler = require("./macrocall.js");

exports.report = function(string, callback, options) {
	if (!options.noFilterSubstitution) {
		var filterRegex = /\$\{([\S\s]+?)\}\$/g, filter;
		while (filter = filterRegex.exec(string)) {
			filterHandler.report(filter[1], function(title, blurb, style) {
				callback(title, '${' + blurb + '}$', style);
			}, options);
		}
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
	var newValue = string;
	if (!options.noFilterSubstitution) {
		newValue = newValue.replace(/\$\{([\S\s]+?)\}\$/g, function(match, filter) {
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
	}
	newValue = newValue.replace(/\$\(([^\)\$]+)\)\$/g, function(match, varname) {
		var macroEntry = macrocallHandler.relink(options.settings, {name: varname, params: []}, string, fromTitle, toTitle, false, options);
		if (macroEntry) {
			entry = entry || {};
			if (macroEntry.output) {
				var newTitle = macroEntry.output.attributes.$variable.value;
				if (newTitle.indexOf('$') >= 0 || newTitle.indexOf(')') >= 0) {
					entry.impossible = true;
				} else {
					changed = true;
					match = '$(' + newTitle + ')$';
				}
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
