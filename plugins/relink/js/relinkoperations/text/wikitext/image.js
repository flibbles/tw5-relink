/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[img[tiddler.jpg]]

[img width=23 height=24 [Description|tiddler.jpg]]

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var Rebuilder = require("$:/plugins/flibbles/relink/js/utils/rebuilder");
var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var filterHandler = require("$:/plugins/flibbles/relink/js/settings").getRelinker('filter');
var macrocall = require("./macrocall.js");
var CannotRelinkError = require("$:/plugins/flibbles/relink/js/errors.js").CannotRelinkError;
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
			if (attr.type === "string") {
				ptr = text.indexOf(attr.value, ptr)
				var quote = utils.determineQuote(text, attr);
				// ignore first quote. We already passed it
				ptr += quote.length + attr.value.length;
			} else if (attr.type === "indirect") {
				ptr = text.indexOf('{{', ptr);
				var quote = "{{";
				var ref = $tw.utils.parseTextReference(attr.textReference);
				var end = ptr + attr.textReference.length + 4;
				if (ref.title === fromTitle) {
					if (toTitle.indexOf("}") >= 0) {
						throw new CannotRelinkError();
					}
					ref.title = toTitle;
					var value = refHandler.toString(ref);
					builder.add("{{"+value+"}}", ptr, end);
				}
				ptr = end;
			} else if (attr.type === "filtered") {
				ptr = text.indexOf('{{{', ptr);
				var end = ptr + attr.filter.length + 6;
				var extendedOptions = $tw.utils.extend({placeholder: this.parser}, options);
				var filter = filterHandler.relink(attr.filter, fromTitle, toTitle, extendedOptions);
				if (filter !== undefined) {
					if (!canBeFilterValue(filter)) {
						throw new CannotRelinkError();
					}
					attr.filter = filter;
					var quoted = "{{{"+filter+"}}}";
					builder.add(quoted, ptr, end);
				}
				ptr = end;
			} else if (attr.type === "macro") {
				ptr = text.indexOf("<<", ptr);
				var end = attr.value.end;
				var macro = attr.value;
				oldValue = attr.value;
				var newMacro = macrocall.relinkMacroInvocation(macro, text, this.parser, fromTitle, toTitle, options);
				if (newMacro !== undefined) {
					if (macrocall.mustBeAWidget(newMacro)) {
						throw new CannotRelinkError();
					}
					var macroString = macrocall.macroToString(newMacro, text, this.parser, options);
					builder.add(macroString, ptr, end);
				}
				ptr = end;
			}
		}
		

	}
	this.parser.pos = ptr;
	return builder.results(ptr);
};

function canBeFilterValue(value) {
	return value.indexOf("}}}") < 0 && value.substr(value.length-2) !== '}}';
};
