/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");
var relink = utils.relink;
var operatorConf = utils.operatorConf;

describe("filter fields", function() {

function testFilter(filter, expected, options) {
	[filter, expected, options] = utils.prepArgs(filter, expected, options);
	options.wiki.addTiddler(utils.fieldConf("customFilter", "filter"));
	var results = relink({customFilter: filter}, options);
	expect(results.tiddler.fields.customFilter).toBe(expected);
	return results;
};

function testText(text, expected, options) {
	[text, expected, options] = utils.prepArgs(text, expected, options);
	var failCount = options.fails || 0;
	var results = utils.relink({text: text}, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	expect(results.fails.length).toEqual(failCount, "Incorrect number of failures");
};

it('relinks and logs', function() {
	var r = testFilter("A [[from here]] B");
	expect(r.log).toEqual(["Renaming 'from here' to 'to there' in customFilter field of tiddler 'test'"]);
});

it('quotes', function() {
	testFilter("A 'from here' B");
	testFilter('A "from here" B');
});

it('nonquotes', function() {
	testFilter("A from B", "A to B", {from: 'from', to: 'to'});
});

it('loses brackets even if unnecessarily there', function() {
	testFilter("A [[from]] B", "A to B", {from: 'from', to: 'to'});
});

it('added spaces', function() {
	testFilter("A from B", "A [[to there]] B",{from: 'from'});
	testFilter("from", "[[to there]]",{from: 'from'});
});

it('spaces around brackets', function() {
	testFilter("A [[from here]] B", "A to B",{to: 'to'});
	testFilter("A\n[[from here]]\nB", "A\nto\nB",{to: 'to'});
	testFilter("A [[from here]]B", "A to B",{to: 'to'});
	testFilter("A[[from here]] B", "A to B",{to: 'to'});
	testFilter("[[from here]] B", "to B",{to: 'to'});
	testFilter("A [[from here]]", "A to",{to: 'to'});
	testFilter("[[from here]]", "to",{to: 'to'});
	testFilter("A[[B]]C [[from here]]");
	testFilter("A [[from here]] B");
	testFilter("A\n[[from here]]\nB");
	testFilter("A[[from here]] B");
	testFilter("A [[from here]]B");
	testFilter("A[[from here]]B");
	testFilter("   [[from here]]   ");
	testFilter("A[[from here]]B", "A \"to [it's]\" B",{to: "to [it's]"});
	testFilter("A[[from here]]B", "A 'to [\"it\"]' B",{to: 'to ["it"]'});
});

it('multiples', function() {
	testFilter("A [[f]] f B", 'A [[to there]] [[to there]] B', {from: "f"});
});

it('runs', function() {
	testFilter("[get[a][a]has[a]]", '[get[a][to there]has[a]]',
	           {from: "a"});
});

it('title operator', function() {
	testFilter("A [title[from here]] B");
	testFilter("A [title[from]] B", {from: 'from'});
});

it('tricky titles', function() {
	testFilter("A [[from here]] B",     'A "a\' ]b" B',  {to: 'a\' ]b'});
	testFilter("A [[from here]] B",     "A 'a\" ]b' B",  {to: 'a\" ]b'});
	testFilter("A [[from here]] B",     "A a\"\'b B",   {to: 'a\"\'b'});
	testFilter("A [[from here]] B",     "A [[a\" \'b]] B",{to: 'a\" \'b'});
	testFilter("A [title[from here]] B","A [title[a\" \'b]] B", {to: 'a\" \'b'});
	testFilter("A [title[from here]] B","A [title[simple]] B", {to: 'simple'});
	testFilter('A "from here" B', 'A [[a\' \"b]] B', {to: 'a\' "b'});
	testFilter("A 'from here' B", 'A [[a\' \"b]] B', {to: 'a\' "b'});
});

it('supports expression prefixes', function() {
	testFilter("A +[[from here]] B");
	testFilter("A -from B", {from: "from", to: "to"});
	testFilter("[tag[A]] -from C", "[tag[A]] -'X[\"]Y' C", {from: "from", to: "X[\"]Y"});
	testFilter("A ~from B", "A ~[[to there]] B", {from: "from"});
	testFilter("A =[[from here]] B", "A =to B", {to: "to"});
	testFilter("A [[B]]+from", {from: "from", to: "to"});
	testFilter("A [[from here]]+B", "A to +B", {to: "to"});
});

it('supports operator negator on titles', function() {
	testFilter("A [![from here]]");
	testFilter("A [!title[from here]]");
	testFilter("A [tag[something]!title[from here]]");
	// Doesn't try to collapse the brackets or anything
	testFilter("A [![from here]]", {to: "to"});
});

it('ignores other operators', function() {
	testFilter("A [has[from here]] B", {ignored: true});
	testFilter("A [field:other[from here]] B", {ignored: true});
});

it('ignores variables', function() {
	testFilter("A [title<from>] B", {ignored: true, from: "from"});
	testFilter("A [<from>] B", {ignored: true, from: "from"});
});

it('ignores regular expressions', function() {
	testFilter("[regexp/rxp/] [[from here]] B");
	testFilter("A [title/from/] B", {ignored: true, from: "from"});
});

it('handles transclusion for all operands', function() {
	testFilter("A [title{from}] B", {from: "from"});
	testFilter("A [{from}] B", {from: "from"});
	testFilter("A [anything{from}] B", {from: "from"});
	testFilter("A [anything{from!!field}] B", {from: "from"});
	testFilter("A [anything{from##index}] B", {from: "from"});
	testFilter("[[Title]addsuffix{from!!field}]", {from: "from"});
});

it('field:title operator', function() {
	testFilter("A [field:title[from here]] B");
	testFilter("A [!field:title[from here]] B");
	testFilter("A [tag[something]!field:title[from here]] B");
});

it('tag operator', function() {
	testFilter("A [tag[from here]] B");
});

it('manages reference types as operands', function() {
	testFilter("A [list[from here]] B");
	testFilter("A [list[from here!!field]] B");
	testFilter("A [list[from here##index]] B");
});

it('ignores blank tag configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(operatorConf("empty", ""));
	testFilter("[[A]] [empty[A]]", "[[to there]] [empty[A]]", {from: "A", wiki: wiki});
});

it('ignores non-title tag configurations', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(operatorConf("bad", "eh?"));
	testFilter("[[A]] [bad[A]]", "[[to there]] [bad[A]]", {from: "A", wiki: wiki});
});

it('field failures', function() {
	function fails(filter, toTitle) {
		var options = {to: toTitle, ignored: true};
		var results = testFilter(filter, options);
		expect(results.fails.length).toEqual(1);
	};
	fails("[tag[from here]]", "brackets]there");
	fails("[[from here]]", "A\"bad'stupid]title");
	fails("[{from here}]", "A\"bad'stupid}title");
	fails("[tag{from here}]", "brackets}there");
	fails("[tag{from here!!field}]", "brackets}there");
});

it('resorts to placeholders when possible', function() {
	var ph = utils.placeholder;
	var to = "bad[]name";
	testText("\\import [tag[from here]prefix[A]]\n",
	         ph(1,to)+"\\import [tag<relink-1>prefix[A]]\n", {to: to});
	to = "worse[]\"\"\'\'name";
	testText("\\import [[from here]]\n",
	         ph(1,to)+"\\import [<relink-1>]\n", {to: to});
	testText("\\import from\n",
	         ph(1,to)+"\\import [<relink-1>]\n", {to: to, from: "from"});
	testText("\\import from\n",
	         ph(1,to)+"\\import [<relink-1>]\n", {to: to, from: "from"});
	testText("\\import +'from here'\n",
	         ph(1,to)+"\\import +[<relink-1>]\n", {to: to});
	testText("\\import [![from here]]\n",
	         ph(1,to)+"\\import [!<relink-1>]\n", {to: to});
});

/** This is legacy support. Originally, the value of the configuration tiddlers
 *  was set to "yes" because I didn't think it really mattered, but it turns
 *  out it may actually be other values one day, so I'm switching it to title
 *  sooner rather than later.
 */
it("but it doesn't ignore 'yes' configurations", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(operatorConf("good", "yes"));
	testFilter("[[A]] [good[A]]", {from: "A", wiki: wiki});
});

});
