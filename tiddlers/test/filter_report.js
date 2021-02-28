/*\

Tests the report filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray, extraTiddlers) {
	fromTitle = fields.from || "from";
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers(extraTiddlers || []);
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:report["+fromTitle+"]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: report', function() {

it("works on empty reports", function() {
	test({text: "This text has no links"}, []);
});

it("syslinks", function() {
	test({text: "Text $:/sys/link stuff", from: "$:/sys/link"},
	     ["~$:/sys/link"]);
});

it("images", function() {
	test({text: "[img[from]]"}, ["[img[]]"]);
	test({text: "[img[Caption|from]]"}, ["[img[Caption]]"]);
	// We strip surrounding whitespace because it can include \n.
	test({text: "[img[ Caption |from]]"}, ["[img[Caption]]"]);
	test({text: "[img class={{from}} [else]]"}, ["[img class={{}}]"]);
	test({text: "[img height={{from!!height}} [else]]"}, ["[img height={{!!height}}]"]);
	test({text: "[img height={{{from}}} [else]]"}, ["[img height={{{}}}]"]);
	test({text: "[img height={{{[tag[from]]}}} [else]]"}, ["[img height={{{[tag[]]}}}]"]);
	test({text: "[img height={{{from [tag[from]]}}} [else]]"}, ["[img height={{{}}}]", "[img height={{{[tag[]]}}}]"]);
	// macros as parameters
	test({text: "[img height=<<test title: from>> [else]]"},
	     ["[img height=<<test title>>]"],
	     [utils.macroConf("test", "title", "title")]);
	test({text: "[img height=<<test filt: '[tag[from]]'>> [else]]"},
	     ['[img height=<<test filt: "[tag[]]">>]'],
	     [utils.macroConf("test", "filt", "filter")]);
	test({text: "[img height=<<test F: 'from [tag[from]]'>> [else]]"},
	     ['[img height=<<test F>>]', '[img height=<<test F: "[tag[]]">>]'],
	     [utils.macroConf("test", "F", "filter")]);
	// Both are recorded separately
	test({text: "[img height={{from}} [from]]"},["[img height={{}}]","[img[]]"]);
});

it("fields", function() {
	test({"list-after": "from"}, ["list-after"]);
	test({"tags": "A from B"}, ["tags"]);
	test({"list": "A from B"}, ["list"]);

	// Multiple instances within a field are reported only once, this is
	// because Tiddlywiki removes duplicates itself, so we can't even
	// tell with the "list" field. Just got to make sure we're consistent
	// with custom list fields.
	test({"list": "A from B from"}, ["list"]);
	test({"customlist": "A from B from"}, ["customlist"],
		[utils.fieldConf("customlist", "list")]);
	test({"customwiki": "A [[from]] B"}, ["customwiki: [[from]]"],
		[utils.fieldConf("customwiki", "wikitext")]);
	// multiples in one field
	test({"customwiki": "A [[from]] {{from!!field}}"},
	     ["customwiki: [[from]]", "customwiki: {{!!field}}"],
	     [utils.fieldConf("customwiki", "wikitext")]);
});

it("filter fields", function() {
	test({"filter": "A from"}, ["filter"]);
	test({"filter": "A [tag[from]]"}, ["filter: [tag[]]"]);
	// Duplicates are allowed
	test({"filter": "A from B from"}, ["filter", "filter"]);
	test({"filter": "from [tag[from]]"}, ["filter","filter: [tag[]]"]);
});

it("filter tiddlers", function() {
	test({type: "text/x-tiddler-filter", text: "[tag[from]]"}, ["[tag[]]"]);
	// This is the only case where a report string may be empty
	test({type: "text/x-tiddler-filter", text: "from"}, [""]);
	// Multiples
	test({type: "text/x-tiddler-filter", text: "from [tag[from]]"}, ["", "[tag[]]"]);
	// Also, make sure $:/DefaultTiddlers works.
	test({title: "$:/DefaultTiddlers", text: "[tag[from]]"}, ["[tag[]]"]);
});

it("filters", function() {
	function testFilter(text, expected, extraTiddlers) {
		test({type: "text/x-tiddler-filter", text: text}, expected, extraTiddlers);
	};
	// Variations of title
	testFilter("[[from]]", [""]);
	testFilter("[{from}]", ["[title{}]"]);
	testFilter("from", [""]);
	testFilter("'from'", [""]);
	testFilter('"from"', [""]);
	testFilter("[title[from]]", ["[title[]]"]);
	testFilter("[field:title[from]]", ["[field:title[]]"]);
	testFilter("[[from]tag[something]]", ["[title[]]"]);

	// Suffixes and Prefixes
	testFilter("[!tag[from]]", ["[!tag[]]"]);
	testFilter("[tag:suffix[from]]", ["[tag:suffix[]]"]);

	//Indirect parameters
	testFilter("[something{from}]", ["[something{}]"]);
	testFilter("[something{from!!f}]", ["[something{!!f}]"]);
	testFilter("[something{from##i}]", ["[something{##i}]"]);

	// Different operand types
	testFilter("[list[from]]", ["[list[]]"]);
	testFilter("[list[from##i]]", ["[list[##i]]"]);
	testFilter("[enlist[A from B]]", ["[enlist[]]"],
	           [utils.operatorConf("enlist", "list")]);
	testFilter("[filt[from]]", ["[filt[]]"],
	           [utils.operatorConf("filt", "filter")]);
	testFilter("[wiki[{{from!!field}}]]", ["[wiki[{{!!field}}]]"],
	           [utils.operatorConf("wiki", "wikitext")]);

	// Multiples
	testFilter("from [tag[from]oper{from}]", ["", "[tag[]]", "[oper{}]"]);

	// BUG: Doesn't report for any operators later in a run
	testFilter("[tag[from]something[else]]", ["[tag[]]"]);
});

});
