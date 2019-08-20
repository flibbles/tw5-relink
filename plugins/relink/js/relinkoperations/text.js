/*\

Depending on the tiddler type, this will apply textOperators which may
relink titles within the body.

\*/

/*jslint node: false, browser: true */
/*global $tw: false */
"use strict";

var utils = require("$:/plugins/flibbles/relink/js/utils.js");

var defaultOperator = "text/vnd.tiddlywiki";
var textOperators = Object.create(null);
$tw.modules.applyMethods('relinktextoperator', textOperators);

exports['text'] = function(tiddler, fromTitle, toTitle, changes, options) {
	var text = tiddler.fields.text,
		builder = [],
		buildIndex = 0;
	if (text && text.indexOf(fromTitle) >= 0) {
		var type = tiddler.fields.type || defaultOperator;
		if (textOperators[type]) {
			textOperators[type].call(this, tiddler, fromTitle, toTitle, changes, options);
		}
	}
};
