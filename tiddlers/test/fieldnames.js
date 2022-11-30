/*\

Tests the relink-fieldnames sub plugin.

\*/

var utils = require("test/utils");

describe('fieldname plugin', function() {

const blacklist = "$:/config/flibbles/relink-fieldnames/blacklist";

function getWiki() {
	const wiki = new $tw.Wiki();
	wiki.addTiddler({title: blacklist, filter: "text title type"});
	return wiki;
};

beforeEach(function() {
	spyOn(console, 'log');
});

it('reports only non-blacklisted tiddlers', function() {
	const realBlacklist = $tw.wiki.getTiddler(blacklist);
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', exists: "content", text: "content"},
		{title: "exists"}, // Exists gets reported
		{title: "text"}]);
	// By default, nothing gets reported when there is no blacklist
	expect(utils.getReport('test', wiki)).toEqual({});
	// But when it's pointing to a blacklist. Uses its filter.
	wiki.addTiddlers([realBlacklist,
		{title: "$:/language/Docs/Fields/title", text: "defined"}]);
	expect(utils.getReport('test', wiki))
		.toEqual({ "exists": [": content"], "text": [": content"] });
	// The blank should have been skipped, but not once it's filled out.
	wiki.addTiddler({title: "$:/language/Docs/Fields/text", text: "defined"});
	expect(utils.getReport('test', wiki)).toEqual({ "exists": [": content"] });
});

it('reports missing tiddlers (for now)', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', missing: "content"}]);
	expect(utils.getReport('test', wiki)).toEqual({ "missing": [": content"] });
});

it('reports field name and field value', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', active: "other"},
		{title: "active"},
		utils.fieldConf("active")]);
	expect(utils.getReport('test', wiki))
		.toEqual({ "active": [": other"], "other": ["active"] });
});

it('abridges reports if field value is long', function() {
	const string = "This is an excessively long value to have as a field.";
	const maxLength = 30;
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', field: string},
		{title: 'field'}]);
	expect(utils.getReport('test', wiki).field)
		.toEqual([": " + string.substr(0,maxLength) + "..."]);
});

it('does not invalidate reports when renaming to existing field', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', to: "content"},
		{title: 'from'}]);
	// It's important to run this test first to instantiate any caches
	utils.getReport('test', wiki);
	wiki.renameTiddler('from', 'to');
	expect(utils.getReport('test', wiki)).toEqual({to: [': content']});
});

it('doesn\'t clobber existing field values', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test1', from: "content"},
		{title: 'test2', from: "content", to: ""}, // Blanks count as values
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'to');
	var test1Fields = wiki.getTiddler('test1').fields;
	var test2Fields = wiki.getTiddler('test2').fields;
	expect(test1Fields.from).toBeUndefined();
	expect(test1Fields.to).toBe("content");
	expect(test2Fields.from).toBe("content");
	expect(test2Fields.to).toBe("");
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['test2']);
});

it('avoids relinking to blacklisted fields', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'type');
	expect(wiki.getTiddler('test').fields.from).toBe('content');
	expect(wiki.getTiddler('test').fields.type).toBeUndefined();
	// Throws an error since the user might wonder why they're not clobbering
	// every single tiddler?
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('avoids relinking from blacklisted fields', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', text: "content"},
		{title: 'title'}]);
	wiki.renameTiddler('title', 'to');
	// Doesn't throw an error since it was ignoring "title" to begin with.
	expect(wiki.getTiddler('test').fields.title).toBe('test');
	expect(wiki.getTiddler('test').fields.to).toBeUndefined();
});

it("can relink both field name and field value", function() {
	const wiki = getWiki();
	const fromConf = utils.fieldConf("from", "list");
	const toConf = utils.fieldConf("to", "list");
	wiki.addTiddlers([
		{title: 'test', from: "Content contains from"},
		{title: 'from'},
		fromConf]);
	wiki.renameTiddler("from", "to");
	expect(wiki.getTiddler('test').fields.from).toBeUndefined();
	expect(wiki.getTiddler('test').fields.to).toBe("Content contains to");
	// The whitelist entry should have been updated
	expect(wiki.tiddlerExists(fromConf.title)).toBe(false);
	expect(wiki.getTiddler(toConf.title).fields.text).toBe("list");
});

