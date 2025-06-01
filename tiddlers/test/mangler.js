/*\

Tests the relink mangler used to add fields in configuration.

\*/

var utils = require("./utils");
var Mangler = require("$:/plugins/flibbles/relink/js/mangler.js").relinkmangler;
var prefix = "$:/config/flibbles/relink/";
var defaultTiddler = "$:/config/flibbles/relink/settings/default-type";

function test(type, paramObject, options) {
	options = options || {};
	var results = Object.create(null);
	var wiki = options.wiki || new $tw.Wiki();
	var parentWidget = wiki.makeWidget({ tree: [{
		type: "relinkmangler" }]});
	parentWidget.execute();
	var mangler = parentWidget.children[0];
	var event = { type: type, paramObject: paramObject };
	var output = mangler.dispatchEvent(event);
	return wiki;
};

describe("mangler", function() {

beforeEach(function() {
	spyOn(Mangler.prototype, 'alert');
});

it('supports default custom type', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: defaultTiddler, text: "dummy-type"});
	test("relink-add-field", {field: "test"}, {wiki: wiki});
	var results = wiki.getTiddler(prefix + "fields/test");
	expect(results.fields.text).toEqual("dummy-type");
});

it('adds fields', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: defaultTiddler, text: "wikitext"});
	test("relink-add-field", {field: "test"}, {wiki: wiki});
	var results = wiki.getTiddler(prefix + "fields/test");
	expect(results.fields.text).toEqual("wikitext");
});

// These tests are specific to TiddlyWiki V5.2.*
if (utils.atLeastVersion("5.2.0")) {
	it('allows weird fields', function() {
		var wiki = test("relink-add-field", {field: "te$t"});
		var results = wiki.getTiddler(prefix + "fields/te$t");
		expect(results).not.toBeUndefined();
		expect(Mangler.prototype.alert).not.toHaveBeenCalled();
		// We don't test the output, since it's Tiddlywiki's,
		// but we do make sure we're properly supplying the
		// field name for the warning string to embed.
	});

} else {
	// This test confirms that Relink on earlier versions still has strict
	// field names
	it('rejects illegal fields', function() {
		var wiki = test("relink-add-field", {field: "te$t"});
		var results = wiki.getTiddler(prefix + "fields/te$t");
		expect(results).toBeUndefined();
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(1);
		// We don't test the output, since it's Tiddlywiki's,
		// but we do make sure we're properly supplying the
		// field name for the warning string to embed.
		expect(Mangler.prototype.alert.calls.argsFor(0)[0]).toContain('te$t');
	});
}

// For v5.1.*, this is technically wrong. We shouldn't allow field names with
// capital letters, but it's more important to function for v5.2.*, which does
// allow them.
it('allows fields with capital letters', function() {
	var wiki = test('relink-add-field', {field: 'Capital'});
	expect(wiki.getTiddler(prefix + 'fields/Capital')).not.toBeUndefined();
	expect(Mangler.prototype.alert).not.toHaveBeenCalled();
});

it('ignores some fields', function() {
	function ignore(field, expectedNonexistent) {
		var wiki = test("relink-add-field", {field: field});
		var results = wiki.getTiddler(prefix + "fields/");
		expect(results).toBeUndefined();
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(0);
	}
	ignore("   ");
	ignore("");
	ignore(undefined);
});

it('adds operators', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: defaultTiddler, text: "list"});
	test("relink-add-operator", {operator: "test"}, {wiki: wiki});
	var results = wiki.getTiddler(prefix + "operators/test");
	expect(results.fields.text).toEqual("list");
});

it('adds odd operators', function() {
	function op(input, expectedSuffix) {
		var wiki = test("relink-add-operator", {operator: input});
		var results = wiki.getTiddler(prefix + expectedSuffix);
		expect(results.fields.text).toEqual("title");
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(0);
	}
	op("   test ", "operators/test");
	op("tESt", "operators/tESt");
	// pretty sure tiddlywiki rejects these, but relink doesn't judge.
	op("te$t", "operators/te$t");
	op("bad/operator", "operators/bad/operator");
});

it('adds macro parameters', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: defaultTiddler, text: "filter"});
	test("relink-add-parameter",
		{macro: "test", parameter: "field"},
		{wiki: wiki});
	var results = wiki.getTiddler(prefix + "macros/test/field");
	expect(results.fields.text).toEqual("filter");
});

