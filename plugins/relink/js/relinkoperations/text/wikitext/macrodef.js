/*\
module-type: relinkwikitextrule

Handles pragma macro definitions.
We may also update placeholder macros that we may have previously installed.

\define relink-?() Tough title

\*/

// We inherit from DefRule
var DefRule = require('./def.js');
$tw.utils.extend(exports, DefRule);

exports.name = "macrodef";

exports.createDefinition = function() {
	var m = this.match;
	return {
		type: "define",
		name: m[1],
		parameters: m[2],
		multiline: m[3]};
};
