/*\

Tests wikilinks, like ThisTiddler, but not ~ThisTiddler.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	options = Object.assign({from: "WikiLink"}, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

describe("wikilink", function() {

it('wikilinks', function() {
	var r;
	r = testText("A WikiLink please", {from: "WikiLink", to: "WikiChange"});
	expect(r.log).toEqual(["Renaming 'WikiLink' to 'WikiChange' in CamelCase link of tiddler 'test'"]);
	testText("A ~WikiLink please", {ignored: true});
	testText("A ~WikiLink please", {from: "~WikiLink", ignored: true});
	r = testText("A WikiLink please", "A [[to there]] please");
	expect(r.log).toEqual(["%cRenaming 'WikiLink' to 'to there' in CamelCase link of tiddler 'test' %cby converting it into a prettylink"]);
	testText("A WikiLink please", "A [[lowerCase]] please", {to: "lowerCase"});
	testText("A WikiLink please", "A [[~TildaCase]] please", {to: "~TildaCase"});
});

it('rules pragma', function() {
	testText("\\rules except wikilink\nA WikiLink please", {ignored: true});
});

it('tricky cases', function() {
	var tricky = "has [[brackets]]";
	var macro = utils.placeholder;
	var r = testText("A WikiLink please", macro(1,tricky)+"A <$link to=<<relink-1>>><$text text=<<relink-1>>/></$link> please", {to: tricky});
	expect(r.log).toEqual(["%cRenaming 'WikiLink' to '"+tricky+"' in CamelCase link of tiddler 'test' %cby converting it into a widget and creating placeholder macros"]);
});

});
