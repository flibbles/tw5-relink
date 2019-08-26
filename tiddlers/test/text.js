/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");
var relink = utils.relink;

describe("text", function() {

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var t = utils.relink({text: text}, options);
	expect(t.fields.text).toEqual(expected);
};

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

it('prettylinks ignore plaintext files', function() {
	var wiki = new $tw.Wiki();
	var text = "This is [[from here]] to there.";
	var t = relink({text: text, type: "text/plain"}, {wiki: wiki});
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
	testText("<!--\n\n[[from here]]-->", {ignored: true});
});

it('prettylinks', function() {
	var log = [];
	testText("Link to [[from here]].", {log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in prettylink of tiddler 'test'"]);
	testText("Link to [[description|from here]].");
	testText("Link to [[weird]desc|from here]].");
	testText("Link to [[it is from here|from here]].", "Link to [[it is from here|to there]].");
	testText("Link [[new\nline|from here]].", "Link [[new\nline|from here]].");
	testText("Link to [[elsewhere]].");
	testText("Link to [[desc|elsewhere]].");
	testText("Multiple [[from here]] links [[description|from here]].");
	testText("Link to [[from here]].", {to: "to [bracket] there"});

	// Tricky renames
	var macro = utils.placeholder;
	function tricky(to, caption) {
		log = [];
		caption = caption ? caption+"|" : "";
		var expected = macro(1,to)
		             + macro("pretty-1", `[[${caption}$(relink-1)$]]`)
		             + "Link to <<relink-pretty-1>>.";
		testText(`Link to [[${caption}from here]].`,expected, {to: to, log: log});
	};
	tricky("to [bracks]");
	expect(log).toEqual(["%cRenaming 'from here' to 'to [bracks]' in prettylink of tiddler 'test' %cby creating placeholder macros"]);
	tricky("to [bracks]", "caption");
	tricky("to [[brackets]] here");
});

it('wikilinks', function() {
	var log = [];
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
	testText("\\import [title[from here]]\nstuff.", {wiki: wiki()});
	testText("\\import [title[from here]]\n\n\nstuff.", {wiki: wiki()});
	testText("\\import     [title[from here]]   \nstuff.", {wiki: wiki()});
	testText("\\import [[from here]]\r\nstuff.", {wiki: wiki()});
	testText("\\import from\nstuff.",
	         "\\import [[to there]]\nstuff.", {from: "from", wiki: wiki()});
});

it('transcludes', function() {
	var log = [];
	testText("{{from here}}", {log: log})
	expect(log).toEqual(["Renaming 'from here' to 'to there' in transclusion of tiddler 'test'"]);
	testText("Before {{from here}} After")
	testText("Before {{from here||template}} After")
	testText("Before {{title||from here}} After")
	testText("Before {{||from here}} After")
	testText("Before {{from here||from here}} After")
	testText("Before\n\n{{from here||template}}\n\nAfter")
	testText("Before {{  from here  }} After")
	testText("Before {{  from here  ||  from here  }} After")
	testText("Before {{||  from here  }} After")
	testText("{{elsewhere}}", {ignored: true})
});

});
