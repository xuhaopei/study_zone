!(function (t) {
  var e = {};
  function r(n) {
    if (e[n]) return e[n].exports;
    var o = (e[n] = { i: n, l: !1, exports: {} });
    return t[n].call(o.exports, o, o.exports, r), (o.l = !0), o.exports;
  }
  (r.m = t),
    (r.c = e),
    (r.d = function (t, e, n) {
      r.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: n });
    }),
    (r.r = function (t) {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(t, "__esModule", { value: !0 });
    }),
    (r.t = function (t, e) {
      if ((1 & e && (t = r(t)), 8 & e)) return t;
      if (4 & e && "object" == typeof t && t && t.__esModule) return t;
      var n = Object.create(null);
      if (
        (r.r(n),
        Object.defineProperty(n, "default", { enumerable: !0, value: t }),
        2 & e && "string" != typeof t)
      )
        for (var o in t)
          r.d(
            n,
            o,
            function (e) {
              return t[e];
            }.bind(null, o)
          );
      return n;
    }),
    (r.n = function (t) {
      var e =
        t && t.__esModule
          ? function () {
              return t.default;
            }
          : function () {
              return t;
            };
      return r.d(e, "a", e), e;
    }),
    (r.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (r.p = ""),
    r((r.s = 0));
})([
  function (t, e, r) {
    (function (e) {
      const n = r(1);
      t.exports = {
        mode: "production",
        entry: "./index.js",
        output: {
          path: n.resolve(e, "dist"),
          filename: "my-first-webpack.bundle.js",
        },
        plugins: [],
      };
    }).call(this, "/");
  },
  function (t, e, r) {
    (function (t) {
      function r(t, e) {
        for (var r = 0, n = t.length - 1; n >= 0; n--) {
          var o = t[n];
          "." === o
            ? t.splice(n, 1)
            : ".." === o
            ? (t.splice(n, 1), r++)
            : r && (t.splice(n, 1), r--);
        }
        if (e) for (; r--; r) t.unshift("..");
        return t;
      }
      function n(t, e) {
        if (t.filter) return t.filter(e);
        for (var r = [], n = 0; n < t.length; n++)
          e(t[n], n, t) && r.push(t[n]);
        return r;
      }
      (e.resolve = function () {
        for (var e = "", o = !1, i = arguments.length - 1; i >= -1 && !o; i--) {
          var u = i >= 0 ? arguments[i] : t.cwd();
          if ("string" != typeof u)
            throw new TypeError("Arguments to path.resolve must be strings");
          u && ((e = u + "/" + e), (o = "/" === u.charAt(0)));
        }
        return (
          (e = r(
            n(e.split("/"), function (t) {
              return !!t;
            }),
            !o
          ).join("/")),
          (o ? "/" : "") + e || "."
        );
      }),
        (e.normalize = function (t) {
          var i = e.isAbsolute(t),
            u = "/" === o(t, -1);
          return (
            (t = r(
              n(t.split("/"), function (t) {
                return !!t;
              }),
              !i
            ).join("/")) ||
              i ||
              (t = "."),
            t && u && (t += "/"),
            (i ? "/" : "") + t
          );
        }),
        (e.isAbsolute = function (t) {
          return "/" === t.charAt(0);
        }),
        (e.join = function () {
          var t = Array.prototype.slice.call(arguments, 0);
          return e.normalize(
            n(t, function (t, e) {
              if ("string" != typeof t)
                throw new TypeError("Arguments to path.join must be strings");
              return t;
            }).join("/")
          );
        }),
        (e.relative = function (t, r) {
          function n(t) {
            for (var e = 0; e < t.length && "" === t[e]; e++);
            for (var r = t.length - 1; r >= 0 && "" === t[r]; r--);
            return e > r ? [] : t.slice(e, r - e + 1);
          }
          (t = e.resolve(t).substr(1)), (r = e.resolve(r).substr(1));
          for (
            var o = n(t.split("/")),
              i = n(r.split("/")),
              u = Math.min(o.length, i.length),
              c = u,
              s = 0;
            s < u;
            s++
          )
            if (o[s] !== i[s]) {
              c = s;
              break;
            }
          var f = [];
          for (s = c; s < o.length; s++) f.push("..");
          return (f = f.concat(i.slice(c))).join("/");
        }),
        (e.sep = "/"),
        (e.delimiter = ":"),
        (e.dirname = function (t) {
          if (("string" != typeof t && (t += ""), 0 === t.length)) return ".";
          for (
            var e = t.charCodeAt(0),
              r = 47 === e,
              n = -1,
              o = !0,
              i = t.length - 1;
            i >= 1;
            --i
          )
            if (47 === (e = t.charCodeAt(i))) {
              if (!o) {
                n = i;
                break;
              }
            } else o = !1;
          return -1 === n
            ? r
              ? "/"
              : "."
            : r && 1 === n
            ? "/"
            : t.slice(0, n);
        }),
        (e.basename = function (t, e) {
          var r = (function (t) {
            "string" != typeof t && (t += "");
            var e,
              r = 0,
              n = -1,
              o = !0;
            for (e = t.length - 1; e >= 0; --e)
              if (47 === t.charCodeAt(e)) {
                if (!o) {
                  r = e + 1;
                  break;
                }
              } else -1 === n && ((o = !1), (n = e + 1));
            return -1 === n ? "" : t.slice(r, n);
          })(t);
          return (
            e &&
              r.substr(-1 * e.length) === e &&
              (r = r.substr(0, r.length - e.length)),
            r
          );
        }),
        (e.extname = function (t) {
          "string" != typeof t && (t += "");
          for (
            var e = -1, r = 0, n = -1, o = !0, i = 0, u = t.length - 1;
            u >= 0;
            --u
          ) {
            var c = t.charCodeAt(u);
            if (47 !== c)
              -1 === n && ((o = !1), (n = u + 1)),
                46 === c
                  ? -1 === e
                    ? (e = u)
                    : 1 !== i && (i = 1)
                  : -1 !== e && (i = -1);
            else if (!o) {
              r = u + 1;
              break;
            }
          }
          return -1 === e ||
            -1 === n ||
            0 === i ||
            (1 === i && e === n - 1 && e === r + 1)
            ? ""
            : t.slice(e, n);
        });
      var o =
        "b" === "ab".substr(-1)
          ? function (t, e, r) {
              return t.substr(e, r);
            }
          : function (t, e, r) {
              return e < 0 && (e = t.length + e), t.substr(e, r);
            };
    }).call(this, r(2));
  },
  function (t, e) {
    var r,
      n,
      o = (t.exports = {});
    function i() {
      throw new Error("setTimeout has not been defined");
    }
    function u() {
      throw new Error("clearTimeout has not been defined");
    }
    function c(t) {
      if (r === setTimeout) return setTimeout(t, 0);
      if ((r === i || !r) && setTimeout)
        return (r = setTimeout), setTimeout(t, 0);
      try {
        return r(t, 0);
      } catch (e) {
        try {
          return r.call(null, t, 0);
        } catch (e) {
          return r.call(this, t, 0);
        }
      }
    }
    !(function () {
      try {
        r = "function" == typeof setTimeout ? setTimeout : i;
      } catch (t) {
        r = i;
      }
      try {
        n = "function" == typeof clearTimeout ? clearTimeout : u;
      } catch (t) {
        n = u;
      }
    })();
    var s,
      f = [],
      l = !1,
      a = -1;
    function h() {
      l &&
        s &&
        ((l = !1), s.length ? (f = s.concat(f)) : (a = -1), f.length && p());
    }
    function p() {
      if (!l) {
        var t = c(h);
        l = !0;
        for (var e = f.length; e; ) {
          for (s = f, f = []; ++a < e; ) s && s[a].run();
          (a = -1), (e = f.length);
        }
        (s = null),
          (l = !1),
          (function (t) {
            if (n === clearTimeout) return clearTimeout(t);
            if ((n === u || !n) && clearTimeout)
              return (n = clearTimeout), clearTimeout(t);
            try {
              n(t);
            } catch (e) {
              try {
                return n.call(null, t);
              } catch (e) {
                return n.call(this, t);
              }
            }
          })(t);
      }
    }
    function d(t, e) {
      (this.fun = t), (this.array = e);
    }
    function g() {}
    (o.nextTick = function (t) {
      var e = new Array(arguments.length - 1);
      if (arguments.length > 1)
        for (var r = 1; r < arguments.length; r++) e[r - 1] = arguments[r];
      f.push(new d(t, e)), 1 !== f.length || l || c(p);
    }),
      (d.prototype.run = function () {
        this.fun.apply(null, this.array);
      }),
      (o.title = "browser"),
      (o.browser = !0),
      (o.env = {}),
      (o.argv = []),
      (o.version = ""),
      (o.versions = {}),
      (o.on = g),
      (o.addListener = g),
      (o.once = g),
      (o.off = g),
      (o.removeListener = g),
      (o.removeAllListeners = g),
      (o.emit = g),
      (o.prependListener = g),
      (o.prependOnceListener = g),
      (o.listeners = function (t) {
        return [];
      }),
      (o.binding = function (t) {
        throw new Error("process.binding is not supported");
      }),
      (o.cwd = function () {
        return "/";
      }),
      (o.chdir = function (t) {
        throw new Error("process.chdir is not supported");
      }),
      (o.umask = function () {
        return 0;
      });
  },
]);
