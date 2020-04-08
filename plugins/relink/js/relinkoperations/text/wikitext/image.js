/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[img[tiddler.jpg]]

[img width=23 height=24 [Description|tiddler.jpg]]

\*/

var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');
var macrocall = require("./macrocall.js");
var utils = require("./utils.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = "image";

var ImageEntry = EntryNode.newType("image");

ImageEntry.prototype.report = function() {
	return this.children.map(function(child) {
		return "[img" + child.report() + "]";
	});
};

var ImageAttrEntry = EntryNode.newType("imageattr");

ImageAttrEntry.prototype.report = function() {
	if (this.attribute === "source") {
		return "[]";
	}
	return " " + this.attribute;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var ptr = this.nextImage.start;
	var builder = new Rebuilder(text, ptr);
	var makeWidget = false;
	var imageEntry = new ImageEntry();
	if (this.nextImage.attributes.source.value === fromTitle && !canBePretty(toTitle, this.nextImage.attributes.tooltip)) {
		makeWidget = true;
		builder.add("<$image", ptr, ptr+4);
	}
	ptr += 4; //[img
	var inSource = false;
	for (var attributeName in this.nextImage.attributes) {
		var attrEntry = new ImageAttrEntry();
		var attr = this.nextImage.attributes[attributeName];
		if (attributeName === "source" || attributeName === "tooltip") {
			if (inSource) {
				ptr = text.indexOf('|', ptr);
			} else {
				ptr = text.indexOf('[', ptr);
				inSource = true;
			}
			if (makeWidget) {
				if (" \t\n".indexOf(text[ptr-1]) >= 0) {
					builder.add('', ptr, ptr+1);
				} else {
					builder.add(' ', ptr, ptr+1);
				}
			}
			ptr += 1;
		}
		if (attributeName === "source") {
			ptr = text.indexOf(attr.value, ptr);
			if (attr.value === fromTitle) {
				var entry = {name: "title"};
				if (makeWidget) {
					var quotedValue = utils.wrapAttributeValue(toTitle);
					if (quotedValue === undefined) {
						var key = this.parser.getPlaceholderFor(toTitle);
						builder.add("source=<<"+key+">>", ptr, ptr+fromTitle.length);
						entry.placeholder = true;
						entry.widget = true;

					} else {
						builder.add("source="+quotedValue, ptr, ptr+fromTitle.length);
						entry.widget = true;
					}
				} else {
					builder.add(toTitle, ptr, ptr+fromTitle.length);
				}
				attrEntry.add(entry);
			}
			ptr = text.indexOf(']]', ptr);
			if (makeWidget) {
				builder.add("/>", ptr, ptr+2);
			}
			ptr += 2;
		} else if (attributeName === "tooltip") {
			if (makeWidget) {
				ptr = text.indexOf(attr.value, ptr);
				var quotedValue = utils.wrapAttributeValue(attr.value);
				builder.add("tooltip="+quotedValue, ptr, ptr+attr.value.length);
			}
		} else {
			ptr = relinkAttribute(attr, this.parser, builder, fromTitle, toTitle, attrEntry, options);
		}
		if (attrEntry.children.length > 0) {
			attrEntry.attribute = attributeName;
			imageEntry.add(attrEntry);
		}
	}
	this.parser.pos = ptr;
	if (imageEntry.children.length > 0) {
		imageEntry.output = builder.results(ptr);
		return imageEntry;
	}
	return undefined;
};

function relinkAttribute(attribute, parser, builder, fromTitle, toTitle, entry, options) {
	var text = builder.text;
	var ptr = text.indexOf(attribute.name, attribute.start);
	ptr += attribute.name.length;
	ptr = text.indexOf('=', ptr);
	if (attribute.type === "string") {
		ptr = text.indexOf(attribute.value, ptr)
		var quote = utils.determineQuote(text, attribute);
		// ignore first quote. We already passed it
		ptr += quote.length + attribute.value.length;
	} else if (attribute.type === "indirect") {
		ptr = text.indexOf('{{', ptr);
		var end = ptr + attribute.textReference.length + 4;
		var ref = refHandler.relinkInBraces(attribute.textReference, fromTitle, toTitle, options);
		if (ref) {
			entry.add(ref);
			if (ref.output) {
				builder.add("{{"+ref.output+"}}", ptr, end);
			}
		}
		ptr = end;
	} else if (attribute.type === "filtered") {
		ptr = text.indexOf('{{{', ptr);
		var end = ptr + attribute.filter.length + 6;
		var filter = filterHandler.relinkInBraces(attribute.filter, fromTitle, toTitle, options);
		if (filter !== undefined) {
			entry.add(filter);
			if (filter.output) {
				attribute.filter = filter.output;
				var quoted = "{{{"+filter.output+"}}}";
				builder.add(quoted, ptr, end);
			}
		}
		ptr = end;
	} else if (attribute.type === "macro") {
		ptr = text.indexOf("<<", ptr);
		var end = attribute.value.end;
		var macro = attribute.value;
		oldValue = attribute.value;
		var macroEntry = macrocall.relinkAttribute(macro, text, parser, fromTitle, toTitle, options);
		if (macroEntry !== undefined) {
			entry.add(macroEntry);
			if (macroEntry.output) {
				builder.add(macroEntry.output, ptr, end);
			}
		}
		ptr = end;
	}
	return ptr;
};

function canBePretty(title, tooltip) {
	return title.indexOf(']') < 0 && (tooltip || title.indexOf('|') < 0);
};
