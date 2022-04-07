const middlewrap =
  (
    middleware,
    defaultNext = once((e) => {
      if (e) throw e;
    })
  ) =>
  (request, response, next) => {
    if (next instanceof Function) {
      next = once(next);
      try {
        const run = middleware(request, response, next);
        if (run instanceof Promise) {
          return run
            .then((value) => {
              next();
              return value;
            })
            .catch(next);
        } else {
          next();
          return run;
        }
      } catch (error) {
        next(error);
      }
    } else {
      return middleware(request, response, defaultNext);
    }
  };

const once = (func) => {
  let called = false;
  return (...args) => {
    if (!called) {
      called = true;
      func(...args);
    }
  };
};

module.exports = middlewrap;
