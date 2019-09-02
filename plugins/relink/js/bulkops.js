/*\
module-type: startup

Replaces the relinkTiddler defined in $:/core/modules/wiki-bulkops.js

This is a startup instead of a wikimethods module-type because it's the only
way to ensure this runs after the old relinkTiddler method is applied.

\*/
(function(){

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var language = require('$:/plugins/flibbles/relink/js/language.js');

exports.name = "redefine-relinkTiddler";
exports.synchronous = true;
// load-modules is when wikimethods are applied in
// ``$:/core/modules/startup/load-modules.js``
exports.after = ['load-modules'];

exports.startup = function() {
	$tw.Wiki.prototype.relinkTiddler = relinkTiddler;
};

/** Walks through all relinkable tiddlers and relinks them.
 *  This replaces the existing function in core Tiddlywiki.
 */
function relinkTiddler(fromTitle, toTitle, options) {
	var self = this;
	var failures = this.eachRelinkableTiddler(
			fromTitle,
			toTitle,
			options,
			function(changes, tiddler) {
		var newTiddler = new $tw.Tiddler(tiddler,changes,self.getModificationFields())
		newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
		self.addTiddler(newTiddler);
	});
	if (failures.length > 0) {
		language.reportFailures(failures);
	}
};

})();
