/*\

Tests placeholder macros which were previously created by relink.
E.G.

\define relink-1() ...
\define relink-filter-3() ...

\*/

var utils = require("test/utils");

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
	return results;
};

const macro = utils.placeholder;

describe("placeholders", function() {

it('executes and logs', function() {
	var from = 'End\'s with "quotes"';
	var to = 'Another\'"quotes"';
	var content = "Anything goes here";
	// placeholders get replaced too
	var r = testText(macro(1,from)+content, {from: from, to: to});
	expect(r.log).toEqual([`Renaming '${from}' to '${to}' in relink-1 definition of tiddler 'test'`]);
});

it('increment to next available number', function() {
	var to = "to[]this";
	testText(
		macro(1,"something")+"{{{[title[from here]]}}}",
		macro(2,to)+macro(1,"something")+"{{{[title<relink-2>]}}}",
		{to: to});
});

it('filter', function() {
	// Works with the filter placeholders
	testText(macro("filter-1","[title[from here]]")+"Tiddler body");
	var r = testText(
		macro("filter-1","[title[from here]]")+"Tiddler body",
		macro(1,"to[]this")+macro("filter-1","[title<relink-1>]")+"Tiddler body",
		{to: "to[]this"});
	expect(r.log).toEqual([`%cRenaming 'from here' to 'to[]this' in relink-filter-1 definition of tiddler 'test' %cby creating placeholder macros`]);
});

it('list', function() {
	// Works with the list placeholders
	testText(macro("list-1","A [[from here]] B")+"Tiddler body");
});

it('reference', function() {
	// Works with reference placeholders
	testText(macro("reference-1","from here!!field")+"Tiddler body");
});

it('wikitext', function() {
	// Works with wikitext placeholders
	testText(macro("wikitext-1", "pretty [[from here]] link")+"Body");
});

it('Windows newlines', function() {
	// Works with Windows newlines
	testText(macro(1,"from here","\r\n")+"Body content");
});

it('Detects globally defined placeholder macros', function() {
	var to = "' ]]\"";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "macros", text: "\\define relink-1() Dummy\nBody", tags: "$:/tags/Macro"});
	testText("<$link to='from here' />\n<$text text=<<relink-1>> />",
	         macro(2, to) + "<$link to=<<relink-2>> />\n<$text text=<<relink-1>> />", {wiki: wiki, to: to});
});

it('Detects imported placeholder macros', function() {
	var to = "' ]]\"";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "import", text: "\\define relink-1() D\nBody"});
	testText("\\import import\n<$link to='from here' />",
	         macro(2, to) + "\\import import\n<$link to=<<relink-2>> />",
	         {wiki: wiki, to: to});
});

});
