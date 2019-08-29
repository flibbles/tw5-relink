/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	var t = utils.relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
	expect(options.fails.length).toEqual(failCount, "Incorrect number of failures");
};

describe("text", function() {

it('allows all other unmanaged wikitext rules', function() {
	function fine(text) { testText(text + " [[from here]]"); };
	fine("This is ordinary text");
	fine("This is a WikiLink here");
	fine("This \n*is\n*a\n*list");
	fine("Image: [img[https://google.com]] and [img[Title]] here");
	fine("External links: [ext[https://google.com]] and [ext[Tooltip|https://google.com]] here");
	fine("Comments <!-- Look like this -->");
	fine("Block Comments\n\n<!--\n\nLook like this? -->\n\n");
	fine("\\define macro() Single line stuff\n");
	fine("\\define macro()\nMultiline stuff\n\\end\n");
});

it('ignores titles in generic text', function() {
	testText("This is from here to elsewhere", {ignored: true});
});

it('relink ignore plaintext files', function() {
	var wiki = new $tw.Wiki();
	var text = "This is [[from here]] to there.";
	var t = utils.relink({text: text, type: "text/plain"}, {wiki: wiki});
	expect(t.fields.text).toEqual(text);
});

it('handles having no rules at all', function() {
	// Had a bug where processing any elements when no attribute
	// rules were present caused a null-reference.
	testText("<div>[[from here]]</div>");
	testText("<div>\n\n[[from here]]\n\n</div>");
});

it('handles managed rules inside unmanaged rules', function() {
	testText("List\n\n* [[from here]]\n* Item\n");
	testText("''[[from here]]''");
});

it('comments', function() {
	testText("<!--[[from here]]-->", {ignored: true});
	testText("<!--\n\n[[from here]]\n\n-->", {ignored: true});

	var inline = "Inline <!-- [[from here]] --> inline";
	var block = "<!--\n\n[[from here]]\n\n-->";
	// TODO: This commented-out test should work. Unfortunately, it
	// requires the WikiRelinker to process rule categories
	// (inline, block, pragma) separately, and at appropriate times.
	// This would basically require rewriting the WikiParser. The
	// alternative is to get Jeremy to make a few small changes to the
	// WikiParser which would allow its behavior to be more easily
	// modified through inheritance.
	//testText("\\rules except commentinline\n"+inline);
	testText("\\rules except commentblock\n"+inline, {ignored: true});
	testText("\\rules except commentinline\n"+block, {ignored: true});
	testText("\\rules except commentblock\n"+block, {ignored: true});
	testText("\\rules except commentinline commentblock\n"+block);
});

it('wikilinks', function() {
	var log = [];
	var macro = utils.placeholder;
	testText("A WikiLink please", {from: "WikiLink", to: "WikiChange", log: log});
	expect(log).toEqual(["Renaming 'WikiLink' to 'WikiChange' in CamelCase link of tiddler 'test'"]);
	testText("A ~WikiLink please", {from: "WikiLink", ignored: true});
	testText("A ~WikiLink please", {from: "~WikiLink", ignored: true});
	log = [];
	testText("A WikiLink please", "A [[to there]] please", {from: "WikiLink", log: log});
	expect(log).toEqual(["%cRenaming 'WikiLink' to 'to there' in CamelCase link of tiddler 'test' %cby converting it into a prettylink"]);
	testText("A WikiLink please", "A [[lowerCase]] please", {from: "WikiLink", to: "lowerCase"});
	testText("A WikiLink please", "A [[~TildaCase]] please", {from: "WikiLink", to: "~TildaCase"});
	testText("\\rules except wikilink\nA WikiLink please", {from: "WikiLink", ignored: true});

	// tricky
	var tricky = "has [[brackets]]";
	log = [];
	testText("A WikiLink please", macro(1,tricky)+"A <$link to=<<relink-1>>><$text text=<<relink-1>>/></$link> please", {from: "WikiLink", to: tricky, log: log});
	expect(log).toEqual(["%cRenaming 'WikiLink' to '"+tricky+"' in CamelCase link of tiddler 'test' %cby converting it into a widget and creating placeholder macros"]);
});

it('placeholders', function() {
	var from = 'End\'s with "quotes"';
	var to = 'Another\'"quotes"';
	var content = "Anything goes here";
	var macro = utils.placeholder;
	var log = [];
	// placeholders get replaced too
	testText(macro(1,from)+content, {from: from, to: to, log: log});
	expect(log).toEqual([`Renaming '${from}' to '${to}' in relink-1 definition of tiddler 'test'`]);
	// Works with Windows newlines
	testText(macro(1,from,"\r\n")+content, {from: from, to: to});
});

it('import pragma', function() {
	function wiki() {
		var w = new $tw.Wiki();
		w.addTiddler(utils.operatorConf("title"));
		return w;
	};
	var log = [];
	testText("\\import [title[from here]]\nstuff.",{wiki: wiki(),log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in \\import filter of tiddler 'test'"]);
	testText("\\rules except prettylink\n\\import [[from here]]\nstuff.", {ignored: true});
	testText("\\import [title[from here]]\n\n\nstuff.", {wiki: wiki()});
	testText("\\import     [title[from here]]   \nstuff.", {wiki: wiki()});
	testText("\\import [[from here]]\r\nstuff.", {wiki: wiki()});
	testText("\\import from\nstuff.",
	         "\\import [[to there]]\nstuff.", {from: "from", wiki: wiki()});
});

});
