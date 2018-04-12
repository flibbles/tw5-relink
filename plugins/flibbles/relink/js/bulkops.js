/*\
title: $:/plugins/flibbles/relink/js/bulkops.js
type: application/javascript
module-type: startup

Replaces the relinkTiddler defined in $:/core/modules/wiki-bulkops.js

This is a startup instead of a wikimethods module-type because it's the only
way to ensure this runs after the old relinkTiddler method is applied.

\*/
(function(){

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

exports.name = "redefine-relinkTiddler";
exports.synchronous = true;
// load-modules is when wikimethods are applied in
// ``$:/core/modules/startup/load-modules.js``
exports.after = ['load-modules'];

exports.startup = function() {
	$tw.Wiki.prototype.relinkTiddler = relinkTiddler;
};

function relinkTiddler(fromTitle, toTitle, options) {
	var self = this;
	fromTitle = (fromTitle || "").trim();
	toTitle = (toTitle || "").trim();
	options = options || {};
	if(fromTitle && toTitle && fromTitle !== toTitle) {
		this.each(function(tiddler,title) {
			var type = tiddler.fields.type || "";
			// Don't touch plugins or JavaScript modules
			if(!tiddler.fields["plugin-type"] && type !== "application/javascript") {
				var changes = {};
				relinkTags(tiddler, fromTitle, toTitle, changes, options);
				relinkList(tiddler, fromTitle, toTitle, changes, options);
				if(Object.keys(changes).length > 0) {
					var newTiddler = new $tw.Tiddler(tiddler,changes,self.getModificationFields())
					newTiddler = $tw.hooks.invokeHook("th-relinking-tiddler",newTiddler,tiddler);
					self.addTiddler(newTiddler);
				}
			}
		});
	}
};

function relinkTags(tiddler, fromTitle, toTitle, changes, options) {
	if(!options.dontRenameInTags) {
		var tags = (tiddler.fields.tags || []).slice(0),
			isModified = false;
		// Rename tags
		$tw.utils.each(tags,function (title,index) {
			if(title === fromTitle) {
console.log("Renaming tag '" + tags[index] + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
				tags[index] = toTitle;
				isModified = true;
			}
		});
		if (isModified) {
			changes.tags = tags;
		}
	}
};

function relinkList(tiddler, fromTitle, toTitle, options) {
	if(!options.dontRenameInLists) { // Rename lists
		var list = (tiddler.fields.list || []).slice(0),
			isModified = false;
		$tw.utils.each(list,function (title,index) {
			if(title === fromTitle) {
console.log("Renaming list item '" + list[index] + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
				list[index] = toTitle;
				isModified = true;
			}
		});
		if (isModified) {
			changes.list = list;
		}
	}
};

})();
