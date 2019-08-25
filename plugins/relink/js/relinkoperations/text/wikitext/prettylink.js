/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

exports['prettylink'] = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	if (m[2] === undefined && m[1] === fromTitle) {
		return "[[" + toTitle + "]]";
	}
	if (m[2] === fromTitle) {
		return "[[" + m[1] + "|" + toTitle + "]]";
	}
	return undefined;
};
