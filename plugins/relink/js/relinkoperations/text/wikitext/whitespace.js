/*\
module-type: relinkwikitextrule

Handles whitespace pragma

\*/

exports.name = "whitespace";

// We don't actually do anything, but we can't rely on
// the default behavior of moving to parser.pos.
// we have to forward past all the whitespace tokens.
exports.relink = exports.report = function() { this.parse(); }
