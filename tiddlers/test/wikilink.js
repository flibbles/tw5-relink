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
	expect(r.log).toEqual(["Renaming 'WikiLink' to 'WikiChange' in 'test': ~WikiLink"]);
	testText("A ~WikiLink please", {ignored: true});
	testText("A ~WikiLink please", {from: "~WikiLink", ignored: true});
	testText("A WikiLink please", "A [[to there]] please");
	testText("A WikiLink please", "A [[lowerCase]] please", {to: "lowerCase"});
	testText("A WikiLink please", "A [[~TildaCase]] please", {to: "~TildaCase"});
});

it('rules pragma', function() {
	testText("\\rules except wikilink\nA WikiLink please", {ignored: true});
});

it('altered unWikiLink char', function() {
	utils.monkeyPatch($tw.config.textPrimitives, "unWikiLink", "%", function() {
		testText("A WikiLink", "A [[%WikiLink]]", {to: "%WikiLink"});
		testText("A %WikiLink", {from: "%WikiLink", ignored: true});
	});
});

it('tricky cases', function() {
	var tricky = "bad' title]]\"";
	var macro = utils.placeholder;
	var r = testText("A WikiLink please", macro(1,tricky)+"A <$link to=<<relink-1>>/> please", {to: tricky});
	expect(r.log).toEqual(["Renaming 'WikiLink' to '"+tricky+"' in 'test': ~WikiLink"]);
});

it('respects \\rules', function() {
	function test(rules, options) {
		options.from = "WikiLink";
		var r = testText(rules + "\nWikiLink", options);
		expect(r.fails.length).toEqual(options.fails || 0);
	};
	test("\\rules except wikilink", {ignored: true});
	test("\\rules only wikilink", {to: "ToThere"});
	test("\\rules only html prettylink", {to: "ToThere", ignored: true});

	test("\\rules except html", {to: "to there]]", ignored: true, fails: 1});
	// disabled html doesn't prevent prettylinks
	testText("\\rules only wikilink prettylink\nWikiLink",
	         "\\rules only wikilink prettylink\n[[to there]]",{to: "to there"});
	testText("\\rules except html\nWikiLink",
	         "\\rules except html\n[[to there]]",{to: "to there"});

	// skip prettylinks and go to html
	testText("\\rules except prettylink\nWikiLink",
	         "\\rules except prettylink\n<$link to='to there'/>",
	         {from: "WikiLink"});
	testText("\\rules only html wikilink\nWikiLink",
	         "\\rules only html wikilink\n<$link to='to there'/>",
	         {from: "WikiLink"});

	// link can be pretty, but pretty isn't allowed
	var prettyOnly =  "to 'there\"";
	test("\\rules except prettylink html", {to: prettyOnly, ignored: true, fails: 1});
	testText("\\rules except prettylink\nWikiLink",
	         utils.placeholder(1, prettyOnly)+"\\rules except prettylink\n<$link to=<<relink-1>>/>",
	         {to: prettyOnly});

	// placeholdering
	var tricky = "bad' title]]\"";
	test("\\rules except macrodef", {to: tricky, ignored: true, fails: 1, macrodefCanBeDisabled: true});
	testText("\\rules only wikilink html\nWikiLink",
	         utils.placeholder(1, tricky) + "\\rules only wikilink html\n<$link to=<<relink-1>>/>", {to: tricky});
});

it("reports", async function() {
	// I'd test for wikilinks enabled or disabled, but that setting persists
	// even between new TiddlyWikis. It'd need a full Node reset to change.
	function test(expected) {
		var wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: 'S WikiCat ~WikiDog %WikiPig E'});
		expect(wiki.getTiddlerRelinkReferences('test')).toEqual(expected);
	};
	test({WikiCat: ['~WikiCat'], WikiPig: ['~WikiPig']});
	utils.monkeyPatch($tw.config.textPrimitives, "unWikiLink", "%", function() {
		test({WikiCat: ['%WikiCat'], WikiDog: ['%WikiDog']});
	});
});

});
