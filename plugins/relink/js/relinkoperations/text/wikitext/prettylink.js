/*\
module-type: relinkwikitextrule

Handles replacement in wiki text inline rules, like,

[[Introduction]]

[[link description|TiddlerTitle]]

\*/

var log = require('$:/plugins/flibbles/relink/js/language.js').logRelink;

exports['prettylink'] = function(tiddler, text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var caption, m = this.match;
	if (m[2] === fromTitle) {
		// format is [[caption|MyTiddler]]
		caption = m[1];
	} else if (m[2] !== undefined || m[1] !== fromTitle) {
		// format is [[MyTiddler]], and it doesn't match
		return undefined;
	}
	var logArguments = {
		from: fromTitle,
		to: toTitle,
		tiddler: tiddler.fields.title
	};
	if (isSafe(toTitle)) {
		log("prettylink", logArguments);
		return prettyLink(toTitle, caption);
	} else {
		if (caption) {
			log("prettylink-widget", logArguments);
			return `<$link to='${toTitle}'>${caption}</$link>`;
		} else {
			log("prettylink-placeholder", logArguments);
			var ph = this.parser.getPlaceholderFor(toTitle);
			return `<$link to=<<${ph}>>><$text text=<<${ph}>>/></$link>`;
		}
	}
};

function prettyLink(title, caption) {
	if (caption) {
		return "[[" + caption + "|" + title + "]]";
	} else {
		return "[[" + title + "]]";
	}
};

function isSafe(value) {
	return value.indexOf("]]") < 0 && value[value.length-1] !== ']';
};
