/*\
module-type: library

This is the exception that gets thrown when a relink is impossible.
  (Or the hoops we'd have to go through to make it work are more than the user
   would want Relink to do, like create new tiddlers)
\*/

function CannotRelinkError() {
};

CannotRelinkError.prototype = Object.create(Error);

module.exports = CannotRelinkError;
