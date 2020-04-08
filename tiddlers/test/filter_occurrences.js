/*\

Tests the occurrences filter.

\*/

var utils = require("test/utils");

function test(fields, expectedArray, extraTiddlers) {
	fromTitle = fields.from || "from";
	var wiki = new $tw.Wiki();
	var tiddler = $tw.utils.extend({title: "test"}, fields);
	wiki.addTiddlers(utils.setupTiddlers());
	wiki.addTiddlers(extraTiddlers || []);
	wiki.addTiddler(tiddler);
	var output = wiki.filterTiddlers("[["+tiddler.title+"]relink:occurrences["+fromTitle+"]]");
	expect(output).toEqual(expectedArray);
};

describe('filter: occurrences', function() {

it("works on empty reports", function() {
	test({text: "This text has no links"}, []);
});

it("transcludes", function() {
	test({text: "Reference {{from}} stuff"}, ["{{}}"]);
	test({text: "{{from||template}}"}, ["{{||template}}"]);
	test({text: "{{other||from}}"}, ["{{other||}}"]);
	test({text: "{{from!!field}}"}, ["{{!!field}}"]);
	test({text: "{{from##index}}"}, ["{{##index}}"]);
	test({text: "{{from!!field||template}}"}, ["{{!!field||template}}"]);

	// Multiples allowed
	test({text: "{{from!!F||from}}"}, ["{{!!F||from}}", "{{from!!F||}}"]);
});

it("prettylinks", function() {
	test({text: "Text [[from]] stuff"}, ["[[from]]"]);
	test({text: "[[Caption|from]]"}, ["[[Caption]]"]);
	// Preserve whitespace. Newlines are illegal, so don't worry about them.
	test({text: "[[Caption |from]]"}, ["[[Caption ]]"]);
});

it("wikiLinks", function() {
	test({text: "Text WikiFrom stuff", from: "WikiFrom"}, ["~WikiFrom"]);
});

it("html", function() {
	test({text: "<$link to='from' />"}, ["<$link to />"]);
	test({text: "<$text text={{from}} />"}, ["<$text text={{}} />"]);
	test({text: "<$text text={{from!!F}} />"}, ["<$text text={{!!F}} />"]);
	test({text: "<$list filter='from' />"}, ["<$list filter />"]);
	test({text: "<$list filter='[tag[from]]' />"}, ['<$list filter="[tag[]]" />']);
	test({text: "<$A ref='from' />"}, ['<$A ref />'],
		[utils.attrConf("$A", "ref", "reference")]);
	test({text: "<$A ref='from!!field' />"}, ['<$A ref="!!field" />'],
		[utils.attrConf("$A", "ref", "reference")]);

	// Multiples
	test({text: "<$link to='from' tooltip={{from}} />"},
	     ["<$link to />", "<$link tooltip={{}} />"]);
	test({text: "<$text text={{{from [tag[from]]}}} />"},
	     ["<$text text={{{}}} />", "<$text text={{{[tag[]]}}} />"]);
});

it("macrocall", function() {
	function testMacro(text, expected) {
		var def = "\\define test(title, filter) stuff\n";
		test({text: def + text}, expected, [
			utils.macroConf("test", "title", "title"),
			utils.macroConf("test", "ref", "reference"),
			utils.macroConf("test", "filt", "filter")]);
	};
	testMacro("<<test title:from>>", ["<<test title>>"]);
	testMacro("<<test from>>", ["<<test title>>"]);
	testMacro("<<test filt:'[tag[from]]'>>", ['<<test filt: "[tag[]]">>']);
	testMacro("<<test filt:'from'>>", ['<<test filt>>']);

	// Multiples
	testMacro("<<test from filt:'[[from]]'>>", ["<<test title>>", "<<test filt>>"]);
	testMacro("<<test from>>\n<<test from>>", ["<<test title>>", "<<test title>>"]);
});

it("images", function() {
	test({text: "[img[from]]"}, ["[img[]]"]);
	test({text: "[img height={{from}} [else]]"}, ["[img height]"]);
	test({text: "[img class={{from}} [else]]"}, ["[img class]"]);
	// Both are recorded separately
	test({text: "[img height={{from}} [from]]"},["[img height]","[img[]]"]);
});

it("filteredtranscludes", function() {
	test({text: "{{{from}}}"}, ["{{{}}}"]);
	test({text: "{{{[tag[from]]}}}"}, ["{{{[tag[]]}}}"]);
	test({text: "{{{from ||template}}}"}, ["{{{||template}}}"]);
	test({text: "{{{[tag[else]] ||from}}}"}, ["{{{[tag[else]] ||}}}"]);
	test({text: "{{{from||from}}}"}, ["{{{||from}}}", "{{{from||}}}"]);
});

it("pragmas", function() {
	test({text: "\\import [tag[from]]\n"}, ["\\import [tag[]]"]);
	test({text: "\\define relink-1() from\n"}, ["\\define relink-1()"]);
	test({text: "\\define relink-filter-1() [tag[from]]\n"}, ["\\define relink-filter-1() [tag[]]"]);
	test({text: "\\define relink-list-1() A from\n"}, ["\\define relink-list-1()"]);
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
	function testFilter(text, expected) {
		test({type: "text/x-tiddler-filter", text: text}, expected);
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

	// Multiples
	testFilter("from [tag[from]oper{from}]", ["", "[tag[]]", "[oper{}]"]);
});

});