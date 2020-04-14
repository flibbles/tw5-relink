/*\
module-type: relinkwikitextrule

Handles replacement of transclusions in wiki text like,

{{RenamedTiddler}}
{{RenamedTiddler||TemplateTitle}}

This renames both the tiddler and the template field.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var utils = require("./utils.js");
var EntryNode = require('$:/plugins/flibbles/relink/js/utils/entry');

exports.name = ['transcludeinline', 'transcludeblock'];

var TranscludeEntry = EntryNode.newType("transclude");

TranscludeEntry.prototype.report = function() {
	var ref = this.reference || {};
	var self = this;
	return this.children.map(function(child) {
		if (child.name === "reference") {
			var suffix = "";
			if (ref.field) {
				suffix = "!!" + ref.field;
			}
			if (ref.index) {
				suffix = "##" + ref.index;
			}
			if (self.template) {
				suffix = suffix + "||" + self.template;
			}
			return "{{" + suffix + "}}";
		} else {
			// Must be template
			var refString = refHandler.toString(ref);
			return "{{" + refString + "||}}";
		}
	});
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		reference = m[1],
		template = m[2],
		ref = $tw.utils.parseTextReference(reference),
		entry = new TranscludeEntry();
	entry.reference = ref;
	entry.template = template;
	this.parser.pos = this.matchRegExp.lastIndex;
	var modified = false;
	if ($tw.utils.trim(ref.title) === fromTitle) {
		// preserve user's whitespace
		ref.title = ref.title.replace(fromTitle, toTitle);
		modified = true;
		entry.add({name: "reference"});
	}
	if ($tw.utils.trim(template) === fromTitle) {
		template = template.replace(fromTitle, toTitle);
		modified = true;
		entry.add({name: "template"});
	}
	if (modified) {
		var output = this.makeTransclude(ref, template, options);
		if (output) {
			// Adding any newline that might have existed is
			// what allows this relink method to work for both
			// the block and inline filter wikitext rule.
			output = output + utils.getEndingNewline(m[0]);
			entry.output = output;
		} else {
			entry.impossible = true;
		}
		return entry;
	}
	return undefined;
};

exports.makeTransclude = function(reference, template, options) {
	var rtn;
	if (!canBePrettyTemplate(template)) {
		var resultTemplate = wrap(template, options);
		if (resultTemplate === undefined) {
			return undefined;
		}
		if (reference.title) {
			var resultTitle = wrap(reference.title, options);
			if (resultTitle === undefined) {
				return undefined;
			}
			var attrs = this.transcludeAttributes(reference.field, reference.index, options);
			if (attrs === undefined) {
				return undefined;
			}
			rtn = "<$tiddler tiddler="+resultTitle+"><$transclude tiddler="+resultTemplate+attrs+"/></$tiddler>";
		} else {
			rtn = "<$transclude tiddler="+resultTemplate+"/>";
		}
	} else if (!canBePrettyTitle(reference.title)) {
		// This block and the next account for the 1%...
		var resultTitle = wrap(reference.title, options);
		if (resultTitle === undefined) {
			return undefined;
		}
		reference.title = undefined;
		rtn = "<$tiddler tiddler="+resultTitle+">"+prettyTransclude(reference, template)+"</$tiddler>";
	} else {
		// This block takes care of 99% of all cases
		rtn = prettyTransclude(reference, template);
	}
	return rtn;
};

function wrap(tiddler, options) {
	tiddler = $tw.utils.trim(tiddler);
	var result = utils.wrapAttributeValue(tiddler);
	if (result === undefined) {
		if (options.placeholder) {
			result = "<<" + options.placeholder.getPlaceholderFor(tiddler) + ">>";
		}
	}
	return result;
};

function canBePrettyTitle(value) {
	return refHandler.canBePretty(value) && canBePrettyTemplate(value);
};

function canBePrettyTemplate(value) {
	return !value || (value.indexOf('}') < 0 && value.indexOf('{') < 0 && value.indexOf('|') < 0);
};

/**Returns attributes for a transclude widget.
 * only field or index should be used, not both, but both will return
 * the intuitive (albeit useless) result.
 */
exports.transcludeAttributes = function(field, index, options) {
	var rtn = [
		wrapAttribute("field", field, options),
		wrapAttribute("index", index, options)
	];
	if (rtn[0] === undefined || rtn[1] === undefined) {
		// This can only happen if the transclude is using an
		// illegal key.
		return undefined;
	}
	return rtn.join('');
};

function wrapAttribute(name, value, options) {
	if (value) {
		var wrappedValue = utils.wrapAttributeValue(value);
		if (wrappedValue === undefined) {
			if (!options.placeholder) {
				return undefined;
			}
			wrappedValue = "<<"+options.placeholder.getPlaceholderFor(value, name)+">>";
		}
		return " "+name+"="+wrappedValue;
	}
	return '';
};

function prettyTransclude(textReference, template) {
	if (typeof textReference !== "string") {
		textReference = refHandler.toString(textReference);
	}
	if (!textReference) {
		textReference = '';
	}
	if (template !== undefined) {
		return "{{"+textReference+"||"+template+"}}";
	} else {
		return "{{"+textReference+"}}";
	}
};
