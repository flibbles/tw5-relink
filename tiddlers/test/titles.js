/*\

Tests relinking titles of other tiddlers.

\*/

var utils = require('./utils');

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
	return {title: '$:/config/flibbles/relink-titles/relink/' + title,
	        text: value};
};

function dirDisabler(value) {
	return disabler('$:/plugins/flibbles/relink-titles/rules/directory', value);
};

describe('titles', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

describe('directories', function() {

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
	function test(wiki, relinkCall) {
		var wiki = new $tw.Wiki(),
			options = {};
		wiki.addTiddlers([
			{title: 'from here'},
			{title: 'from here/path'},
			{title: 'from here/path/end', text: 'Not clobbered'}]);
		// Pre-cache the results of the rename
		utils.wouldChange(wiki, 'from here', 'to there');
		relinkCall(wiki);
		wiki.relinkTiddler('from here', 'to there', options);
		expect(console.log).toHaveBeenCalledTimes(2);
		expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path'");
		expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'from here/path/end'");
		console.log.calls.reset();
	};
	test(new $tw.Wiki(), (wiki) => wiki.relinkTiddler('from here', 'to there', {}));
	// Now we do it again, but manually calling relink without options, because
	// it's the options field where we cache the info to not clobber tiddlers.
	test(new $tw.Wiki(), (wiki) => wiki.relinkTiddler('from here', 'to there'));
	// Now we do it all over again, but without indexers
	test(new $tw.Wiki({enableIndexers: []}), (wiki) => wiki.relinkTiddler('from here', 'to there', {}));
	test(new $tw.Wiki({enableIndexers: []}), (wiki) => wiki.relinkTiddler('from here', 'to there'));
});

it("doesn't clobber existing tiddlers", function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'new/file', text: 'original text'});
	utils.spyFailures(spyOn);
	test('old/file', 'old/file', ['title: ./file'],
		 {wiki: wiki, from: 'old', to: 'new'});
	expect(utils.getText('new/file', wiki)).toBe('original text');
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("doesn't override related changes to the same tiddler", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'a-test', text: "{{from}} {{from/path}}"},
		{title: 'from'},
		{title: 'from/path'},
		{title: 'z-test', text: "{{from}} {{from/path}}"}]);
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('from')).toBe(false);
	expect(wiki.tiddlerExists('from/path')).toBe(false);
	expect(wiki.tiddlerExists('to')).toBe(true);
	expect(wiki.tiddlerExists('to/path')).toBe(true);
	// We put in two tests because alphabetical order might matter
	// It changes the order things are updated.
	expect(wiki.getTiddlerText('a-test')).toBe('{{to}} {{to/path}}');
	expect(wiki.getTiddlerText('z-test')).toBe('{{to}} {{to/path}}');
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

it("supports title rules returning failure", function() {
	var wiki = new $tw.Wiki();
	const text = 'renaming this to "fail" causes a failure';
	wiki.addTiddlers([
		{title: 'relink-title-test/A', text: text}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('$:/relink-title', 'fail');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.getText('relink-title-test/A', wiki)).toBe(text);
});

it("doesn't rename two tiddlers to the same thing", function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'relink-title-test/A', text: 'I was A'},
		{title: 'relink-title-test/B', text: 'I was B'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('$:/relink-title', 'new');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.getText('relink-title-test/new', wiki)).toBe('I was A');
});

it("may make same-name changes during live relinking", function() {
	// This shouldn't happen unless someone makes a rule that does it
	// accidentally, but I don't see why I should bother worrying about it
	// nothing will change, and no other part of Relink makes checks like this.
	test('relink-title-test/same', 'relink-title-test/same', ['title'], {from: '$:/relink-title', to: 'same'});
	expect(console.log).toHaveBeenCalledTimes(1);
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

it('reference to super-directories are considered soft', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: 'my/directory/test'});
	expect(wiki.filterTiddlers("[[my/directory/test]relink:references[]]")).toEqual(['my', 'my/directory']);
	expect(wiki.filterTiddlers("[[my/directory/test]relink:references:hard[]]")).toEqual([]);
});

});

describe('lookup', function() {

function patterns(string) {
	return {title: "$:/config/flibbles/relink-titles/lookup/patterns", text: string};
};

it('handles multiple patterns', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("A-$(currentTiddler)$\nB-$(currentTiddler)$-C"),
		{title: "A-from", text: "anything"},
		{title: "B-from-C", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('A-from', wiki)).toEqual({from: ['title: A-...']});
	expect(utils.getReport('B-from-C', wiki)).toEqual({from: ['title: B-...-C']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('A-from')).toBe(false);
	expect(wiki.tiddlerExists('B-from-C')).toBe(false);
	expect(wiki.tiddlerExists('A-to')).toBe(true);
	expect(wiki.tiddlerExists('B-to-C')).toBe(true);
});

it('handles escape characters', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("$:/[prefix]/$(currentTiddler)$"),
		dirDisabler(),
		{title: "$:/[prefix]/from", text: "anything"},
		{title: "aaa"},
		{title: "from"},
		{title: "zzz"}]);
	expect(utils.getReport('$:/[prefix]/from', wiki)).toEqual({from: ['title: $:/[prefix]/...']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('$:/[prefix]/from')).toBe(false);
	expect(wiki.tiddlerExists('$:/[prefix]/to')).toBe(true);
	expect(console.log).toHaveBeenCalledTimes(1);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from' to 'to' in '$:/[prefix]/from'");
});

