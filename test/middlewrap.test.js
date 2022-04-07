const test = require("ava");
const wrap = require("../src/index.js");

test("Passes inline errors to next.", async (t) => {
  const error = () => {
    throw "error";
  };
  await wrap(error)({}, {}, (v) => {
    t.is(v, "error");
  });
});

test("Passes async errors to next.", async (t) => {
  const asyncError = async () => {
    throw "error";
  };
  await wrap(asyncError)({}, {}, (v) => {
    t.is(v, "error");
  });
});

test("Passes returned promise rejection to next.", async (t) => {
  const promiseError = () => Promise.reject("error");
  await wrap(promiseError)({}, {}, (v) => {
    t.is(v, "error");
  });
});

test("Passes value to promise and nothing to next on success.", async (t) => {
  const v = await wrap(() => "success")({}, {}, (v) => {
    t.is(v, undefined);
  });
  t.is(v, "success");
  const u = await wrap(async () => "success")({}, {}, (v) => {
    t.is(v, undefined);
  });
  t.is(u, "success");
  const w = await wrap(() => Promise.resolve("success"))({}, {}, (v) => {
    t.is(v, undefined);
  });
  t.is(w, "success");
});

test("Passes empty value to promise on error.", async (t) => {
  const error = () => {
    throw "error";
  };
  const v = await wrap(error)({}, {}, (v) => {
    t.is(v, "error");
  });
  t.is(v, undefined);
});

test("Passes empty value to promise on async error.", async (t) => {
  const asyncError = async () => {
    throw "error";
  };
  const v = await wrap(asyncError)({}, {}, (v) => {
    t.is(v, "error");
  });
  t.is(v, undefined);
});

test("Passes empty value to promise on promise rejection.", async (t) => {
  const promiseError = () => Promise.reject("error");
  const v = await wrap(promiseError)({}, {}, (v) => {
    t.is(v, "error");
  });
  t.is(v, undefined);
});

test("Throws error on asynchronous error when no next is provided.", async (t) => {
  const promiseError = () => Promise.reject("error");
  try {
    await wrap(promiseError)({}, {});
  } catch (e) {
    t.is(e, "error");
  }
});

test("Throws error on synchronous error when no next is provided.", (t) => {
  const syncError = () => {
    throw "error";
  };
  try {
    wrap(syncError)({}, {});
  } catch (e) {
    t.is(e, "error");
  }
});

test("Throws error on callback error when no next is provided.", (t) => {
  const nextError = (req, res, next) => {
    next("error");
  };
  try {
    wrap(nextError)({}, {});
  } catch (e) {
    t.is(e, "error");
  }
});

test("Doesn't call next more than once.", async (t) => {
  let calls = 0;
  await wrap(async (res, req, next) => {
    next();
  })({}, {}, (v) => {
    calls += 1;
  });
  t.is(calls, 1);
});

test("Doesn't coerce synchronous code to async code (manual next).", (t) => {
  let calls = 0;
  wrap((res, req, next) => {
    next();
  })({}, {}, (v) => {
    calls += 1;
  });
  t.is(calls, 1);
});

test("Doesn't coerce synchronous code to async code (auto next).", (t) => {
  let calls = 0;
  wrap((res, req, next) => {})({}, {}, (v) => {
    calls += 1;
  });
  t.is(calls, 1);
});

test("Doesn't coerce synchronous code to async code (no next).", (t) => {
  let calls = 0;
  wrap((res, req, next) => {
    calls += 1;
  })({}, {});
  t.is(calls, 1);
});

test("Doesn't coerce middleware value to Promise.", (t) => {
  let calls = 0;
  const a = wrap((res, req, next) => {
    next();
  })({}, {}, (v) => {
    calls += 1;
  });
  t.false(a instanceof Promise);
  t.is(calls, 1);
  const b = wrap(async(res, req, next) => {
    next();
  })({}, {}, (v) => {
    calls += 1;
  });
  t.true(b instanceof Promise);
});

test("Middleware with next call doesn't break when called without next function.", t => {
  t.throws(
    wrap((req, res, next) => {
      next(new Error());
    })
  );
  t.notThrows(
    wrap((req, res, next) => {
      next();
    })
  );
});