it("can relink a tiddler with itself as a field", function() {
	const wiki = getWiki();
	wiki.addTiddlers([{title: 'from', from: "Content"}]);
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists('from')).toBe(false);
	expect(wiki.getTiddler('to').fields.to).toBe("Content");
});

(utils.atLeastVersion('5.2.0')? it : xit)
("can relink field name even if field value impossible", function() {
	const wiki = getWiki();
	const to = "to]] val";
	const fromConf = utils.fieldConf("from", "list");
	const toConf = utils.fieldConf(to, "list");
	wiki.addTiddlers([
		{title: 'test', from: "Content contains from"},
		{title: 'from'},
		fromConf]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler("from", to);
	expect(wiki.getTiddler('test').fields.from).toBeUndefined();
	expect(wiki.getTiddler('test').fields[to]).toBe("Content contains from");
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it("won't clobber existing whitelist entries", function() {
	const wiki = getWiki();
	const fromConf = utils.fieldConf("from", "list");
	const toConf = utils.fieldConf("to", "title");
	wiki.addTiddlers([
		{title: 'from'},
		fromConf, toConf]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler("from", "to");
	// The whitelist entry should have been updated
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual([fromConf.title]);
	expect(wiki.getTiddler(fromConf.title).fields.text).toBe("list");
	expect(wiki.getTiddler(toConf.title).fields.text).toBe("title");
});

it("won't touch plugins ever", function() {
	const wiki = utils.addPlugin("testPlugin", [{}], {description: "Anything", wiki: getWiki()});
	wiki.addTiddler({title: "description"});
	utils.spyFailures(spyOn);
	wiki.renameTiddler("description", "to");
	expect(wiki.getTiddler("testPlugin").fields.description).toBe("Anything");
	expect(wiki.getTiddler("testPlugin").fields.to).toBeUndefined();
	expect(utils.failures).toHaveBeenCalledTimes(1);
	expect(utils.failures.calls.first().args[0]).toEqual(['testPlugin']);
});

it("can relink into weird field names", function() {
	const wiki = getWiki();
	const string = 'This:has a colon';
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', string);
	if (utils.atLeastVersion('5.2.0')) {
		// This works in post v5.2.0
		expect(utils.failures).not.toHaveBeenCalled();
		expect(wiki.getTiddler('test').fields.from).toBeUndefined();
		expect(wiki.getTiddler('test').fields[string]).toBe('content');
	} else {
		// This doesn't in pre v5.2.0
		expect(utils.failures).toHaveBeenCalledTimes(1);
		expect(utils.failures.calls.first().args[0]).toEqual(['test']);
		expect(wiki.getTiddler('test').fields.from).toBe('content');
		expect(wiki.getTiddler('test').fields[string]).toBeUndefined();
	}
});

it('can change capitalization', function() {
	const wiki = getWiki();
	wiki.addTiddlers([
		{title: 'test', from: "content"},
		{title: 'from'}]);
	utils.spyFailures(spyOn);
	wiki.renameTiddler('from', 'From');
	if (utils.atLeastVersion('5.2.0')) {
		// This works in post v5.2.0
		expect(utils.failures).not.toHaveBeenCalled();
		expect(wiki.getTiddler('test').fields.from).toBeUndefined();
		expect(wiki.getTiddler('test').fields.From).toBe('content');
	} else {
		// This doesn't in pre v5.2.0
		expect(utils.failures).toHaveBeenCalledTimes(1);
		expect(utils.failures.calls.first().args[0]).toEqual(['test']);
		expect(wiki.getTiddler('test').fields.from).toBe('content');
		expect(wiki.getTiddler('test').fields.From).toBeUndefined();
	}
});

function testText(text, expected, report, options) {
	options = Object.assign({from: 'from', to: 'to'}, options);
	const wiki = options.wiki || getWiki();
	if (expected === true) {
		expected = text.split(options.from).join(options.to);
	} else if (expected === false) {
		expected = text;
	}
	wiki.addTiddler({title: 'test', text: text});
	expect(utils.getReport('test', wiki)[options.from]).toEqual(report);
	wiki.renameTiddler(options.from, options.to, options);
	expect(utils.getText('test', wiki)).toEqual(expected);
};

it('can handle filter operators', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.operatorConf("has", "fieldname"));
	testText("{{{ [has[from]] }}}", true, ['{{{[has[]]}}}'], {wiki: wiki});
	testText("{{{ [has[from]] }}}",
	         utils.placeholder('fieldname-1', 'to]]here')+"{{{ [has<relink-fieldname-1>] }}}",
	         ['{{{[has[]]}}}'], {wiki: wiki, to: 'to]]here'});
	utils.spyFailures(spyOn);
	testText("{{{ [has[from]] }}}", false, ['{{{[has[]]}}}'], {wiki: wiki, to: 'title'});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle transcludes', function() {
	testText("{{tid!!from}}", true, ['{{tid!!}}']);
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t|o/></$tiddler>", ['{{tid!!}}'], {to: "t|o"});
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t{o/></$tiddler>", ['{{tid!!}}'], {to: "t{o"});
	testText("{{tid!!from}}", "<$tiddler tiddler=tid><$transclude tiddler=tid field=t}o/></$tiddler>", ['{{tid!!}}'], {to: "t}o"});
});

it('can handle transcludes where both title and field changed', function() {
	testText("{{from!!from}}", true, ['{{!!from}}', '{{from!!}}']);
	testText("{{from!!from}}", "<$tiddler tiddler=t!!o>{{!!t!!o}}</$tiddler>", ['{{!!from}}', '{{from!!}}'], {to: "t!!o"});
	// One final hard test
	var to = "t!!'o\"";
	const wiki = getWiki();
	wiki.addTiddler(utils.attrConf("$tiddler", "tiddler"));
	testText("{{from!!from}}", utils.placeholder(1,to) + "<$tiddler tiddler=<<relink-1>>>{{!!"+to+"}}</$tiddler>", ['{{!!from}}', '{{from!!}}'], {to: to, wiki: wiki});
	testText("{{from!!from}}", "<$tiddler tiddler=}o><$transclude tiddler=}o field=}o/></$tiddler>", ['{{!!from}}', '{{from!!}}'], {to: "}o"});
});

it('can handle indirect references', function() {
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />']);
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />'], {to: "t{o"});
	testText("<$w a={{tid!!from}}/>", true, ['<$w a={{tid!!}} />'], {to: "t|o"});
	utils.spyFailures(spyOn);
	testText("<$w a={{tid!!from}}/>", false, ['<$w a={{tid!!}} />'], {to: "t}o"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
});

it('can handle indirect references where title and field change', function() {
	testText("<$w a={{from!!from}}/>", true, ['<$w a={{!!from}} />', '<$w a={{from!!}} />']);
	utils.spyFailures(spyOn);
	testText("<$w a={{from!!from}}/>", false, ['<$w a={{!!from}} />', '<$w a={{from!!}} />'], {to: "t}o"});
	expect(utils.failures).toHaveBeenCalledTimes(1);
	testText("<$w a={{from!!from}}/>", "<$w a={{from!!from}}/>", ['<$w a={{!!from}} />', '<$w a={{from!!}} />'], {to: "t!!o"});
	expect(utils.failures).toHaveBeenCalledTimes(2);
});

it('can handle transcludes in fields or attribute string values', function() {
	const wiki = getWiki();
	wiki.addTiddler(utils.attrConf("$button", "set", "reference"));
	testText('<$button set="tid!!from"/>', true, ['<$button set="tid!!" />'], {wiki: wiki, to: "to!!this"});
	testText('<$button set="tid!!from"/>', true, ['<$button set="tid!!" />'], {wiki: wiki, to: "to this"});
});

});
