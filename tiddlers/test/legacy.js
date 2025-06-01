/*\

Tests to make sure old modules still work

\*/

var utils = require("./utils");

describe('legacy', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it('supports oldstyle relinkoperators', function() {
	var results = utils.relink({'field.ref': 'from here', 'field.refs': '[[from here]]'});
	expect(results.tiddler.fields['field.ref']).toBe('to there');
	expect(results.tiddler.fields['field.refs']).toBe('[[to there]]');
});

it('supports oldstyle relinktextoperators', function() {
	var results = utils.relink({type: 'text/x-legacy-text', text: 'from here'});
	expect(results.tiddler.fields.text).toBe('to there');
});

it('supports oldstyle wikitext rules', function() {
	var results = utils.relink({text: '[?[Link|?c]]'}, {from: '?c'});
	expect(results.tiddler.fields.text).toBe('[?[Link|?c]]');
});

});
