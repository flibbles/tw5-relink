/*\
module-type: startup

For legacy, if we're pre-v5.4.0, we need to monkey-patch in Relink instead
of relying on module overriding to introduce the behavior.

This is a startup instead of a wikimethods module-type because it's the only
way to ensure this runs after the old relinkTiddler method is applied.

\*/

"use strict";

var targetModule = "$:/core/modules/relinkers/tiddlers.js";

exports.name = "redefine-relinkTiddler";
exports.synchronous = true;
// load-modules is when wikimethods are applied in
// ``$:/core/modules/startup/load-modules.js``
exports.after = ['load-modules'];
// We come before commands because they may do renaming, or jasmine testing
exports.before = ['commands'];

exports.startup = function() {
	if (!$tw.wiki.getShadowSource(targetModule)) {
		relinkers = $tw.modules.getModulesByTypeAsHashmap("relinker");
		$tw.Wiki.prototype.relinkTiddler = relinkTiddlers;
	}
};

var relinkers;

function relinkTiddlers(fromTitle, toTitle, options) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	if (fromTitle && toTitle && fromTitle !== toTitle) {
		for (var name in relinkers) {
			relinkers[name].relink(this, fromTitle, toTitle, options);
		}
	}
};
