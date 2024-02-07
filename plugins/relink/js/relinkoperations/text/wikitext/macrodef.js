/*\
module-type: relinkwikitextrule

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

var utils = require("$:/plugins/flibbles/relink/js/utils");
var VariableContext = utils.getContext('variable');
var defOperators = utils.getModulesByTypeAsHashmap('relinkdef', 'name');

// We inherit from DefRule
var DefRule = require('./def.js');
$tw.utils.extend(exports, DefRule);

exports.name = "macrodef";

exports.report = function(text, callback, options) {
	var m = this.match,
		definition = {
			type: "define",
			name: m[1],
			multiline: m[3]
		};
	return this.reportDefinition(text, definition, callback, options);
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		definition = {
			type: "define",
			name: m[1],
			signature: m[0],
			multiline: m[3]
		};
	return this.relinkDefinition(text, definition, fromTitle, toTitle, options);
};
