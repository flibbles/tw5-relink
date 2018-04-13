/*\
title: tiddlerfields/testlist.js
type: application/javascript
module-type: tiddlerfield

Tiddlerfield module for testList

\*/

module.exports = {
	name: "testlist",
	parse: $tw.utils.parseStringArray,
	stringify: $tw.utils.stringifyList,
	type: "list",
	relinkable: true
};
