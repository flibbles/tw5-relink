/*\
tags: $:/tags/test-spec
title: test/filter.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/

var relink = require("test/utils").relink;

describe("filter fields", function() {

function testFilter(filter, expected, options) {
	var title = "$:/config/flibbles/relink/fields/customFilter";
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: title, text: "filter"});
	options = options || {};
	options.wiki = wiki;
	var t = relink({customFilter: filter}, options);
	expect(t.fields.customFilter).toBe(expected);
};

it('relinks and logs', function() {
	var log = [];
	testFilter("A [[from here]] B", 'A [[to there]] B', {log: log});
	expect(log).toEqual(["Renaming customFilter operand 'from here' to 'to there' of tiddler 'test'"]);
});

it('quotes', function() {
	testFilter("A 'from here' B", "A 'to there' B");
	testFilter('A "from here" B', 'A "to there" B');
});

it('nonquotes', function() {
	testFilter("A from B", "A to B", {from: 'from', to: 'to'});
});

it('keeps brackets', function() {
	testFilter("A [[from]] B", "A [[to]] B", {from: 'from', to: 'to'});
});

it('added spaces', function() {
	testFilter("A from B", "A [[to there]] B",{from: 'from'});
	testFilter("from", "[[to there]]",{from: 'from'});
});

it('removed spaces', function() {
	testFilter("A [[from here]] B", "A to B",{to: 'to'});
	testFilter("A [[from here]]B", "A [[to]]B",{to: 'to'});
	testFilter("A[[from here]] B", "A[[to]] B",{to: 'to'});
	testFilter("[[from here]] B", "to B",{to: 'to'});
	testFilter("A [[from here]]", "A to",{to: 'to'});
	testFilter("[[from here]]", "to",{to: 'to'});
});

it('multiples', function() {
	testFilter("A [[f]] f B", 'A [[to there]] [[to there]] B', {from: "f"});
});

it('runs', function() {
	testFilter("[tag[a][a]has[a]]", '[tag[a][to there]has[a]]', {from: "a"});
});

it('title operator', function() {
	testFilter("A [title[from here]] B", 'A [title[to there]] B');
	testFilter("A [title[from]] B", 'A [title[to there]] B',{from: 'from'});
});

it('ignores other operators', function() {
	testFilter("A [has[from here]] B", 'A [has[from here]] B');
	testFilter("A [field:other[from here]] B", 'A [field:other[from here]] B');
});

it('ignores variables', function() {
	testFilter("A [title<from>] B", 'A [title<from>] B', {from: "from"});
	testFilter("A [<from>] B", 'A [<from>] B', {from: "from"});
});

it('ignores regular expressions', function() {
	testFilter("A [title/from/] B", 'A [title/from/] B', {from: "from"});
	testFilter("[regexp/rxp/] [[from here]] B", '[regexp/rxp/] [[to there]] B');
});

// In theory, we could have support for this, but not now.
it('ignores transclusion', function() {
	testFilter("A [title{from}] B", 'A [title{from}] B', {from: "from"});
	testFilter("A [{from}] B", 'A [{from}] B', {from: "from"});
});

it('field:title operator', function() {
	testFilter("A [field:title[from here]] B", 'A [field:title[to there]] B');
});

});
