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
	var output = [];
	$tw.utils.each(this.children, function(child) {
		$tw.utils.each(child.report(), function(report) {
			output.push("[img" + report + "]");
		});
	});
	return output;
};

var ImageAttrEntry = EntryNode.newType("imageattr");

ImageAttrEntry.prototype.report = function() {
	if (this.attribute === "source") {
		if (this.tooltip) {
			var tooltip = this.tooltip.value;
			return ["["+tooltip+"]"];
		} else {
			return ["[]"];
		}
	}
	var reports = [''];
	var type = this.type;
	var attribute = this.attribute;
	if (this.children[0].report) {
		reports = this.children[0].report();
	}
	return reports.map(function(report) {
		var value;
		if (type === "indirect") {
			value = "{{" + report + "}}";
		} else if (type === "filtered") {
			value = "{{{" + report + "}}}";
		} else if (type === "macro") {
			// angle brackets already added...
			value = report;
		}
		return " " + attribute + "=" + value;
	});
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var ptr = this.nextImage.start;
	var builder = new Rebuilder(text, ptr);
	var makeWidget = false;
	var skipSource = false;
	var imageEntry = new ImageEntry();
	if (this.nextImage.attributes.source.value === fromTitle && !canBePretty(toTitle, this.nextImage.attributes.tooltip)) {
		if (utils.wrapAttributeValue(toTitle) || options.placeholder) {
			makeWidget = true;
			builder.add("<$image", ptr, ptr+4);
		} else {
			// We won't be able to make a placeholder to replace
			// the source attribute. We check now so we don't
			// prematurely convert into a widget.
			// Keep going in case other attributes need replacing.
			skipSource = true;
		}
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
						var key = options.placeholder.getPlaceholderFor(toTitle);
						builder.add("source=<<"+key+">>", ptr, ptr+fromTitle.length);
					} else {
						builder.add("source="+quotedValue, ptr, ptr+fromTitle.length);
					}
				} else if (!skipSource) {
					builder.add(toTitle, ptr, ptr+fromTitle.length);
				} else {
					entry.impossible = true;
				}
				attrEntry.add(entry);
				attrEntry.tooltip = this.nextImage.attributes.tooltip;
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
	entry.type = attribute.type;
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
