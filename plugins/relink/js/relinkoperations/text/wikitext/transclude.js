/*\
module-type: relinkwikitextrule

Handles replacement of transclusions in wiki text like,

{{RenamedTiddler}}
{{RenamedTiddler||TemplateTitle}}

This renames both the tiddler and the template field.

\*/

function transclude(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	var title = m[1];
	var template = m[2];
	var isModified = false;
	// We go to extra lengths to preserve surrounding whitespace.
	if ($tw.utils.trim(title) === fromTitle) {
		title = title.replace(fromTitle, toTitle);
		isModified = true;
	}
	if ($tw.utils.trim(template) === fromTitle) {
		template = template.replace(fromTitle, toTitle);
		isModified = true;
	}
	if (isModified) {
		if (template !== undefined) {
			return `{{${title}||${template}}}`;
		} else {
			return `{{${title}}}`;
		}
	}
	return undefined;
};

exports['transcludeinline'] = exports['transcludeblock'] = transclude;
