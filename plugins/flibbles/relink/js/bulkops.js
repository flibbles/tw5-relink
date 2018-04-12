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
		var fields = getTrackedFields();
		this.each(function(tiddler,title) {
			var type = tiddler.fields.type || "";
			// Don't touch plugins or JavaScript modules
			if(!tiddler.fields["plugin-type"] && type !== "application/javascript") {
				var changes = {};
				relinkTags(tiddler, fromTitle, toTitle, changes, options);
				relinkBuiltinList(tiddler, fromTitle, toTitle, changes, options);
				for (var field in fields) {
					relinkField(tiddler, field, fromTitle, toTitle, changes);
				}
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
		relinkList(tiddler, "tags", fromTitle, toTitle, changes);
	}
};

function relinkBuiltinList(tiddler, fromTitle, toTitle, changes, options) {
	if(!options.dontRenameInLists) { // Rename lists
		relinkList(tiddler, "list", fromTitle, toTitle, changes);
	}
};

function relinkField(tiddler, field, fromTitle, toTitle, changes) {
	var fieldValue = (tiddler.fields[field] || "");
	if (fieldValue === fromTitle) {
console.log("Renaming " + field + " field '" + fieldValue + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
		changes[field] = toTitle;
	}
};

function relinkList(tiddler, field, fromTitle, toTitle, changes) {
	var list = (tiddler.fields[field] || []).slice(0),
		isModified = false,
		descriptor = (field === "tags")? "tag": (field + " item");
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
console.log("Renaming " + descriptor + " '" + list[index] + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		changes[field] = list;
	}
};

var prefix = "$:/config/flibbles/relink/fields/";

function getTrackedFields() {
	var fields = Object.create(null);
	$tw.wiki.eachShadowPlusTiddlers(function(tiddler, title) {
		if (title.startsWith(prefix)) {
			fields[title.substr(prefix.length)] = tiddler.fields.text;
		}
	});
	return fields;
};

})();
