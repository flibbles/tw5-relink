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

});

