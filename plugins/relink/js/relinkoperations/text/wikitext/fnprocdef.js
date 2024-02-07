/*\
module-type: relinkwikitextrule

Handles pragma function/procedure/widget definitions.

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');
var defOperators = utils.getModulesByTypeAsHashmap('relinkdef', 'name');

// We inherit from DefRule
var DefRule = require('./def.js');
$tw.utils.extend(exports, DefRule);

exports.name = "fnprocdef";

exports.report = function(text, callback, options) {
	var m = this.match,
		definition = {
			type: m[1],
			name: m[2],
			multiline: m[5]
		};
	return this.reportDefinition(text, definition, callback, options);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		definition = {
			type: m[1],
			name: m[2],
			signature: m[0],
			multiline: m[5]
		};
	return this.relinkDefinition(text, definition, fromTitle, toTitle, options);
};
