/*\

Handles replacement in wiki text inline rules, like:

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

var regExp = /\[\[(.*?)(?:\|(.*?))?\]\]/mg;

exports['prettylink'] = function(text, fromTitle, toTitle, options) {
	var modified = false;
	var rtn = text.replace(regExp, function(match, desc, link) {
		if (link === undefined && desc === fromTitle) {
			modified = true;
			return "[[" + toTitle + "]]";
		}
		if (link === fromTitle) {
			modified = true;
			return "[[" + desc + "|" + toTitle + "]]";
		}
	});
	return modified ? rtn : undefined;
};
