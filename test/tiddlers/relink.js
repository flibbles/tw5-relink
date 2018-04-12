/*\
title: relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/
$tw.describe('relink', function() {
var it = $tw.it;

var expect = require('chai').expect;
var logs;

function collectLogs(scope) {
	var oldLog = console.log,
		logMessages = [];
	console.log = function (message) { logMessages.push(message); };
	try {
		scope.call();
	} finally {
		console.log = oldLog;
	}
	return logMessages;
};

$tw.beforeEach("creates from", function() {
	$tw.wiki.addTiddler({"title": "from"});
});

$tw.afterEach('remove to', function() {
	$tw.wiki.deleteTiddler('to');
});

function relink(fields, options) {
	var relinkedTiddler;
	logs = collectLogs(function() {
		options = options || {};
		var tiddler = new $tw.Tiddler({"title": "test"}, fields);
		var title = tiddler.fields.title;
		$tw.wiki.addTiddler(tiddler);
		$tw.wiki.renameTiddler("from", "to", options);
		relinkedTiddler = $tw.wiki.getTiddler(title);
		$tw.wiki.deleteTiddler(title);
	});
	return relinkedTiddler;
};

it("doesn't touch ineligible tiddlers", function() {
	var t = relink({tags: "nothing here", list: "other stuff"});
	expect(t.fields).to.not.include.key('modified');
});

it("touches eligible tiddlers", function() {
	var t = relink({tags: "from"});
	expect(t.fields).to.include.key('modified');
});

it('still relinks tags', function() {
	var t = relink({"tags": "from another"});
	expect(t.fields.tags).to.eql(['to', 'another']);
	expect(logs).to.eql(["Renaming tag 'from' to 'to' of tiddler 'test'"]);
});

it('still respects dontRenameInTags', function() {
	var t = relink({"tags": "from another"}, {dontRenameInTags: true});
	expect(t.fields.tags).to.eql(['from', 'another']);
});

it('still relinks lists', function() {
	var t = relink({"list": "from another"});
	expect(t.fields.list).to.eql(['to', 'another']);
	expect(logs).to.eql(["Renaming list item 'from' to 'to' of tiddler 'test'"]);
});

it('still respects dontRenameInLists', function() {
	var t = relink({"list": "from another"}, {dontRenameInLists: true});
	expect(t.fields.list).to.eql(['from', 'another']);
});

it('relinks custom undefined field', function() {
	var title =  "$:/config/flibbles/relink/fields/testField";
	$tw.wiki.addTiddler({"title": title});
	var t = relink({"testField": "from"});
	$tw.wiki.deleteTiddler(title);
	expect(t.fields.testField).to.equal('to');
});

});
