/*\
title: relink.js
type: application/javascript
module-type: test.relink

Tests the new relinking wiki methods.

\*/
$tw.describe('relink', function() {
var it = $tw.it;

var expect = require('chai').expect;

$tw.before("creates test tiddlers", function() {
	$tw.wiki.addTiddler({"title": "from"});
});

it('creates tiddlers without stamps', function() {
	$tw.wiki.addTiddler({"title": "test", "tags": "from another"});
	$tw.wiki.renameTiddler("from", "to", {});
	var tiddler = $tw.wiki.getTiddler("test");
	expect(tiddler.fields.tags).to.eql(['to', 'another']);
});

});
