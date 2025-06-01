/*\

Tests the fields

\*/

var utils = require("./utils");
var relink = utils.relink;

function testField(text, expected, report, options) {
	options = Object.assign({from: 'from here', to: 'to there'}, options);
	const field = options.field || 'test';
	const type = options.type !== undefined ? options.type : 'list';
	const wiki = options.wiki || new $tw.Wiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddlers([
		utils.fieldConf(field, type),
		{title: 'test', [field]: text}]);
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to);
	expect(wiki.getTiddler('test').fields[field]).toEqual(expected);
};

function testTags(value, expectedArray, report, options) {
	options = Object.assign({field: 'tags'}, options);
	return testField(value, expectedArray, report, options);
};

function testList(value, expectedArray, report, options) {
	options = Object.assign({field: 'list'}, options);
	return testField(value, expectedArray, report, options);
};

describe('fields', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

it("doesn't touch ineligible tiddlers", function() {
	const wiki = new $tw.Wiki();
	testTags("nothing here", ["nothing", "here"], undefined, {wiki: wiki});
	expect($tw.utils.hop(wiki.getTiddler('test').fields, 'modified')).toBe(false);
	results = testList("nothing here", ["nothing", "here"], undefined, {wiki: wiki});
	expect($tw.utils.hop(wiki.getTiddler('test').fields, 'modified')).toBe(false);
});

it('still relinks tags', function() {
	testTags("[[from here]] another", ['to there', 'another'], ['tags']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('still relinks lists', function() {
	var r = testList("[[from here]] other", ['to there', 'other'], ['list']);
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

// I can't actually prevent Tiddlywiki from doing this. I can't even tell
// if a list field _has_ repetition in _list_ fields. Might as well be
// consistent and make single reports defined behavior.
it('duplicates are removed by TiddlyWiki', function() {
	testList("[[from here]] A [[from here]]", ['to there', 'A'], ['list']);
	testField("[[from here]] A [[from here]]", "[[to there]] A", ['test'], {type: "list"});
});

it('relinks filter field', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler(utils.operatorConf('title'));
	testField("[title[from here]] stuff", "[title[to there]] stuff",
	          ['filter'],
	          {field: "filter", type: "filter", wiki: wiki});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('relinks references', function() {
	testField("from here", true, ['ref'], {field: "ref", type: "reference"});
	testField("from here!!stuff", true, ['ref: !!stuff'], {field: "ref", type: "reference"});
	testField("from here##ind", true, ['ref: ##ind'], {field: "ref", type: "reference"});
});

it('lists work with strange titles', function() {
	function works(title, wrapped) {
		//var expected = wrapped ? "A [["+title+"]] B" : "A "+title+" B";
		var expected = ["A", title, "B"];
		testList("A [[from here]] B", expected, ['list'], {to: title});
	};
	works("weird]]");
	works("weird ]]");
	works("weird ]]");
	works("weird[[");
	works("weird [[");
	works("X[[Z]]Y");
	works("X [[ Z ]]Y", true);

	var thisFuckingValue = "weird ]]\xA0value";
	works(thisFuckingValue);
	// Just got to test that the crazy value is actually something
	// Tiddlywiki supports.  Seriously, when do these come up?
	var list = ["A", thisFuckingValue, "A tiddler", "B"];
	var strList = $tw.utils.stringifyList(list);
	var output = $tw.utils.parseStringArray(strList);
	expect(output).toEqual(list);
});

it('lists recognize impossibly strange titles', function() {
	utils.spyFailures(spyOn);
	function fails(title) {
		var options = {to: title, field: "example", type: "list"};
		var list = "A [[from here]] B";
		utils.failures.calls.reset();
		testField(list, false, ['example'], options);
		expect(utils.failures).toHaveBeenCalledTimes(1);
	};
	fails("X and]] Y");
	fails("]] X");
});

it("lists don't fail when fromTitle not in list", function() {
	var options = {to: "X and]] Y", field: 'list'};
	utils.spyFailures(spyOn);
	testField("A B C", ["A", "B", "C"], undefined, options);
	expect(utils.failures).not.toHaveBeenCalled();
});

it('handles failures across multiple fields', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		utils.fieldConf('A', 'list'),
		utils.fieldConf('B', 'list'),
		utils.fieldConf('C'),
		{title: 'test', A: 'from', B: 'from', C: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'to]] here');
	expect(utils.failures).toHaveBeenCalledTimes(1);
	var fields = wiki.getTiddler('test').fields;
	expect(fields.A).toBe('from');
	expect(fields.B).toBe('from');
	expect(fields.C).toBe('to]] here');
});

/** I have chosen not to respect dontRenameInTags and dontRenameInLists
 *  because they are literally never used anywhere. Now you can just use
 *  the configuration.
 */
/*
it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "[[from here]] another"}, {dontRenameInTags: true});
	expect(t.fields.tags.slice()).toEqual(['from here', 'another']);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "[[from here]] another"}, {dontRenameInLists: true});
	expect(t.fields.list.slice()).toEqual(['from here', 'another']);
});
*/

it('relinks custom field', function() {
	testField("from here", true, ['test'], {type: 'title'});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('relinks custom list', function() {
	testField("A [[from here]] B", true, ['test'], {type: "list"});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('relinks custom wikitext', function() {
	testField("from here [[from here]] {{from here}}",
	          'from here [[to there]] {{to there}}',
	          ['test: [[from here]]', 'test: {{}}'], {type: "wikitext"});
	expect(console.log).toHaveBeenCalledWith("Renaming 'from here' to 'to there' in 'test'");
});

it('ignores blank custom field settings', function() {
	testField("ignore", false, undefined, {type: "", from: "ignore"});
});

it('ignores unrecognized custom field settings', function() {
	testField("ignore", false, undefined, {type: "bizarre", from: "ignore"});
});

it('removes unnecessary brackets in custom list', function() {
	// The decision to remove brackets may be controversial, but since
	// list and tag automatically remove brackets on their own, I might
	// as well be consistent.
	testField("A [[from here]] B", "A to B", ['test'], {to: "to"});
	testField("A [[from]] B", "A to B", ['test'], {from:"from", to:"to"});
});

/**This is legacy support. The 'title' field type used to be called 'field'
 * But field was unhelpful. What's it mean when a field is set to 'field'?
 */
it('supports "field" field settings', function() {
	testField("from here", true, ['test'], {type: "field"});
});

/**It's important that fields can be undefined, since obviously most tiddlers
 * won't have the field.
 */
it("doesn't crash with missing any type of field", function() {
	function test(type) {
		const wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: 'test', text: 'stuff'},
			utils.fieldConf('field', type)]);
		expect(utils.getReport('test', wiki)).toEqual({});
		wiki.renameTiddler('from', 'to');
		expect(wiki.getTiddler('test').fields.field).toBeUndefined();
	};
	test('reference');
	test('title');
	test('list');
	test('filter');
	test('wikitext');
});

it("doesn't report plugin's list, since they're used differently", function() {
	var wiki = utils.addPlugin("testPlugin",
		[{title: 'testPlugin/readme', text: "This is readme text"}],
		{list: 'readme'});
	wiki.addTiddlers([
		utils.fieldConf('list', 'list'),
		{title: 'test', list: 'readme'}
	]);
	expect(utils.getBackreferences('readme', wiki)).toEqual({test: ['list']});
	utils.spyFailures(spyOn);
	wiki.renameTiddler('readme', 'new');
	expect(wiki.getTiddler('test').fields.list).toEqual(['new']);
	expect(wiki.getTiddler('testPlugin').fields.list).toEqual(['readme']);
	// There shouldn't be any errors
	expect(utils.failures).not.toHaveBeenCalled();
});

it("does report plugin's tags, since they're not used differently", function() {
	var wiki = utils.addPlugin("testPlugin",
		[{title: 'testPlugin/myTag', text: "This is a tag"}],
		{tags: 'myTag'});
	wiki.addTiddlers([
		utils.fieldConf('tags', 'list'),
		{title: 'test', tags: 'myTag'}
	]);
	expect(utils.getBackreferences('myTag', wiki)).toEqual({testPlugin: ['tags'], test: ['tags']});
	utils.spyFailures(spyOn);
	wiki.renameTiddler('myTag', 'new');
	expect(wiki.getTiddler('test').fields.tags).toEqual(['new']);
	// but it still doesn't relink
	expect(wiki.getTiddler('testPlugin').fields.tags).toEqual(['myTag']);
	// also, it warns about it
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['testPlugin']);
});

if ($tw.utils.compareVersions($tw.version, "5.2.0") >= 0) {
	it('handles fields with problematic characters', function() {
		testField('from here', true, ['back/slash'], {field: 'back/slash', type: 'title'});
		testField('from here', true, ['dollar$sign'], {field: 'dollar$sign', type: 'title'});
		testField('from here', true, ['Capital'], {field: 'Capital', type: 'title'});
	});
}

});
