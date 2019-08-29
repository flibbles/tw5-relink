/*\

Tests transcludes.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options.wiki.addTiddler(utils.operatorConf("title"));
	var t = utils.relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
};

function logMessage(toThere, but) {
	var msg = "Renaming 'from here' to '"+toThere+"' in filtered transclusion of tiddler 'test'"
	if (but) {
		msg = "%c" + msg + " %c" + but;
	}
	return msg;
};

describe("filtered transcludes", function() {

it('simple', function() {
	var log = [];
	testText("{{{[[from here]]}}}", {log: log});
	expect(log).toEqual([logMessage("to there")]);
});

});
