/*\

Tests the orphans filter.

\*/

var utils = require("test/utils");

describe('filter: orphans', function() {

it('works with standard indexer', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'A', text: 'anything'},
		{title: 'B', text: '[[C]]'},
		{title: 'C', text: 'anything'}]);
	expect(wiki.filterTiddlers('[relink:orphans[]]')).toEqual(['A', 'B']);
});

it('works with backup indexer', function() {
	const wiki = new $tw.Wiki({enableIndexers: []});
	wiki.addTiddlers([
		{title: 'A', text: 'anything'},
		{title: 'B', text: '[[C]]'},
		{title: 'C', text: 'anything'}]);
	expect(wiki.filterTiddlers('[relink:orphans[]]')).toEqual(['A', 'B']);
});

// Issue #43
it('can find images', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "image.svg", type: "image/svg+xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" version="1.1"><circle r="4" cx="4" cy="4" /></svg>'});
	expect(wiki.filterTiddlers("[relink:orphans[]!is[system]is[image]]")).toEqual(['image.svg']);

	wiki = new $tw.Wiki();
	wiki.addTiddler({title: "image.png", type: "image/png", text: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='});
	expect(wiki.filterTiddlers("[relink:orphans[]!is[system]is[image]]")).toEqual(['image.png']);

});

});

