/*\

Macro-parameter attribute types are a legacy attribute type that are present
only in legacy versions of TW, when macros are used as attributes.

They behave exactly like strings.

\*/

module.exports = Object.create(require("./string.js"));

module.exports.name = 'macro-parameter';
