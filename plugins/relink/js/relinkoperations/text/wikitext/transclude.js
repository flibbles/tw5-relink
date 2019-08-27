/*\
module-type: relinkwikitextrule

Handles replacement of transclusions in wiki text like,

{{RenamedTiddler}}
{{RenamedTiddler||TemplateTitle}}

This renames both the tiddler and the template field.

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;
var utils = require("./utils.js");

function transclude(tiddler, text, fromTitle, toTitle, options) {
	var m = this.match,
		title = m[1],
		template = m[2],
		quoted,
		logArguments = {
			from: fromTitle,
			to: toTitle,
			tiddler: tiddler.fields.title
		};
	this.parser.pos = this.matchRegExp.lastIndex;
	if (canBePretty(toTitle)) {
		// This block takes care of 99% of all cases
		var modified = false;
		if ($tw.utils.trim(title) === fromTitle) {
			modified = true;
			// preserve user's whitespace
			title = title.replace(fromTitle, toTitle);
		}
		if ($tw.utils.trim(template) === fromTitle) {
			modified = true;
			// preserve user's whitespace
			template = template.replace(fromTitle, toTitle);
		}
		if (modified) {
			log("transclude", logArguments);
			return prettyTransclude(title, template);
		}
		return undefined;
	}
	if ($tw.utils.trim(title) === fromTitle) {
		var resultTitle = utils.wrapAttributeValue(toTitle);
		if (resultTitle === undefined) {
			var ph = this.parser.getPlaceholderFor(toTitle);
			resultTitle = "<<"+ph+">>";
			log("transclude-placeholder", logArguments);
		} else {
			log("transclude-widget", logArguments);
		}
		if ($tw.utils.trim(template) === fromTitle) {
			// Now for this bizarre-ass use-case, where both the
			// title and template are being replaced.
			return `<$tiddler tiddler=${resultTitle}><$transclude tiddler=${resultTitle}/></$tiddler>`;
		} else {
			return `<$tiddler tiddler=${resultTitle}>${prettyTransclude(undefined, template)}</$tiddler>`;
		}
	}
	if ($tw.utils.trim(template) === fromTitle) {
		var resultTemplate = utils.wrapAttributeValue(toTitle);
		var message = "transclude-widget";
		var rtn;
		if (resultTemplate === undefined) {
			var ph = this.parser.getPlaceholderFor(toTitle);
			resultTemplate = "<<"+ph+">>";
			message = "transclude-placeholder";
		}
		if (title) {
			var resultTitle = utils.wrapAttributeValue(title);
			if (resultTitle === undefined) {
				// This is one of the rare cases were we need
				// to placeholder a title OTHER than the one
				// we're changing.
				var ph = this.parser.getPlaceholderFor(title);
				resultTitle = "<<"+ph+">>";
				message = "transclude-placeholder";
			}
			rtn = `<$tiddler tiddler=${resultTitle}><$transclude tiddler=${resultTemplate}/></$tiddler>`;
		} else {
			rtn = `<$transclude tiddler=${resultTemplate}/>`;
		}
		log(message, logArguments);
		return rtn;
	}
	return undefined;
};

function canBePretty(value) {
	return value.indexOf('}') < 0 && value.indexOf('{') < 0 && value.indexOf('|') < 0;
};

function prettyTransclude(textReference, template) {
	if (!textReference) {
		textReference = '';
	}
	if (template !== undefined) {
		return `{{${textReference}||${template}}}`;
	} else {
		return `{{${textReference}}}`;
	}
};

exports['transcludeinline'] = exports['transcludeblock'] = transclude;
