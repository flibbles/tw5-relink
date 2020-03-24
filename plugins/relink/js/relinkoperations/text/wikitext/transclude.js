/*\
module-type: relinkwikitextrule

Handles replacement of transclusions in wiki text like,

{{RenamedTiddler}}
{{RenamedTiddler||TemplateTitle}}

This renames both the tiddler and the template field.

\*/

var refHandler = require("$:/plugins/flibbles/relink/js/fieldtypes/reference");
var utils = require("./utils.js");

exports.name = ['transcludeinline', 'transcludeblock'];

function TranscludeEntry() {};
TranscludeEntry.prototype.name = "transclude";
TranscludeEntry.prototype.occurrences = function(title) {
	return ["{{" + title + "}}"];
};

exports.relink = function(text, fromTitle, toTitle, options) {
	var m = this.match,
		reference = m[1],
		template = m[2],
		quoted,
		entry = new TranscludeEntry(),
		trimmedRef = $tw.utils.trim(reference),
		ref = $tw.utils.parseTextReference(trimmedRef),
		rtn;
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
		}
		if ($tw.utils.trim(template) === fromTitle) {
			modified = true;
			// preserve user's whitespace
			template = template.replace(fromTitle, toTitle);
		}
		if (modified) {
			rtn = prettyTransclude(reference, template);
		}
	} else if (ref.title === fromTitle) {
		// This block and the next account for the 1%...
		entry.widget = true;
		var resultTitle = utils.wrapAttributeValue(toTitle);
		if (resultTitle === undefined) {
			resultTitle = "<<"+this.parser.getPlaceholderFor(toTitle)+">>";
			entry.placeholder = true;
		}
		if ($tw.utils.trim(template) === fromTitle) {
			// Now for this bizarre-ass use-case, where both the
			// title and template are being replaced.
			var attrs = this.transcludeAttributes(ref.field, ref.index);
			rtn = "<$tiddler tiddler="+resultTitle+"><$transclude tiddler="+resultTitle+attrs+"/></$tiddler>";
		} else {
			ref.title = undefined;
			rtn = "<$tiddler tiddler="+resultTitle+">"+prettyTransclude(ref, template)+"</$tiddler>";
		}
	} else if ($tw.utils.trim(template) === fromTitle) {
		var resultTemplate = utils.wrapAttributeValue(toTitle);
		entry.widget = true;
		if (resultTemplate === undefined) {
			resultTemplate = "<<"+this.parser.getPlaceholderFor(toTitle)+">>";
			entry.placeholder = true;
		}
		if (ref.title) {
			var resultTitle = utils.wrapAttributeValue(ref.title);
			if (resultTitle === undefined) {
				// This is one of the rare cases were we need
				// to placeholder a title OTHER than the one
				// we're changing.
				resultTitle = "<<"+this.parser.getPlaceholderFor(ref.title)+">>";
				entry.placeholder = true;
			}
			var attrs = this.transcludeAttributes(ref.field, ref.index);
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
exports.transcludeAttributes = function(field, index) {
	return rtn = [
		wrapAttribute(this.parser, "field", field),
		wrapAttribute(this.parser, "index", index)
	].join('');
};

function wrapAttribute(wikiRelinker, name, value) {
	if (value) {
		var wrappedValue = utils.wrapAttributeValue(value);
		if (wrappedValue === undefined) {
			wrappedValue = "<<"+wikiRelinker.getPlaceholderFor(value, name)+">>";
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
