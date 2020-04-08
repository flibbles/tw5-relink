/*\

Tests the occurrences filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray) {
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddler(utils.macroConf("test", "title", "title"));
	wiki.addTiddler(utils.macroConf("test", "filter", "filter"));
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:occurrences[from]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: occurrences', function() {

it("works", function() {
	test({text: "Text [[from]] stuff"}, ["[[from]]"]);
	test({text: "Reference {{from}} stuff"}, ["{{from}}"]);
	//test({text: "<$link to=from>stuff</$link>"}, ["<$link to=from ..>"]);
	//test({text: "Reference {{other||from}} stuff"}, ["{{||from}}"]);
	//test({list: "A from B"}, ["list: [[from]], .."]);
});

it("html", function() {
	test({text: "<$link to='from' />"}, ["<$link to />"]);
	test({text: "<$link to='from' tooltip={{from}} />"},
	     ["<$link to />", "<$link tooltip />"]);
});

it("macrocall", function() {
	var def = "\\define test(title, filter) stuff\n";
	test({text: def+"<<test title:from>>"}, ["<<test title>>"]);
	test({text: def+"<<test from>>"}, ["<<test title>>"]);
	test({text: def+"<<test from '[[from]]'>>"},
	     ["<<test title>>", "<<test filter>>"]);
	test({text: def+"<<test from>>\n<<test from>>"},
	     ["<<test title>>", "<<test title>>"]);
});

it("fields", function() {
	test({"list-after": "from"}, ["list-after field"]);
	test({"tags": "A from B"}, ["tags"]);
	test({"list": "A from B"}, ["list field"]);

	// Multiple instances within a field are merged into a single one.
	test({"list": "A from B from"}, ["list field"]);
	test({"filter": "A from [tag[from]]"}, ["filter field"]);

});

it("filter tiddlers", function() {
	test({type: "text/x-tiddler-filter", text: "[tag[from]]"}, ["tag[]"]);
	// Also, make sure $:/DefaultTiddlers works.
	test({title: "$:/DefaultTiddlers", text: "[tag[from]]"}, ["tag[]"]);
});

it("filters", function() {
	function testFilter(text, expected) {
		test({type: "text/x-tiddler-filter", text: text}, expected);
	};
	// Variations of title
	testFilter("[[from]]", ["title[]"]);
	testFilter("[{from}]", ["title{}"]);
	testFilter("from", ["title"]);
	testFilter("'from'", ["'title'"]);
	testFilter('"from"', ['"title"']);
	testFilter("[title[from]]", ["title[]"]);
	testFilter("[field:title[from]]", ["field:title[]"]);

	// Suffixes and Prefixes
	testFilter("[!tag[from]]", ["!tag[]"]);
	testFilter("[tag:suffix[from]]", ["tag:suffix[]"]);

	//Indirect parameters
	testFilter("[something{from}]", ["something{}"]);

	// Multiples
	testFilter("from [tag[from]oper{from}]", ["title", "tag[]", "oper{}"]);
});

});
