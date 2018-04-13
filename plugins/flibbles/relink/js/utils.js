/*\
title: $:/plugins/flibbles/relink/js/utils.js
type: application/javascript
module-type: library

Contains methods for relinking fields which are used by the different module
parts.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

exports.relinkStringList = function(tiddler, field, fromTitle, toTitle, changes) {
	var list = $tw.utils.parseStringArray(tiddler.fields[field] || ""),
		isModified = false;
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
console.log("Renaming " + field + " item '" + list[index] + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		changes[field] = $tw.utils.stringifyList(list);
	}
};

exports.relinkList = function(tiddler, field, fromTitle, toTitle, changes) {
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

exports.relinkField = function(tiddler, field, fromTitle, toTitle, changes) {
	var fieldValue = (tiddler.fields[field] || "");
	if (fieldValue === fromTitle) {
console.log("Renaming " + field + " field '" + fieldValue + "' to '" + toTitle + "' of tiddler '" + tiddler.fields.title + "'");
		changes[field] = toTitle;
	}
};
