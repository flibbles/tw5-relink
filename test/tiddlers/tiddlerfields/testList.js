/*\
title: tiddlerfields/testList.js
type: application/javascript
module-type: tiddlerfield

Tiddlerfield module for testList

\*/

module.exports = {
	name: "testList",
	parse: $tw.utils.parseStringArray,
	stringify: $tw.utils.stringifyList,
	relinkable: true
};
