/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[img[tiddler.jpg]]

[img width=23 height=24 [Description|tiddler.jpg]]

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var utils = require("./utils.js");

exports.name = "image";

exports.relink = function(tiddler, text, fromTitle, toTitle, options) {
	var ptr = this.nextImage.start;
	var builder = new Rebuilder(text, ptr);
	ptr += 4; //[img
	var logArguments = {
		from: fromTitle,
		to: toTitle,
		tiddler: tiddler.fields.title
	};
	for (var attributeName in this.nextImage.attributes) {
		var attr = this.nextImage.attributes[attributeName];
		if (attributeName === "source") {
			ptr = text.indexOf(attr.value, ptr);
			if (attr.value === fromTitle) {
				builder.add(toTitle, ptr, ptr+fromTitle.length);
				log("image", logArguments, options);
			}
			ptr += attr.value.length+2;
		} else if (attributeName === "tooltip") {
			ptr = text.indexOf('[', ptr);
			// and in case of surrounding whitespace:
			ptr = text.indexOf(attr.value, ptr); 
			ptr += attr.value.length + 1;
		} else {
			ptr = text.indexOf(attributeName, ptr);
			ptr += attributeName.length;
			ptr = text.indexOf('=', ptr);
			ptr = text.indexOf(attr.value, ptr) + attr.value.length;
		}
		

	}
	this.parser.pos = ptr;
	return builder.results(ptr);
};