// This is the only validation we do on parameters, because it's the only one
// that can cause malformed behavior in relink. Tiddlywiki will still fail if
// the user is using bad param names, but that's their problem.
it('rejects bad macros and parameters', function() {
	function fail(macro, parameter, error) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "$:/plugins/flibbles/relink/language/Error/InvalidMacroName", text: "<$text text=<<macroName>> />"},
			{title: "$:/plugins/flibbles/relink/language/Error/InvalidParameterName", text: "<$text text=<<parameterName>> />"}]);
		var output = test(
			"relink-add-parameter",
			{macro: macro, parameter: parameter},
			{wiki: wiki});
		var results = wiki.getTiddler(
			prefix + "macros/"+macro+"/"+parameter);
		expect(results).toBeUndefined();
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(1);
		expect(Mangler.prototype.alert).toHaveBeenCalledWith(error);
		Mangler.prototype.alert.calls.reset();
	};
	fail("test space", "param", "test space");
	fail("test", "field/slash", "field/slash");
	fail("test", "field space", "field space");
});

it('adds odd parameters', function() {
	function op(macro, parameter, expectedSuffix) {
		var wiki = test("relink-add-parameter", {macro: macro, parameter: parameter});
		var results = wiki.getTiddler(prefix + expectedSuffix);
		expect(results.fields.text).toEqual("title");
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(0);
	}
	op("   test ", " param  ", "macros/test/param");
	op("test/slash", "param", "macros/test/slash/param");
	// Technically, the angle bracket isn't allowed, but it can still be
	// used by Tiddlywiki through $macrocall
	op("test>angle", "param", "macros/test>angle/param");
	op("tESt", "pARAm", "macros/tESt/pARAm");
	op("te_s-t", "p_ara-m", "macros/te_s-t/p_ara-m");
});

it('adds element attributes', function() {
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: defaultTiddler, text: "reference"});
	test("relink-add-attribute",
		{element: "test", attribute: "field"},
		{wiki: wiki});
	var results = wiki.getTiddler(prefix + "attributes/test/field");
	expect(results.fields.text).toEqual("reference");
});

it('rejects bad elements and attributes', function() {
	function fail(element, attribute, error) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers([
			{title: "$:/plugins/flibbles/relink/language/Error/InvalidElementName", text: "<$text text=<<elementName>> />"},
			{title: "$:/plugins/flibbles/relink/language/Error/InvalidAttributeName", text: "<$text text=<<attributeName>> />"}]);
		test("relink-add-attribute",
			{element: element, attribute: attribute},
			{wiki: wiki});
		var results = wiki.getTiddler(prefix + "attributes/"+element+"/"+attribute);
		expect(results).toBeUndefined();
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(1);
		expect(Mangler.prototype.alert).toHaveBeenCalledWith(error);
		Mangler.prototype.alert.calls.reset();
	};
	fail("te/st", "attr", "te/st");
	fail("te st", "attr", "te st");
	fail("test", "at/tr", "at/tr");
	fail("test", "at tr", "at tr");
});

it('adds odd attributes', function() {
	function op(element, attribute, expectedSuffix) {
		var wiki = test("relink-add-attribute", {element: element, attribute: attribute});
		var results = wiki.getTiddler(prefix + expectedSuffix);
		expect(results.fields.text).toEqual("title");
		expect(Mangler.prototype.alert).toHaveBeenCalledTimes(0);
	}
	op("   test ", " attr  ", "attributes/test/attr");
	op("tESt", "aTTr", "attributes/tESt/aTTr");
	op("$te-st", "a_tt-r", "attributes/$te-st/a_tt-r");
});

it("won't crash with bad input", function() {
	test("relink-add-field", {wrong: "parameter"});
	test("relink-add-field", undefined);
	test("relink-add-operator", {wrong: "parameter"});
	test("relink-add-operator", undefined);
	// too few
	test("relink-add-parameter", {parameter: "parameter"});
	test("relink-add-parameter", {macro: "parameter"});
	test("relink-add-parameter", undefined);
	test("relink-add-attribute", {attribute: "parameter"});
	test("relink-add-attribute", {element: "parameter"});
	test("relink-add-attribute", undefined);
	// This just suppresses the jasmine warning. The real test is that
	// we can run all those methods above without an error being thrown.
	expect(true).toEqual(true);
});

});
