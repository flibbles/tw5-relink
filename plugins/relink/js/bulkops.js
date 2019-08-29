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
var CannotRelinkError = require('$:/plugins/flibbles/relink/js/CannotRelinkError');

exports.name = "redefine-relinkTiddler";
exports.synchronous = true;
// load-modules is when wikimethods are applied in
// ``$:/core/modules/startup/load-modules.js``
exports.after = ['load-modules'];

exports.startup = function() {
	$tw.Wiki.prototype.relinkTiddler = relinkTiddler;
};

var relinkOperations = Object.create(null);
$tw.modules.applyMethods('relinkoperator', relinkOperations);

function relinkTiddler(fromTitle, toTitle, options) {
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	options.wiki = this;
	var failures = [];
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		this.each((tiddler,title) => {
			var type = tiddler.fields.type || "";
			// Don't touch plugins or JavaScript modules
			if(!tiddler.fields["plugin-type"] && type !== "application/javascript") {
				try {
					var changes = {};
					for (var operation in relinkOperations) {
						relinkOperations[operation](tiddler, fromTitle, toTitle, changes, options);
					}
					// If any fields changed, update tiddler
					if(Object.keys(changes).length > 0) {
						var newTiddler = new $tw.Tiddler(tiddler,changes,this.getModificationFields())
						newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
						this.addTiddler(newTiddler);
					}
				} catch (e) {
					if (e instanceof CannotRelinkError) {
						failures.push(title);
					} else {
						// Should we test for instanceof Error instead?: yes
						// Does that work in the testing environment?: no
						if (e.message) {
							e.message = e.message + "\nWhen relinking '" + title + "'";
						}
						throw e;
					}
				}
			}
		});
	}
	if (failures.length > 0) {
		language.reportFailures(failures);
	}
};

})();
