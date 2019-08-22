/*\
module-type: library

Contains methods for relinking fields which are used by the different module
parts.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var fieldTypes = Object.create(null);
$tw.modules.applyMethods('relinkfield', fieldTypes);

exports.FieldHandler = function(tiddler, field) {
	this.tiddler = tiddler;
	this.field = field;
};

exports.FieldHandler.prototype.value = function() {
	return this.tiddler.fields[this.field];
};

exports.FieldHandler.prototype.descriptor = function(adjective) {
	if (this.field === "tags") {
		return "tag";
	} else if (adjective) {
		return this.field + " " + adjective;
	} else {
		return this.field;
	}
};

exports.FieldHandler.prototype.log = function(adjective, from, to) {
	console.log(`Renaming ${this.descriptor(adjective)} '${from}' to '${to}' of tiddler '${this.tiddler.fields.title}'`);
};

exports.selectRelinker = function(type, value) {
	if (value !== undefined && typeof value !== 'string') {
		return exports.relinkList;
	}
	return fieldTypes[type];
};

// This expects the handler to return a list, not a string.
// It's a special handler, used exclusively for `tag` and `list`
exports.relinkList = function(handler, fromTitle, toTitle) {
	var list = (handler.value() || []).slice(0),
		isModified = false;
	$tw.utils.each(list,function (title,index) {
		if(title === fromTitle) {
			handler.log('item', list[index], toTitle);
			list[index] = toTitle;
			isModified = true;
		}
	});
	if (isModified) {
		return list;
	}
	return undefined;
};
