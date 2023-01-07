/*\
title: $:/plugins/flibbles/relink-fieldnames/utils.js
module-type: library
type: application/javascript

\*/

var blacklistTiddler = "$:/config/flibbles/relink/fieldnames/blacklist";
var docPrefix = "$:/language/Docs/Fields/";

var whitelist = require('$:/plugins/flibbles/relink/js/utils.js').getContext('whitelist');

whitelist.hotDirectories.push(docPrefix);

exports.isReserved = function(field, options) {
	var method = options.settings.getConfig("fieldnames").blacklist || function() { return true; };
	return method(field);
};

exports.abridge = function(string, length) {
	if (typeof string === "string") {
		length = length || 30;
		string = string.replace(/\s+/g, " ");
		return (string.length > length)? string.substr(0, length) + "..." : string;
	}
	return string;
}

// Pre v5.2.0, this will be false. But we can't rely on utils.isValidFieldName
// entirely, because it is forgiving about capitalization when we can't be.
var capitalizationAllowed = $tw.utils.isValidFieldName("A:");

exports.isValidFieldName = function(field) {
	return $tw.utils.isValidFieldName(field)
		&& (capitalizationAllowed || !/[A-Z]/.test(field));
};

exports.blurbOperands = function(operator) {
	var string = ''
	for (var index = 0; index < operator.operands.length; index++) {
		if (index > 0) {
			string += ',';
		}
		var operand = operator.operands[index];
		if (operand.indirect) {
			string += '{' + exports.abridge(operand.text) + '}';
		} else if (operand.variable) {
			string += '<' + exports.abridge(operand.text) + '>';
		} else {
			string += '[' + exports.abridge(operand.text) + ']';
		}
	}
	return string;
};
