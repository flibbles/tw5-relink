/*\

Handles CamelCase links

WikiLink

but not:

~WikiLink

\*/

exports['wikilink'] = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	if (this.match[0] === fromTitle && this.match[0][0] !== '~') {
		if (toTitle.match(this.matchRegExp) && toTitle[0] !== '~') {
			return toTitle;
		} else {
			return "[[" + toTitle + "]]";
		}
	}
	return undefined;
};

