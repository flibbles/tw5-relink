/*\

Tests the hackability of Relink.
These are configuration options defined in the documentation.

\*/

var utils = require("./utils");

describe('hackability', function() {

function testConfig(options, /* tiddler objects */) {
	var text = "[[from here]]", expected;
	var tiddlerObj = Object.assign({text: text}, options);
	[text, expected, options] = utils.prepArgs(text, options);
	options.wiki.addTiddlers(Array.prototype.slice.call(arguments, 1));
	var results = utils.relink(tiddlerObj, options);
	expect(results.tiddler.fields.text).toEqual(expected);
	return results;
};

function touchModifyConf(bool) {
	return {title: "$:/config/flibbles/relink/touch-modify", text: bool};
};

beforeEach(function() {
	spyOn(console, 'log');
});

it("respects touch modify settings", function() {
	function test(conf) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: '[[from here]]'});
		if (conf) {
			wiki.addTiddler(conf);
		}
		wiki.renameTiddler('from here', 'to there');
		return wiki.getTiddler('test').fields.modified;
	};
	// No config (only possible with custom wiki objects
	expect(test()).toBeUndefined();
	// Yes config (the shadow default)
	expect(test(touchModifyConf('yes'))).not.toBeUndefined();
	// No config (turned off)
	expect(test(touchModifyConf('no'))).toBeUndefined();
	// Sloppy yes
	expect(test(touchModifyConf('yes\n'))).not.toBeUndefined();
});

it('touches modify even if only fields are changed', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		touchModifyConf("yes"),
		utils.fieldConf('tags', 'list'),
		{title: 'test', tags: '[[from here]]'}]);
	wiki.renameTiddler('from here', 'to there');
	expect($tw.utils.hop(wiki.getTiddler('test').fields, 'modified')).toBe(true);
});

it('to-update handles various configurations', function() {
	function updatesTest(conf) {
		const wiki = new $tw.Wiki();
		wiki.addTiddler({title: 'test', text: '[[from here]]'})
		if (conf) wiki.addTiddler(utils.toUpdateConf(conf));
		wiki.renameTiddler('from here', 'to there');
		return wiki.getTiddler('test').fields.text;
	};
	expect(updatesTest()).toBe('[[to there]]');
	expect(updatesTest('[all[]]')).toBe('[[to there]]');
	expect(updatesTest('[prefix[te]]')).toBe('[[to there]]');
	expect(updatesTest('[!prefix[te]]')).toBe('[[from here]]');
	expect(updatesTest('test noexist')).toBe('[[to there]]');
});

});
