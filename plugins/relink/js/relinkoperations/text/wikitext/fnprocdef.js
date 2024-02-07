/*\
module-type: relinkwikitextrule

Handles pragma function/procedure/widget definitions.

\*/

// We inherit from DefRule
var DefRule = require('./def.js');
$tw.utils.extend(exports, DefRule);

exports.name = "fnprocdef";

exports.createDefinition = function() {
	var m = this.match;
	return {
		type: m[1],
		name: m[2],
		parameters: m[4],
		multiline: m[5]};
};
