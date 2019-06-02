// LICENSE (MIT)
// Copyright 2015 David Bau.

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// https://github.com/davidbau/splaylist

// Implements a linked list with logarithmic performance for
// random-access array operations.
//
// var list = new SplayList();
//
// Use like an array without worrying about insertion cost.
// list.push("last");
// assert.equal(list.get(0), "last");
// list.splice(0, 0, "inserted", "second");
// assert.equal(list.get(0), "inserted");
//
// Use like a linked list without worrying about random-access cost.
// var last = list.last();
// var mid = last.prev();
// assert.equal(mid.val(), "second")
// list.removeAt(mid);
// assert.equal(list.get(1), "last");
// assert.equal(list.nth(1), last);

var assert = require('assert');

(function(global, module, define) {
  var Location = function(value) {
    this._P = null;
    this._L = null;
    this._R = null;
    this._V = value;
  };

  Location.prototype = {
    constructor: Location,
    val: function() {
      return this._V;
    },
    next: function() {
      var loc = this,
        next = loc._R;
      if (next !== null) {
        for (loc = next._L; loc != null; loc = next._L) {
          next = loc;
        }
      } else {
        for (next = loc._P; next != null && next._R === loc; next = loc._P) {
          loc = next;
        }
      }
      return next;
    },
    prev: function() {
      var loc = this,
        prev = loc._L;
      if (prev !== null) {
        for (loc = prev._R; loc != null; loc = prev._R) {
          prev = loc;
        }
      } else {
        for (prev = loc._P; prev != null && prev._L === loc; prev = loc._P) {
          loc = prev;
        }
      }
      return prev;
    },
    skip: function(n, key) {
      return forward(this, n, key);
    },
    toString: function() {
      var total = {},
        k;
      for (k in this) if (k.charAt(0) != '_') total[k] = this[k];
      return (
        this._V.toString() +
        ' ' +
        JSON.stringify(total)
          .replace(/"(\w+)":/g, '$1:')
          .replace(/\s+/g, ' ')
      );
    }
  };

  function reorder(tree, X) {
    tree.orderstats(X._V, X, X._L, X._R);
  }

  function leftRootedRotate(x) {
    //       x                 y
    //     /   \             /   \
    //    L     y           x    RR
    //        /   \       /   \
    //       RL   RR     L    RL
    var y = x._R;
    x._R = y._L;
    if (y._L !== null) y._L._P = x;
    y._L = x;
    x._P = y;
    return y;
  }

  // Left rotation, swaps a node's right child in for the node,
  // pushing the node down to the left and fixing up parent pointers.
  // Does not update order statistics.
  function leftRotate(tree, x) {
    var p = x._P,
      y = leftRootedRotate(x);
    if (p === null) tree._root = y;
    else if (x === p._L) p._L = y;
    else p._R = y;
    y._P = p;
  }

  // Right rotation without fixing up parents of x; appropriate
  // when splaying downward, or when splaying at the root.
  function rightRootedRotate(x) {
    //         x            y
    //       /   \        /   \
    //      y     R      LL    x
    //    /   \              /   \
    //   LL   LR            LR    R
    var y = x._L;
    x._L = y._R;
    if (y._R !== null) y._R._P = x;
    y._R = x;
    x._P = y;
    return y;
  }

  // Right rotation, swaps a node's left child in for the node,
  // pushing the node down to the right and fixing up parent pointers.
  // Does not update order statistics.
  function rightRotate(tree, x) {
    var p = x._P,
      y = rightRootedRotate(x);
    if (p === null) tree._root = y;
    else if (x === p._L) p._L = y;
    else p._R = y;
    y._P = p;
  }

  // Splays the node x to the root.
  function splayUp(tree, x) {
    var p = x._P;
    if (p === null) return;
    do {
      var g = p._P;
      if (g === null) {
        // Zig right or left.
        if (p._L === x) rightRotate(tree, p);
        else leftRotate(tree, p);
      } else {
        if (p._L === x && g._L === p) {
          // Zig-zig right.
          rightRotate(tree, g);
          rightRotate(tree, p);
        } else if (p._R === x && g._R === p) {
          // Zig-zig left.
          leftRotate(tree, g);
          leftRotate(tree, p);
        } else if (p._L === x && g._R === p) {
          // Zig-zag right-left.
          rightRotate(tree, p);
          leftRotate(tree, g);
        } else {
          // Zig-zag left-right.
          leftRotate(tree, p);
          rightRotate(tree, g);
        }
        reorder(tree, g);
      }
      reorder(tree, p);
      p = x._P;
    } while (p !== null);
    reorder(tree, x);
  }

  // Binary search: find first node where sum of key up to and including
  // that node would exceed value.
  function findByOrder(tree, key, value) {
    var x = tree._root;
    while (x !== null) {
      var L = x._L,
        R = x._R,
        leftval,
        rightval;
      if (L !== null) {
        leftval = L[key];
        if (value < leftval) {
          x = L;
          continue;
        }
      }
      rightval = x[key];
      if (R !== null) {
        rightval -= R[key];
      }
      if (value < rightval) {
        return x;
      }
      value -= rightval;
      x = R;
    }
    return null;
  }

  // Global temporary object to avoid allocation.
  var globalStub = new Location();

  // Splays to root the leftmost node whose order statistic is greater than
  // the given value.  For example, ("count", 0, true) will splay to the root
  // the leftmost node that has a positive count.  Adapted from:
  // https://github.com/montagejs/collections/blob/master/sorted-set.js
  // This is the simplified top-down splaying algorithm from: "Self-adjusting
  // Binary Search Trees" by Sleator and Tarjan.
  function splayByOrder(tree, key, value) {
    var stub, left, right, temp, root, L, R, history, rootsum, found, sidesum, sssum;
    if (!tree._root) {
      return false;
    }
    // Create a stub node.  The use of the stub node is a bit
    // counter-intuitive: The right child of the stub node will hold the L tree
    // of the algorithm.  The left child of the stub node will hold the R tree
    // of the algorithm.  Using a stub node, left and right will always be
    // nodes and we avoid special cases.
    // - http://code.google.com/p/v8/source/browse/branches
    //       /bleeding_edge/src/splay-tree-inl.h
    stub = left = right = globalStub;
    root = tree._root;
    rootsum = root[key];
    while (true) {
      L = root._L;
      if (L !== null) {
        sidesum = L[key];
        if (value < sidesum) {
          if (L._L !== null && value < (sssum = L._L[key])) {
            rightRootedRotate(root);
            reorder(tree, root);
            root = L;
            rootsum = sssum;
          } else {
            rootsum = sidesum;
          }
          // link left
          right._L = root;
          root._P = right;
          // right order statistics and right._L are invalid: don't update.
          right = root;
          root = root._L; // Don't null root._P until the end.
          continue;
        }
      }
      R = root._R;
      rootsum = root[key];
      if (R !== null) {
        sidesum = R[key];
        if (value >= rootsum - sidesum) {
          if (R._R !== null && value >= rootsum - (sssum = R._R[key])) {
            leftRootedRotate(root);
            reorder(tree, root);
            root = R;
            value = value - rootsum + sssum;
            rootsum = sssum;
          } else {
            value = value - rootsum + sidesum;
            rootsum = sidesum;
          }
          // link right
          left._R = root;
          root._P = left;
          // left order statistics and left._R are invalid: don't update.
          left = root;
          root = root._R; // Don't null root._P until the end.
          continue;
        } else {
          found = true;
          break;
        }
      } else {
        found = value < rootsum;
      }
      break;
    }
    // reassemble
    root._P = null;
    left._R = root._L;
    if (left._R !== null) left._R._P = left;
    right._L = root._R;
    if (right._L !== null) right._L._P = right;
    root._L = stub._R;
    if (root._L !== null) root._L._P = root;
    root._R = stub._L;
    if (root._R !== null) root._R._P = root;
    // propagate new order statistics
    if (right !== stub)
      while (right !== null) {
        reorder(tree, right);
        right = right._P;
      }
    if (left !== stub)
      while (left !== null) {
        reorder(tree, left);
        left = left._P;
      }
    reorder(tree, root);
    tree._root = root;
    return found;
  }

  function nth(tree, index) {
    if (!splayByOrder(tree, 'n', index)) return null;
    return tree._root;
  }

  function first(tree) {
    var seek = tree._root,
      prev = null;
    while (seek !== null) {
      prev = seek;
      seek = prev._L;
    }
    return prev;
  }

  function last(tree) {
    var seek = tree._root,
      prev = null;
    while (seek !== null) {
      prev = seek;
      seek = prev._R;
    }
    return prev;
  }

  function forward(cur, count, key) {
    key = key || 'n';
    var cur,
      R,
      L = cur._L,
      Cs,
      Rs,
      Ls;
    Ls = L === null ? 0 : L[key];
    for (;;) {
      Cs = cur[key];
      R = cur._R;
      Rs = R === null ? 0 : R[key];
      count -= Cs - Ls - Rs;
      if (count < 0) return cur;
      if (count < Rs) {
        // Down-right once
        cur = R;
        // Then scan down-left
        for (;;) {
          L = cur._L;
          Ls = L === null ? 0 : L[key];
          if (count >= Ls) break;
          cur = L;
        }
        count -= Ls;
      } else {
        count -= Rs;
        for (;;) {
          // Scan up while was-right-child
          next = cur._P;
          if (next === null) return null;
          if (next._L === cur) {
            // Then once up was-left-child
            L = cur;
            Ls = cur[key];
            break;
          }
          cur = next;
        }
        cur = next;
      }
    }
  }

  function removeRange(tree, first, limit) {
    if (limit == null) {
      splayUp(tree, first);
      //       first                   L
      //       /  \          ->
      //      L   DELETE
      tree._root = first._L;
      if (tree._root !== null) tree._root._P = null;
      first._L = null;
    } else {
      splayUp(tree, first);
      if (limit === first) return false;
      splayUp(tree, limit);
      if (limit._L !== first) {
        // first does not come before limit in the tree.
        if (limit._L === null || limit._L._L !== first) return false;
      }
      // Or first is two levels down due to a zig-zig.
      //          limit                 limit
      //          /   \                 /   \
      //        XX     R     ->        LL    R
      //       /  \
      //    first  YY
      //    /   \
      //   LL   ZZ
      // Single-level down case.
      //          limit               limit
      //          /   \               /   \
      //       first   R     ->      L     R
      //       /  \
      //      L   DELETE
      limit._L._P = null;
      limit._L = first._L;
      if (limit._L !== null) limit._L._P = limit;
      first._L = null;
      reorder(tree, limit);
    }
    return true;
  }

  function dump(out, node, depth) {
    if (!node) {
      out('empty');
      return;
    }
    var result = '';
    if (node._R !== null) {
      result += dump(out, node._R, depth + 1);
    }
    var line = node.toString(),
      prev = node,
      scan = prev._P,
      j = depth,
      rchild,
      rparent;
    if (scan === null) {
      line = '\u2501' + line;
    } else {
      rchild = scan._R === prev;
      if (rchild) {
        line = '\u250c\u2574' + line;
      } else {
        line = '\u2514\u2574' + line;
      }
      prev = scan;
      scan = prev._P;
      rparent = rchild;
      while (scan !== null && j > 0) {
        rchild = scan._R === prev;
        if (rchild === rparent) {
          line = '  ' + line;
        } else {
          line = '\u2502 ' + line;
        }
        prev = scan;
        scan = prev._P;
        j -= 1;
        rparent = rchild;
      }
      line = ' ' + line;
    }
    out(line);
    if (node._L !== null) {
      result += dump(out, node._L, depth + 1);
    }
  }

  function sliceargs(args, n) {
    return Array.prototype.slice.call(args, n);
  }

  var SplayList = function() {
    this._root = null;
    if (arguments.length) {
      this.push.apply(this, arguments);
    }
  };

  SplayList.prototype = {
    constructor: SplayList,

    orderstats: function(V, X, L, R) {
      // Override orderstats to add more order statistics.
      // Example:
      // x = new SplayList();
      // x.orderstats = function(V, X, L, R) {
      //   var n = 1, len = V.length;
      //   if (L !== null) { n += L.n; len += L.length; }
      //   if (R !== null) { n += R.n; len += R.length; }
      //   X.n = n; X.length = len;
      // });
      var v = 1;
      if (L !== null) v += L.n;
      if (R !== null) v += R.n;
      X.n = v;
    },

    nth: function(index) {
      /*
  // Possible optimization: no mutations if the node is within
  // the top three already.
  var T = this._root;
  if (T === null || index >= T.n) return null;
  var L = T._L, N;
  if (L === null) {
    if (index == 0) return T;
    N = 0;
  } else {
    N = L.n;
    if (index === N) return T;
    if (index === (L._L === null ? 0 : L._L.n)) return L;
  }
  var R = T._R;
  if (R !== null) {
    if (index === N + 1 + (R._L === null ? 0 : R._L.n)) return R;
  }
  */
      return nth(this, index);
    },

    get: function(loc) {
      loc = this.nth(loc);
      if (loc !== null) return loc.val();
    },

    set: function(loc, value) {
      if (typeof loc === 'number') {
        loc = nth(this, loc);
        if (loc === null) return;
      } else {
        if (loc == null) return;
        splayUp(this, loc);
      }
      loc._V = value;
      reorder(this, loc);
    },

    find: function(key, value) {
      /*
  if (null !== (loc = findByOrder(this, key, value))) splayUp(this, loc);
  return loc;
  */
      if (!splayByOrder(this, key, value)) return null;
      return this._root;
    },

    index: function(location) {
      splayUp(this, location);
      if (location._L === null) return 0;
      return location._L.n;
    },

    stat: function(key, location) {
      var left;
      if (location == null) {
        left = this._root;
      } else {
        splayUp(this, location);
        left = location._L;
      }
      if (left === null) return 0;
      return left[key];
    },

    unshift: function(value) {
      if (arguments.length !== 1) {
        if (arguments.length > 1) {
          this.spliceArray(0, 0, arguments);
        }
      } else {
        var root = new this.constructor.Location(value);
        root._R = this._root;
        if (root._R !== null) root._R._P = root;
        reorder(this, root);
        this._root = root;
      }
      return this.length;
    },

    push: function(value) {
      if (arguments.length !== 1) {
        if (arguments.length > 1) {
          this.spliceArray(null, 0, arguments);
        }
      } else {
        var root = new this.constructor.Location(value);
        root._L = this._root;
        if (root._L !== null) root._L._P = root;
        reorder(this, root);
        this._root = root;
      }
      return this.length;
    },

    shift: function() {
      var first = this.first();
      if (first !== null) {
        this.removeAt(first);
        return first.val();
      }
    },

    pop: function() {
      var last = this.last();
      if (last !== null) {
        this.removeAt(last);
        return last.val();
      }
    },

    // Insert any number of values after the given location, and
    // return the location of first value inserted.
    insertAfter: function(location, value) {
      if (location === null) {
        this.unshift.apply(this, sliceargs(arguments, 1));
        if (arguments.length > 1) {
          return this.first();
        }
      } else if (arguments.length !== 2) {
        if (arguments.length > 2) {
          this.spliceArray(location.next(), 0, sliceargs(arguments, 1));
          return location.next();
        }
      } else {
        splayUp(this, location);
        var oldroot = this._root;
        var root = new this.constructor.Location(value);
        root._L = oldroot;
        if (oldroot !== null) {
          oldroot._P = root;
          root._R = oldroot._R;
          if (root._R) root._R._P = root;
          oldroot._R = null;
          reorder(this, oldroot);
        }
        reorder(this, root);
        this._root = root;
        return root;
      }
    },

    insertBefore: function(location, value) {
      if (location === null) {
        this.push.apply(this, sliceargs(arguments, 1));
        if (arguments.length > 1) {
          return this._root; // push leaves first new location at root.
        }
      }
      if (arguments.length !== 2) {
        if (arguments.length > 2) {
          var prev = location.prev();
          this.spliceArray(location, 0, sliceargs(arguments, 1));
          return prev === null ? this.first() : prev.next();
        }
      } else {
        splayUp(this, location);
        var oldroot = this._root;
        var root = new this.constructor.Location(value);
        root._R = oldroot;
        if (oldroot !== null) {
          oldroot._P = root;
          root._L = oldroot._L;
          if (root._L) root._L._P = root;
          oldroot._L = null;
          reorder(this, oldroot);
        }
        reorder(this, root);
        this._root = root;
        return root;
      }
    },

    removeAt: function(location) {
      if (typeof location === 'number') {
        location = nth(this, location);
      } else {
        splayUp(this, location);
      }
      if (location._R === null) {
        this._root = location._L;
        if (this._root !== null) this._root._P = null;
      } else if (location._L === null) {
        this._root = location._R;
        this._root._P = null;
      } else {
        splayUp(this, this._root.next());
        // The old root is now just one or two levels down to the
        // left, and only a zig-zig could move it two levels down:
        //
        //         sucessor
        //          /   \
        //         X     R
        //        /
        //     DELETE
        //
        // But since the successor comes right after the node
        // to be deleted, there cannot be a node ("X") between.
        // Therefore, zig-zig wasn't done, and we must now be
        // just one level down, with nothing between:
        //
        //         sucessor           successor
        //          /   \               /   \
        //       DELETE  R     ->      L     R
        //       /
        //      L
        this._root._L = location._L;
        if (this._root._L) this._root._L._P = this._root;
        location._L = location._P = null;
        reorder(this, this._root);
      }
    },

    removeRange: function(first, limit) {
      if (typeof first === 'number') {
        first = this.nth(first);
      }
      if (first != null) {
        if (typeof limit === 'number') {
          limit = forward(first, limit);
        }
        removeRange(this, first, limit);
      }
    },

    spliceList: function(first, limit, insert) {
      var result = new SplayList(),
        root,
        last,
        prev;
      if (typeof first === 'number') {
        first = nth(this, first);
      }
      if (first == null) {
        limit = null;
      } else {
        if (typeof limit === 'number') {
          limit = forward(first, limit);
        }
        if (removeRange(this, first, limit)) {
          // Assemble spliced out return result.
          if (first._P !== null) {
            // One-level-down case.
            result._root = first._P;
          } else {
            // At-root case.
            result._root = first;
          }
          reorder(result, first);
          if (first._P !== null) {
            reorder(result, result._root);
          }
        }
      }
      if (insert != null && insert._root !== null) {
        if (insert.orderstats !== this.orderstats || insert.constructor !== this.constructor) {
          throw new TypeError('incompatible list');
        }
        if (limit == null) {
          //  (this)}      (insert)         (this)
          //                limit            limit
          //    L    +        \      ->      /  \
          //                   T            L    T
          splayUp(insert, (limit = insert.first()));
          limit._L = this._root;
          if (limit._L !== null) limit._L._P = limit;
          this._root = limit;
        } else if (limit._L === null) {
          //    (this)      (insert)          (this)
          //    limit                         limit
          //        \    +      T     ->      /   \
          //         R                       T     R
          limit._L = insert._root;
          limit._L._P = limit;
        } else {
          //    (this)      (insert)          (this)
          //    limit         root            limit
          //    /   \    +       \    ->      /   \
          //   L     R            T        root    R
          //                                /  \
          //                               L    T
          splayUp(insert, (root = insert.first()));
          root._L = limit._L;
          root._L._P = root;
          limit._L = root;
          root._P = limit;
          reorder(this, root);
        }
        reorder(this, limit);
        insert._root = null;
      }
      return result;
    },

    slice: function(loc, end) {
      var result = [];
      if (!loc) loc = this.first();
      if (typeof loc === 'number') {
        loc = this.nth(loc);
      }
      if (typeof end === 'number') {
        end = this.nth(end);
      }
      while (loc !== null && loc !== end) {
        result.push(loc.val());
        loc = loc.next();
      }
      return result;
    },

    splice: function(loc, count) {
      var values = Array.prototype.splice.call(arguments, 2);
      return this.spliceArray(loc, count, values);
    },

    spliceArray: function(loc, count, values) {
      var after,
        left,
        j,
        len,
        loc,
        result = [],
        numeric;
      Loc = this.constructor.Location;
      if (count == null) count = Infinity;
      numeric = typeof count === 'number';
      if (loc === 0) loc = this.first();
      else if (typeof loc === 'number') {
        loc = this.nth(loc);
      }
      if (loc !== null && (!numeric || count > 0)) {
        after = loc;
        while (after !== null) {
          if (numeric ? result.length >= count : after == count) break;
          result.push(after.val());
          after = after.next();
        }
        if (!numeric && after != count) {
          // If splicing locations and the "count" pointer doesn't come
          // after the starting location, then we should splice-nothing.
          result.length = 0;
          after = loc;
          splayUp(this, after);
        } else {
          removeRange(this, loc, after);
        }
      } else {
        after = loc;
        if (after !== null) {
          splayUp(this, after);
        }
      }
      if (values.length === 0) return result;
      j = values.length - 1;
      loc = new Loc(values[j]);
      while (--j >= 0) {
        sub = loc;
        loc = new Loc(values[j]);
        loc._R = sub;
        sub._P = loc;
        reorder(this, sub);
      }
      //   after                after
      //   /   \                /   \
      // left   T     ->    loc=[0]  T
      //                      / \
      //                  left  [1]
      //                          \
      //                           ...
      left = after === null ? this._root : after._L;
      if (left !== null) {
        loc._L = left;
        left._P = loc;
      }
      reorder(this, loc);
      if (after !== null) {
        after._L = loc;
        loc._P = after;
        this._root = after;
        reorder(this, after);
      } else {
        this._root = loc;
      }
      return result;
    },

    first: function() {
      return first(this);
    },

    last: function() {
      return last(this);
    },

    get length() {
      if (this._root === null) return 0;
      return this._root.n;
    },

    toString: function(out) {
      var result = null;
      if ('function' != typeof out) {
        result = [];
        out = function(s) {
          result.push(s);
          result.push('\n');
        };
      }
      dump(out, this._root, 0);
      if (result) {
        return result.join('');
      }
    }
  };

  // Simplify subclassing, for example, for overriding orderstats.
  var extend = function(proto) {
    var Baseclass = this,
      Subclass = function() {
        return Baseclass.apply(this, arguments);
      },
      k;
    Subclass.prototype = Object.create(Baseclass.prototype);
    for (k in proto)
      if (proto.hasOwnProperty(k)) {
        Object.defineProperty(Subclass.prototype, k, Object.getOwnPropertyDescriptor(proto, k));
      }
    Subclass.prototype.constructor = Subclass;
    for (k in Baseclass)
      if (Baseclass.hasOwnProperty(k)) {
        Object.defineProperty(Subclass, k, Object.getOwnPropertyDescriptor(Baseclass, k));
      }
    return Subclass;
  };

  SplayList.extend = extend;
  SplayList.Location = Location;

  //
  // Nodejs and AMD support: export the implementation as a module using
  // either convention.
  //
  if (module && module.exports) {
    // node.js
    module.exports = { SplayList: SplayList };
  } else if (define && define.amd) {
    // AMD
    define(function() {
      return { SplayList: SplayList };
    });
  } else {
    // plain script
    global.SplayList = SplayList;
  }

  // End anonymous scope, and pass initial values.
})(
  this, // global window object
  typeof module == 'object' && module, // present in node.js
  typeof define == 'function' && define // present with an AMD loader
);
