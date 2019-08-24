/*\

Handles pragma macro definitions. Except we only update placeholder macros
that we may have previously install.

\define relink-?() Tough title

\*/

exports['macrodef'] = function(tiddler, text, fromTitle, toTitle, options, state) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var m = this.match;
	// !m[3] means it's not a multiline macrodef
	var placeholder = /^relink-(\d+)$/.exec(m[1]);
	if (placeholder && m[2] === '' && !m[3]) {
		this.parser.pos = $tw.utils.skipWhiteSpace(text, this.parser.pos);
		var valueRegExp = /([^\n\r]+)(\r?\n)/mg;
		valueRegExp.lastIndex = this.parser.pos;
		var match = valueRegExp.exec(text);
		if (match && match[1] === fromTitle) {
			this.parser.pos += match[0].length;
			return `\\define ${m[1]}() ${toTitle}${match[2]}`;
		} else {
			// That number is taken.
			state.reserve(placeholder[1]);
		}
	}
	return undefined;
};
