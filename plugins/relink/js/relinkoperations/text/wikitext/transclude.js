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
		quoted,
		trimmedRef = $tw.utils.trim(reference),
		ref = $tw.utils.parseTextReference(trimmedRef),
		entry = new TranscludeEntry(),
		rtn;
	entry.reference = ref;
	entry.template = template;
	this.parser.pos = this.matchRegExp.lastIndex;
	// This block takes care of 99% of all cases
	if (canBePrettyTemplate(toTitle) &&
		// title part has one extra restriction
	    (ref.title !== fromTitle || refHandler.canBePretty(toTitle))) {
		var modified = false;
		if (ref.title === fromTitle) {
			modified = true;
			ref.title = toTitle;
			var refString = refHandler.toString(ref);
			// preserve user's whitespace
			reference = reference.replace(trimmedRef, refString);
			entry.add({name: "reference"});
		}
		if ($tw.utils.trim(template) === fromTitle) {
			modified = true;
			// preserve user's whitespace
			template = template.replace(fromTitle, toTitle);
			entry.add({name: "template"});
		}
		if (modified) {
			rtn = prettyTransclude(reference, template);
		}
	} else if (ref.title === fromTitle) {
		// This block and the next account for the 1%...
		entry.widget = true;
		var resultTitle = utils.wrapAttributeValue(toTitle);
		if (resultTitle === undefined) {
			if (!options.placeholder) {
				entry.impossible = true;
				return entry;
			}
			resultTitle = "<<"+options.placeholder.getPlaceholderFor(toTitle)+">>";
			entry.placeholder = true;
		}
		if ($tw.utils.trim(template) === fromTitle) {
			// Now for this bizarre-ass use-case, where both the
			// title and template are being replaced.
			var attrs = this.transcludeAttributes(ref.field, ref.index, options);
			if (attrs === undefined) {
				entry.impossible = true;
				return entry;
			}
			rtn = "<$tiddler tiddler="+resultTitle+"><$transclude tiddler="+resultTitle+attrs+"/></$tiddler>";
		} else {
			ref.title = undefined;
			rtn = "<$tiddler tiddler="+resultTitle+">"+prettyTransclude(ref, template)+"</$tiddler>";
		}
	} else if ($tw.utils.trim(template) === fromTitle) {
		var resultTemplate = utils.wrapAttributeValue(toTitle);
		entry.widget = true;
		if (resultTemplate === undefined) {
			if (!options.placeholder) {
				entry.impossible = true;
				return entry;
			}
			resultTemplate = "<<"+options.placeholder.getPlaceholderFor(toTitle)+">>";
			entry.placeholder = true;
		}
		if (ref.title) {
			var resultTitle = utils.wrapAttributeValue(ref.title);
			if (resultTitle === undefined) {
				// This is one of the rare cases were we need
				// to placeholder a title OTHER than the one
				// we're changing.
				if (!options.placeholder) {
					entry.impossible = true;
					return entry;
				}
				resultTitle = "<<"+options.placeholder.getPlaceholderFor(ref.title)+">>";
				entry.placeholder = true;
			}
			var attrs = this.transcludeAttributes(ref.field, ref.index, options);
			if (attrs === undefined) {
				entry.impossible = true;
				return entry;
			}
			rtn = "<$tiddler tiddler="+resultTitle+"><$transclude tiddler="+resultTemplate+attrs+"/></$tiddler>";
		} else {
			rtn = "<$transclude tiddler="+resultTemplate+"/>";
		}
	}
	if (rtn) {
		// Adding any newline that might have existed is what allows
		// this relink method to work for both the block and inline
		// filter wikitext rule.
		rtn = rtn + utils.getEndingNewline(m[0]);
		entry.output = rtn;
		return entry;
	}
	return undefined;
};

function canBePrettyTemplate(value) {
	return value.indexOf('}') < 0 && value.indexOf('{') < 0 && value.indexOf('|') < 0;
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
