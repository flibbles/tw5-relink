/*\

Tests the relink mangler used to add fields in configuration.

\*/

var utils = require("test/utils");
var language = require("$:/plugins/flibbles/relink/js/language.js");

function test(type, paramObject, options) {
	options = options || {};
	var results = Object.create(null);
	var wiki = options.wiki || new $tw.Wiki();
	var parentWidget = wiki.makeWidget({ tree: [{
		type: "relinkmangler" }]});
	parentWidget.execute();
	var mangler = parentWidget.children[0];
	var event = { type: type, paramObject: paramObject };
	var results = {wiki: wiki, alerts: []};
	var oldAlert = language.alert;
	language.alert = function(message) { results.alerts.push(message); }
	try {
		results.output = mangler.dispatchEvent(event);
	} finally {
		language.alert = oldAlert;
	}
	return results;
};

describe("mangler", function() {

it('adds fields', function() {
	var output = test("relink-add-field", {field: "test"});
	var results = output.wiki.getTiddler("$:/config/flibbles/relink/fields/test");
	expect(results.fields.text).toEqual("title");
});

it('rejects illegal fields', function() {
	var output = test("relink-add-field", {field: "te$t"});
	var results = output.wiki.getTiddler("$:/config/flibbles/relink/fields/te$t");
	expect(results).toBeUndefined();
	expect(output.alerts.length).toEqual(1);
	// We don't test the output, since it's Tiddlywiki's, but we do make
	// sure we're properly supplying the field name for the warning string
	// to embed.
	expect(output.alerts[0]).toContain("te$t");
});

});
