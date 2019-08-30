/*\

Tests the new relinking wiki methods.

\*/

var utils = require("test/utils");
var relink = utils.relink;
var operatorConf = utils.operatorConf;

describe("filter fields", function() {

function testFilter(filter, expected, options) {
	[filter, expected, options] = utils.prepArgs(filter, expected, options);
	options.wiki.addTiddlers([
		utils.fieldConf("customFilter", "filter"),
		operatorConf("title"),
		operatorConf("tag")
	]);
	var t = relink({customFilter: filter}, options);
	expect(t.fields.customFilter).toBe(expected);
};

it('relinks and logs', function() {
	var log = [];
	testFilter("A [[from here]] B", {log: log});
	expect(log).toEqual(["Renaming 'from here' to 'to there' in customFilter field of tiddler 'test'"]);
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

it('removed spaces', function() {
	testFilter("A [[from here]] B", "A to B",{to: 'to'});
	testFilter("A [[from here]]B", "A to B",{to: 'to'});
	testFilter("A[[from here]] B", "A to B",{to: 'to'});
	testFilter("[[from here]] B", "to B",{to: 'to'});
	testFilter("A [[from here]]", "A to",{to: 'to'});
	testFilter("[[from here]]", "to",{to: 'to'});
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

// In theory, we could have support for this, but not now.
it('ignores transclusion', function() {
	testFilter("A [title{from}] B", {ignored: true, from: "from"});
	testFilter("A [{from}] B", {ignored: true, from: "from"});
});

it('field:title operator', function() {
	testFilter("A [field:title[from here]] B");
});

it('tag operator', function() {
	testFilter("A [tag[from here]] B");
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