it('handles patterns with multiple placeholders', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("A-$(currentTiddler)$-$(*)$-$(currentTiddler)$-C"),
		{title: "A-from-from-from-C", text: "will update"},
		{title: "A-from-from-other-C", text: "stays put"},
		{title: "A-other-from-from-C", text: "stays put"},
		{title: "A-other-from-other-C", text: "matches something"},
		{title: "from"},
		{title: "other"}]);
	expect(utils.getReport('A-from-from-from-C', wiki)).toEqual({from: ['title: A-...-from-...-C']});
	expect(utils.getReport('A-from-from-other-C', wiki)).toEqual({});
	expect(utils.getReport('A-other-from-from-C', wiki)).toEqual({});
	expect(utils.getReport('A-other-from-other-C', wiki)).toEqual({other: ['title: A-...-from-...-C']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('A-from-from-from-C')).toBe(false);
	expect(wiki.tiddlerExists('A-to-from-to-C')).toBe(true);
	// And the untouched ones?
	expect(wiki.tiddlerExists('A-from-from-other-C')).toBe(true);
	expect(wiki.tiddlerExists('A-other-from-from-C')).toBe(true);
	expect(wiki.tiddlerExists('A-other-from-other-C')).toBe(true);
	expect(console.log).toHaveBeenCalledTimes(1);
});

it('handles empty pattern list', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns(""),
		{title: "from", text: "anything"}]);
	expect(utils.getReport('from', wiki)).toEqual({});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('from')).toBe(false);
	expect(wiki.tiddlerExists('to')).toBe(true);
	expect(console.log).toHaveBeenCalledTimes(0);
});

it('trims whitespace out of patterns', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("  prefix-$(currentTiddler)$   "),
		{title: "prefix-from", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('prefix-from', wiki)).toEqual({from: ['title: prefix-...']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('prefix-from')).toBe(false);
	expect(wiki.tiddlerExists('prefix-to')).toBe(true);
	expect(console.log).toHaveBeenCalledTimes(1);
});

it('ignores patterns without the placeholder', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("prefix"),
		{title: "prefix", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('prefix', wiki)).toEqual({});
});

it('allows wildcards', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("prefix-$(*)$-$(currentTiddler)$"),
		{title: "prefix-cat-from", text: "anything"},
		{title: "prefix-dog-from", text: "anything"},
		{title: "prefix--from", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('prefix-cat-from', wiki)).toEqual({from: ['title: prefix-cat-...']});
	expect(utils.getReport('prefix-dog-from', wiki)).toEqual({from: ['title: prefix-dog-...']});
	expect(utils.getReport('prefix--from', wiki)).toEqual({from: ['title: prefix--...']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('prefix-cat-from')).toBe(false);
	expect(wiki.tiddlerExists('prefix-cat-to')).toBe(true);
	expect(wiki.tiddlerExists('prefix-dog-from')).toBe(false);
	expect(wiki.tiddlerExists('prefix-dog-to')).toBe(true);
	expect(wiki.tiddlerExists('prefix--from')).toBe(false);
	expect(wiki.tiddlerExists('prefix--to')).toBe(true);
	expect(console.log).toHaveBeenCalledTimes(3);
});

it('updating config tiddler text too', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("$(currentTiddler)$-$(*)$"),
		{title: "from-suffix", text: "Link to [[from]]"},
		{title: "from"}]);
	expect(utils.getReport('from-suffix', wiki)).toEqual({from: ['[[from]]', 'title: ...-suffix']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('from-suffix')).toBe(false);
	expect(wiki.tiddlerExists('to-suffix')).toBe(true);
	expect(wiki.getTiddlerText('to-suffix')).toBe('Link to [[to]]');
	expect(console.log).toHaveBeenCalledTimes(1);
});

it('earlier rules take precedent', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("$(currentTiddler)$-from\n$(*)$-$(currentTiddler)$"),
		{title: "from-from"},
		{title: "else-from"}]);
	expect(utils.getReport('from-from', wiki)).toEqual({
		from: ['title: ...-from', 'title: from-...']});
	expect(utils.getReport('else-from', wiki)).toEqual({
		else: ['title: ...-from'],
		from: ['title: else-...']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('from-from')).toBe(false);
	expect(wiki.tiddlerExists('to-from')).toBe(true);
	expect(wiki.tiddlerExists('else-from')).toBe(false);
	expect(wiki.tiddlerExists('else-to')).toBe(true);
});

it('matches multiple wildcards', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("$(*)$-$(currentTiddler)$-$(*)$"),
		{title: "cats-from-dogs", text: "anything"},
		{title: "cats-from-from-dogs", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('cats-from-dogs', wiki)).toEqual({from: ['title: cats-...-dogs']});
	expect(utils.getReport('cats-from-from-dogs', wiki)).toEqual({from: ['title: cats-from-...-dogs']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('cats-from-dogs')).toBe(false);
	expect(wiki.tiddlerExists('cats-to-dogs')).toBe(true);
	// This is pretty ambiguous, so I won't actually assert what it
	// should have become, because not even I know.
	expect(wiki.tiddlerExists('cats-from-from-dogs')).toBe(false);
});

it('does not conflict with directory rule', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		patterns("$(currentTiddler)$/data"),
		{title: "from/data", text: "anything"},
		{title: "from"}]);
	expect(utils.getReport('from/data', wiki)).toEqual({from: ['title: ./data', 'title: .../data']});
	wiki.renameTiddler('from', 'to');
	expect(wiki.tiddlerExists('from/data')).toBe(false);
	expect(wiki.tiddlerExists('to/data')).toBe(true);
	expect(wiki.getTiddlerText('to/data')).toBe('anything');
	expect(console.log).toHaveBeenCalledTimes(1);
});

});

});
