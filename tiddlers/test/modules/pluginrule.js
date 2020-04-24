/*\
module-type: relinkwikitextrule

This ensures that wikitextrules can exist which correspond to wikirules
that don't actually exist (or rather exist in an uninstalled plugin), and
that this doesn't crash Relink.
\*/

exports.name = "pluginrule";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	// Does nothing. This only has to exist to test that 3rd party
	// wikirules can optionally exist.
};
