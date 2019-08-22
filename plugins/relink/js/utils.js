/*\
module-type: library

Contains methods for relinking fields which are used by the different module
parts.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var fieldTypes = Object.create(null);
$tw.modules.applyMethods('relinkfieldtype', fieldTypes);

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

exports.selectRelinker = function(type) {
	return fieldTypes[type];
};
