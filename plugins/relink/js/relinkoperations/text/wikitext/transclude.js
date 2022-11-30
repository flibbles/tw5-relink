/*\
module-type: relinkwikitextrule

Handles replacement of transclusions in wiki text like,

{{RenamedTiddler}}
{{RenamedTiddler||TemplateTitle}}

This renames both the tiddler and the template field.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var utils = require("./utils.js");
var relinkUtils = require('$:/plugins/flibbles/relink/js/utils.js');
var referenceOperators = relinkUtils.getModulesByTypeAsHashmap('relinkreference', 'name');

exports.name = ['transcludeinline', 'transcludeblock'];

exports.report = function(text, callback, options) {
	var m = this.match,
		refString = $tw.utils.trim(m[1]),
		ref = parseTextReference(refString);
		template = $tw.utils.trim(m[2]);
	for (var operator in referenceOperators) {
		referenceOperators[operator].report(ref, function(title, blurb) {
			blurb = blurb || "";
			if (template) {
				blurb += '||' + template;
			}
			callback(title, "{{" + blurb + "}}");
		}, options);
	}
	if (template) {
		callback(template, '{{' + refString + '||}}');
	}
	this.parser.pos = this.matchRegExp.lastIndex;
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		reference = parseTextReference(m[1]),
		template = m[2],
		entry = undefined,
		impossible = false,
		modified = false;
	this.parser.pos = this.matchRegExp.lastIndex;
	for (var operator in referenceOperators) {
		var result = referenceOperators[operator].relink(reference, fromTitle, toTitle, options);
		if (result !== undefined) {
			if (result.impossible) {
				impossible = true;
			}
			if (result.output) {
				reference = result.output;
				modified = true
			}
		}
	}
	if ($tw.utils.trim(template) === fromTitle) {
		template = template.replace(fromTitle, toTitle);
		modified = true;
	}
	if (modified) {
		var output = this.makeTransclude(this.parser, reference, template);
		if (output) {
			// Adding any newline that might have existed is
			// what allows this relink method to work for both
			// the block and inline filter wikitext rule.
			entry = {output: output + utils.getEndingNewline(m[0])};
		} else {
			impossible = true;
		}
	}
	if (impossible) {
		entry = entry || {};
		entry.impossible = true;
	}
	return entry;
};

// I have my own because the core one is deficient for my needs.
function parseTextReference(textRef) {
	// Separate out the title, field name and/or JSON indices
	var reTextRef = /^([\w\W]*?)(?:!!(\S[\w\W]*)|##(\S[\w\W]*))?$/g;
		match = reTextRef.exec(textRef),
		result = {};
	if(match) {
		// Return the parts
		result.title = match[1];
		result.field = match[2];
		result.index = match[3];
	} else {
		// If we couldn't parse it
		result.title = textRef
	}
	return result;
};

/** This converts a reference and a template into a string representation
 *  of a transclude.
 */
exports.makeTransclude = function(parser, reference, template) {
	var rtn;
	if (!canBePrettyTemplate(template)) {
		var widget = utils.makeWidget(parser, '$transclude', {
			tiddler: $tw.utils.trim(template),
			field: reference.field,
			index: reference.index});
		if (reference.title && widget !== undefined) {
			rtn = utils.makeWidget(parser, '$tiddler', {tiddler: $tw.utils.trim(reference.title)}, widget);
		} else {
			rtn = widget;
		}
	} else if (!canBePrettyTitle(reference.title) || !canBePrettyField(reference.field)) {
		// This block and the next account for the 1%...
		var transclude;
		if (canBePrettyField(reference.field)) {
			var reducedRef = {field: reference.field, index: reference.index};
			transclude = prettyTransclude(reducedRef, template);
		} else {
			transclude = utils.makeWidget(parser, "$transclude", {tiddler: $tw.utils.trim(reference.title), field: reference.field});
		}
		rtn = utils.makeWidget(parser, '$tiddler', {tiddler: $tw.utils.trim(reference.title)}, transclude);
	} else {
		// This block takes care of 99% of all cases
		rtn = prettyTransclude(reference, template);
	}
	return rtn;
};

function canBePrettyTitle(value) {
	return refHandler.canBePretty(value) && canBePrettyTemplate(value);
};

function canBePrettyField(value) {
	return !/[\|\}\{]/.test(value);
};

function canBePrettyTemplate(value) {
	return !value || (value.indexOf('}') < 0 && value.indexOf('{') < 0 && value.indexOf('|') < 0);
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
