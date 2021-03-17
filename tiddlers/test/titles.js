/*\

Tests relinking titles of other tiddlers.

\*/

var utils = require('test/utils');

function test(title, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const wiki = options.wiki || new $tw.Wiki();
	wiki.addTiddler({title: title, text: title});
	expect(utils.getReport(title, wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(wiki.getTiddler(expected)).not.toBeUndefined();
	expect(utils.getText(expected, wiki)).toEqual(title);
};

function disabler(title, value) {
	if (value === undefined) {
		value = 'disabled';
	}
	return {title: '$:/config/flibbles/relink-titles/disabled/' + title,
	        text: value};
};

function dirDisabler(value) {
	return disabler('$:/plugins/flibbles/relink-titles/rules/directory', value);
};

describe('titles', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it("works at all", function() {
	test('from here/subdir', 'to there/subdir', ['title: ./subdir']);
});

it("ignores unrelated tiddlers", function() {
	test('from here now/nothing', 'from here now/nothing', undefined);
	expect(console.log).not.toHaveBeenCalled();
});

it("can install 3rd party filters", function() {
	test('relink-title-test/here', 'relink-title-test/to there', ['title'], {from: '$:/relink-title'});
});

it("can disable installed filters", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(dirDisabler());
	test('from here/subdir', 'from here/subdir', undefined, {wiki: wiki});
	// but it can also be reenabled
	wiki.addTiddler(dirDisabler('enabled'));
	test('from here/subdir', 'to there/subdir', ['title: ./subdir'], {wiki: wiki});
});

it('can have blank disable setting', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler(dirDisabler(''));
	test('from here/subdir', 'to there/subdir', ['title: ./subdir'], {wiki: wiki});
});

it("doesn't infinitely loop over tiddlers", function() {
	// The resulting tiddler from this would be applicable for renaming,
	// thus it might rename ad-infinitum if it doesn't check itself.
	test('from/from/from/from/subdir',
	     'from/from/from/subdir', ['title: ./from/from/subdir'],
	     {from: 'from/from', to: 'from'});
	expect(console.log).toHaveBeenCalledTimes(1);
});

it("doesn't wipe the content of changed tiddler", function() {
	var wiki = new $tw.Wiki(),
		options = {};
	wiki.addTiddlers([
		{title: 'from here'},
		{title: 'from here/path'},
		{title: 'from here/path/end', text: 'Not clobbered'}]);
	wiki.relinkTiddler('from here', 'to there', options);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path'");
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path/end'");
	console.log.calls.reset();

	// Now we do it again, but manually calling relink without options, because
	// it's the options field where we cache the info to not clobber tiddlers.
	wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'from here'},
		{title: 'from here/path'},
		{title: 'from here/path/end', text: 'Not clobbered'}]);
	wiki.relinkTiddler('from here', 'to there');
	expect(utils.getText('to there/path/end', wiki)).toBe('Not clobbered');
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path'");
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path/end'");
});

it("doesn't clobber existing tiddlers", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'new/file', text: 'original text'});
	const fails = utils.collectFailures(function() {
		test('old/file', 'old/file', ['title: ./file'],
		     {wiki: wiki, from: 'old', to: 'new'});
	});
	expect(utils.getText('new/file', wiki)).toBe('original text');
	expect(fails.length).toBe(1);
});

it("doesn't override other changes with nested renames", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'from/path', text: '[[from/path/end]];'},
		{title: 'from/path/end', text: '[[from/path]].'}]);
	test('A', 'A', undefined, {wiki: wiki, from: 'from', to: 'to'});
	expect(utils.getText('to/path', wiki)).toBe('[[to/path/end]];');
	expect(utils.getText('to/path/end', wiki)).toBe('[[to/path]].');
});

it("doesn't rename two tiddlers to the same thing", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'relink-title-test/A', text: 'I was A'},
		{title: 'relink-title-test/B', text: 'I was B'}]);
	const fails = utils.collectFailures(function() {
		wiki.renameTiddler('$:/relink-title', 'new');
	});
	expect(fails.length).toBe(1);
	expect(utils.getText('relink-title-test/new', wiki)).toBe('I was A');
});

it("doesn't make same-name changes during live relinking", function() {
	test('relink-title-test/same', 'relink-title-test/same', ['title'], {from: '$:/relink-title', to: 'same'});
	expect(console.log).not.toHaveBeenCalled();
});

it("handles indexer and non-existent tiddlers", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'dir/file'});
	utils.getReport('dir', wiki);
	// If dir didn't exist before, we may have cached with it not included
	// in the references report.
	wiki.addTiddler({title: 'dir'});
	expect(utils.getReport('dir/file', wiki)).toEqual({dir: ['title: ./file']});
});

it("handles indexer and rule settings changes", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([{title: 'dir/file'}, {title: 'dir'}]);
	expect(utils.getReport('dir/file', wiki)).toEqual({dir: ['title: ./file']})
	wiki.addTiddler(dirDisabler());
	expect(utils.getReport('dir/file', wiki)).toEqual({})
	// And then it can be reenabled
	wiki.addTiddler(dirDisabler('enabled'));
	expect(utils.getReport('dir/file', wiki)).toEqual({dir: ['title: ./file']})
});

});
