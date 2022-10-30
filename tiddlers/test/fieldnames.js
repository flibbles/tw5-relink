/*\

Tests the relink-fieldnames sub plugin.

\*/

var utils = require("test/utils");

describe('fieldname plugin', function() {

beforeEach(function() {
	spyOn(console, 'log');
});

// Only need one "report" test for this plugin. It's dead simple. No edge cases.
it('reports only existing, non-blacklisted tiddlers', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', exists: "content", missing: "content", text: "content"},
		{title: "exists"}, // Exists gets reported
		{title: "text"}]);
	expect(utils.getReport('test', wiki)).toEqual({ "exists": [": content"] });
});

it('reports field name and field value', function() {
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', active: "other"},
		{title: "active"},
		utils.fieldConf("active")]);
	expect(utils.getReport('test', wiki))
		.toEqual({ "active": [": other"], "other": ["active"] });
});

it('abridges reports if field value is long', function() {
	const string = "This is an excessively long value to have as a field.";
	const maxLength = 20;
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', field: string},
		{title: 'field'}]);
	expect(utils.getReport('test', wiki).field)
		.toEqual([": " + string.substr(0,maxLength) + "..."]);
});

it('doesn\'t clobber existing field values', function() {
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([
		{title: 'test', text: "content"},
		{title: 'title'}]);
	wiki.renameTiddler('title', 'to');
	// Doesn't throw an error since it was ignoring "title" to begin with.
	expect(wiki.getTiddler('test').fields.title).toBe('test');
	expect(wiki.getTiddler('test').fields.to).toBeUndefined();
});

it("can relink both field name and field value", function() {
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
	wiki.addTiddlers([{title: 'from', from: "Content"}]);
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists('from')).toBe(false);
	expect(wiki.getTiddler('to').fields.to).toBe("Content");
});

(utils.atLeastVersion('5.2.0')? it : xit)
("can relink field name even if field value impossible", function() {
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
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

it("can relink into weird field names", function() {
	const wiki = new $tw.Wiki();
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
	const wiki = new $tw.Wiki();
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

});
