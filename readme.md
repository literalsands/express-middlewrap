# Express Middlewrap

## Why?

Express middlewares pass errors to a callback. Javascript already has two error flows with synchronous and asynchronous code.

Express middlewares call a callback (sometimes more than once...) instead of returning. Javascript already has two standard return flows with synchronous and asynchronous code.

This wrapper converts synchronous and asynchronous flows to express-style callback flows when passed a callback, and converts callback style flows to the underlying synchronous or asynchronous function when not passed a callback.

## Examples

Wrapped functions no longer require calling next or catching error to next function. Next will be called when the function completes or the promise returns or a catchable error is thrown.

__Automatically calls next on function return or promise completion.__
```js
const mw = require('express-middlewrap');

app.get("/:userId/:docId", [
    mw((req) => {
        // Any errors thrown are called with next.
        checkUserAuth(req.params.userId, req.headers.authorization);
        // Next called implicitly.
    })
    // Simple, straight forward use of async/await.
    mw(async (req, res) => {
        // Any errors thrown are called with next.
        await checkUserOwnsDoc(req.params.userId, req.params.docId);
        // Next called implicitly.
    }),
    (req, res, next) => {
        const docStream = getDocStream(req.params.docId);
        docStream.pipe(res);
        docStream.on("error", (e) => next(e));
        docStream.on("end", () => next());
    }
]);
```

## Limitations

### Uncaught Exceptions

Doesn't work properly with middleware that calls next asynchronously and without returing a promise, i.e. setTimeout, event handlers. Promisify them first.


__Won't work properly.__
```js
mw((req, res, next) => {
    setTimeout(next, 500);
})

mw((req, res, next) => {
    new Promise(() => { /* ... */ }).then(next);
})
```
__Can work properly.__
```js
mw((req, res, next) => {
    return new Promise((resolve) => setTimeout(resolve, 500)).then(next);
})
mw((req, res, next) => {
    return new Promise(() => { /* ... */ }).then(next);
})
```

### Doesn't wrap everything in promises.

We don't want to promise what we can already deliver.

__Sync code stays sync.__
```js
mw((req, res, next) => { return "bar"; }})() // => "bar"
```
