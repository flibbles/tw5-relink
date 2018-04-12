/*\
title: relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/
$tw.describe('relink', function() {
var it = $tw.it;

var expect = require('chai').expect;

$tw.beforeEach("creates from", function() {
	$tw.wiki.addTiddler({"title": "from"});
});

$tw.afterEach('remove to', function() {
	$tw.wiki.deleteTiddler('to');
});

function relink(fields, options) {
	options = options || {};
	var tiddler = new $tw.Tiddler({"title": "test"}, fields);
	var title = tiddler.fields.title;
	$tw.wiki.addTiddler(tiddler);
	$tw.wiki.renameTiddler("from", "to", options);
	var relinkedTiddler = $tw.wiki.getTiddler(title);
	$tw.wiki.deleteTiddler(title);
	return relinkedTiddler;
};

it('still relinks tags', function() {
	var t = relink({"tags": "from another"});
	expect(t.fields.tags).to.eql(['to', 'another']);
});

it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "from another"}, {dontRenameInTags: true});
	expect(t.fields.tags).to.eql(['from', 'another']);
});

it('still relinks lists', function() {
	var t = relink({"list": "from another"});
	expect(t.fields.list).to.eql(['to', 'another']);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "from another"}, {dontRenameInLists: true});
	expect(t.fields.list).to.eql(['from', 'another']);
});

});
