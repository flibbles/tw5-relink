/*\

Tests the documented wikimethods.

\*/

var utils = require("./utils");

describe('wikimethods', function() {

describe('getTiddlerRelinkReferences', function() {

it('returns undefined if no exist', function() {
	const wiki = new $tw.Wiki();
	var results = wiki.getTiddlerRelinkReferences('noexist');
	expect(results).toBeUndefined();
});

it('returns empty object if tiddler does exist', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'empty', text: ''});
	var results = wiki.getTiddlerRelinkReferences('empty');
	expect(results).toEqual({});
});

});

describe('getTiddlerRelinkBackreferences', function() {

it('returns empty object if tiddler does not exist', function() {
	const wiki = new $tw.Wiki();
	var results = wiki.getTiddlerRelinkBackreferences('noexist');
	expect(results).toEqual({});
});

});

describe('getRelinkableTitles', function() {

// Maybe this should go in hackability.js
it('updates to-update cache on any change', function() {
	var wiki = new $tw.Wiki();
	expect(wiki.getRelinkableTitles().indexOf("new")).toBeLessThan(0);
	wiki.addTiddler({title: "new"});
	expect(wiki.getRelinkableTitles()).toContain("new");

	wiki.addTiddler(utils.toUpdateConf("[tag[relink]]"));
	expect(wiki.getRelinkableTitles().length).toEqual(0);
	wiki.addTiddler({title: "next", tags: "relink"});
	expect(wiki.getRelinkableTitles()).toContain("next");
});

});

});
