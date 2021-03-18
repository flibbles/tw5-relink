/*\

Tests wikilinks, like ThisTiddler, but not ~ThisTiddler.

\*/

var utils = require("test/utils");

function testText(text, expected, report, options) {
	options = Object.assign({from: 'WikiLink', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers([
		{title: 'test', text: text},
		utils.attrConf('$link', 'to')]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

describe("wikilink", function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('wikilinks', function() {
	const report = ['~WikiLink'];
	testText("A WikiLink please", true, report, {from: "WikiLink", to: "WikiChange"});
	expect(console.log).toHaveBeenCalledWith("Renaming 'WikiLink' to 'WikiChange' in 'test'");
	testText("A ~WikiLink please", false, undefined);
	testText("A ~WikiLink please", false, undefined, {from: "~WikiLink"});
	testText("A WikiLink please", "A [[to there]] please", report);
	testText("A WikiLink please", "A [[lowerCase]] please", report, {to: "lowerCase"});
	testText("A WikiLink please", "A [[~TildaCase]] please", report, {to: "~TildaCase"});
});

it('rules pragma', function() {
	testText("\\rules except wikilink\nA WikiLink please", false, undefined);
});

it('altered unWikiLink char', function() {
	utils.monkeyPatch($tw.config.textPrimitives, "unWikiLink", "%", function() {
		testText("A WikiLink", "A [[%WikiLink]]", ['%WikiLink'], {to: "%WikiLink"});
		testText("A %WikiLink", false, undefined);
		testText("A %WikiLink", false, undefined, {from: "%WikiLink"});
	});
});

it('tricky cases', function() {
	var tricky = "bad' title]]\"";
	var macro = utils.placeholder;
	testText("A WikiLink please", macro(1,tricky)+"A <$link to=<<relink-1>>/> please", ['~WikiLink'], {to: tricky});
	expect(console.log).toHaveBeenCalledWith("Renaming 'WikiLink' to '"+tricky+"' in 'test'");
});

it('respects \\rules', function() {
	const report = ['~WikiLink'];
	function testFail(rules, expected, options) {
		var fails = utils.collectFailures(function() {
			testText(rules, expected, report, options);
		});
		expect(fails.length).toBe(1);
	};
	testText("\\rules except wikilink\nWikiLink", false, undefined);
	testText("\\rules only wikilink\nWikiLink", true, report, {to: "ToThere"});
	testText("\\rules only html prettylink\nWikiLink", false, undefined, {to: "ToThere"});

	testFail("\\rules except html\nWikiLink", false, {to: "to there]]"});
	// disabled html doesn't prevent prettylinks
	testText("\\rules only wikilink prettylink\nWikiLink",
	         "\\rules only wikilink prettylink\n[[to there]]",
	         report, {to: "to there"});
	testText("\\rules except html\nWikiLink",
	         "\\rules except html\n[[to there]]",
	         report, {to: "to there"});

	// skip prettylinks and go to html
	testText("\\rules except prettylink\nWikiLink",
	         "\\rules except prettylink\n<$link to='to there'/>",
	         report, {from: "WikiLink"});
	testText("\\rules only html wikilink\nWikiLink",
	         "\\rules only html wikilink\n<$link to='to there'/>",
	         report, {from: "WikiLink"});

	// link can be pretty, but pretty isn't allowed
	var prettyOnly =  "to 'there\"";
	testFail("\\rules except prettylink html\nWikiLink", false, {to: prettyOnly});
	testText("\\rules except prettylink\nWikiLink",
	         utils.placeholder(1, prettyOnly)+"\\rules except prettylink\n<$link to=<<relink-1>>/>",
	         report,
	         {to: prettyOnly});

	// placeholdering
	var tricky = "bad' title]]\"";
	testFail("\\rules except macrodef\nWikiLink", false, {to: tricky, macrodefCanBeDisabled: true});
	testText("\\rules only wikilink html\nWikiLink",
	         utils.placeholder(1, tricky) + "\\rules only wikilink html\n<$link to=<<relink-1>>/>",
	         report, {to: tricky});
});

it("reports", function() {
	// I'd test for wikilinks enabled or disabled, but that setting persists
	// even between new TiddlyWikis. It'd need a full Node reset to change.
	function test(expected) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: 'S WikiCat ~WikiDog %WikiPig E'});
		expect(wiki.getTiddlerRelinkReferences('test')).toEqual(expected);
	};
	test({WikiCat: ['~WikiCat'], WikiPig: ['~WikiPig']});
	utils.monkeyPatch($tw.config.textPrimitives, "unWikiLink", "%", function() {
		test({WikiCat: ['%WikiCat'], WikiDog: ['%WikiDog']});
	});
});

});
