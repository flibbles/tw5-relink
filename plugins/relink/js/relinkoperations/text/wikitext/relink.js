/*\
module-type: wikirule

This defines the \relink pragma used to locally declare relink rules for
macros.

It takes care of providing its own relink and report rules.

\*/

exports.name = "relink";
exports.types = {pragma: true};

exports.init = function(parser) {
	this.parser = parser;
	this.matchRegExp = /^\\relink[^\S\n]+([^(\s]+)([^\r\n]*)(\r?\n)?/mg;
};

exports.parse = function() {
	this.parser.pos = this.matchRegExp.lastIndex;
	var macroName;
	var settings = Object.create(null);
	this.interpretSettings(function(macro, parameter, type) {
		macroName = macro;
		settings[parameter] = type;
	});
	if (macroName) {
		var relink = Object.create(null);
		relink[macroName] = settings;
		// Return nothing, because this rule is ignored by the parser
		return [{
			type: "set",
			children: [],
			relink: relink}];
	} else {
		return [];
	}
};

exports.relink = function(text, fromTitle, toTitle, options) {
	this.parser.pos = this.matchRegExp.lastIndex;
	var self = this;
	this.interpretSettings(function(macro, parameter, type) {
		self.parser.macros.addSetting(macro, parameter, type);
	});
	// Return nothing, because this rule is ignored by the parser
	return undefined;
};

exports.interpretSettings = function(block) {
	var paramString = this.match[2];
	if (paramString !== "") {
		var macro = this.match[1];
		var reParam = /\s*([A-Za-z0-9\-_]+)\s*:\s*([^\s]+)/mg;
		var paramMatch = reParam.exec(paramString);
		while (paramMatch) {
			var parameter = paramMatch[1];
			var type = paramMatch[2];
			block(macro, parameter, type);
			paramMatch = reParam.exec(paramString);
		}
	}
};
