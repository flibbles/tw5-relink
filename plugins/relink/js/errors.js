/*\
module-type: library

This is the exception that gets thrown when a relink is impossible.
  (Or the hoops we'd have to go through to make it work are more than the user
   would want Relink to do, like create new tiddlers)
\*/

function RelinkError() {};
RelinkError.prototype = Object.create(Error);
exports.RelinkError = RelinkError;

function CannotRelinkError() { };
CannotRelinkError.prototype = new RelinkError();
exports.CannotRelinkError = CannotRelinkError

function CannotFindMacroDefError(macroName) { this.macroName = macroName; };
CannotFindMacroDefError.prototype = new RelinkError();
exports.CannotFindMacroDefError = CannotFindMacroDefError;
//Cannot find definition for ${macroName}. Make sure your macro whitelist is configured properly, and that you're macro is globally defined, or defined in all the places it's used.
