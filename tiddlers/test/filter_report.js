/*\

Tests the report filter.

\*/

var utils = require("./utils");

describe('filter: references', function() {

it("standard reports of many tiddlers", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'A', text: '[[A]] {{B}} <$text text={{A}} /> and [[A]]'},
		{title: 'X', text: '[[C]], [[A]]'}]),
	expect(wiki.filterTiddlers('[[A]relink:references[]]')).toEqual(['A', 'B']);
	expect(wiki.filterTiddlers('[[B]relink:references[]]')).toEqual([]);
	// A should be last because of pushTop
	expect(wiki.filterTiddlers('[relink:references[]]')).toEqual(['B', 'C', 'A']);
});

it("empty reports", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: 'This has no links'},
		{title: 'A', text: 'This links to [[test]]'}]),
	expect(wiki.filterTiddlers('[[test]relink:references[]]')).toEqual([]);
});

it("nonexistent tiddlers", function() {
	const wiki = new $tw.Wiki();
	expect(wiki.filterTiddlers('[[noexist]relink:references[]]')).toEqual([]);
});

});

describe('filter: backreferences', function() {

it("works on standard reports of many tiddlers", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'A', text: '[[X]] [[Z]]'},
		{title: 'B', text: '[[X]]'},
		{title: 'C', text: '[[Y]]'},
		{title: 'X', text: '[[C]], [[A]]'}]),
	expect(wiki.filterTiddlers('[[X]relink:backreferences[]]')).toEqual(['A', 'B']);
	// A should be last because of pushTop
	expect(wiki.filterTiddlers('[enlist[X Y Z]relink:backreferences[]]')).toEqual(['B', 'C', 'A']);
});

it("works on empty reports", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: 'This has no links'},
		{title: 'A', text: 'This links to [[test]]'}]),
	expect(wiki.filterTiddlers('[[A]relink:backreferences[]]')).toEqual([]);
});

it("nonexistent tiddlers", function() {
	const wiki = new $tw.Wiki();
	expect(wiki.filterTiddlers('[[noexist]relink:backreferences[]]')).toEqual([]);
});

});

describe('filter: report', function() {

it("allows duplicate blurbs", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'A', text: '[[B]] {{B}} [[B]] [[C]]'},
		{title: 'B', text: 'nothing interestin'}]),
	expect(wiki.filterTiddlers('[[A]relink:report[B]]')).toEqual(['[[B]]', '{{}}', '[[B]]']);
});

it("missing tiddler", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'A', text: '[[B]] {{B}}'},
		{title: 'B', text: 'nothing interestin'}]),
	expect(wiki.filterTiddlers('[[X]relink:report[B]]')).toEqual([]);
	expect(wiki.filterTiddlers('[[A]relink:report[X]]')).toEqual([]);
	expect(wiki.filterTiddlers('[[X]relink:report[Y]]')).toEqual([]);
});

it('can handle undefined blurb', function() {
	// This test relies on the undefinedRelinkOperator to function
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'test', 'undefined': 'A'});
	expect(wiki.filterTiddlers('[[test]relink:report[A]]')).toEqual(['']);
});

});
