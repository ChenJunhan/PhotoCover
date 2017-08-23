// like jquery
(function () {
  window.$ = function (selector) {
    return new $.prototype.init(selector)
  };

  $.fn = $.prototype

  $.addClass = $.fn.addClass = function (className) {
    for (var i = 0; i < this.length; i++) {
      let node = this[i]

      if ([].slice.call(node.classList).indexOf(className) >= 0) {
        continue
      } else {
        node.classList.add(className)
      }
    }
    return this;
  }

  $.removeClass = $.fn.removeClass = function (className) {
    for (var i = 0; i < this.length; i++) {
      let node = this[i]

      if ([].slice.call(node.classList).indexOf(className) >= 0) {
        node.classList.remove(className)
      }
    }
    return this;
  }

  $.merge = $.fn.merge = function (first, second) {
    let len = second.length
    let j = 0
    let i = first.length

    for (let j = 0; j < len; j++) {
      first[i++] = second[j]
    }

    first.length = i

    return first
  }

  $.eq = $.fn.eq = function(index) {
    return this.merge(this.constructor(), this[index] ? [this[index]]: [])
  }

  $.siblings = $.fn.siblings = function () {
    let siblings = []
    let currents = []
    let all = []

    for (let i = 0; i < this.length; i++) {
      currents[i] = this[i]
    }

    siblings = [].slice.call(currents[0].parentNode.children).filter(function (node) {
      return currents.indexOf(node) < 0
    })

    return this.merge(this.constructor(), siblings)
  }

  $.prototype.init = function (selector) {
    if (arguments.length <= 0) {
      this.length = 0
      return this
    }

    if (selector instanceof Node || selector instanceof Window || selector instanceof HTMLDocument) {
      return this.merge(this.constructor(), [selector])
    }

    if (selector instanceof NodeList) {
      return this.merge(this.constructor(), selector)
    }

    var self = this;
    var nodes = [].slice.call(document.querySelectorAll(selector))

    this.selector = selector
    this.length = nodes.length

    nodes.forEach(function (node, i) {
      self[i] = node;
    })

    return this
  };

  $.fn.init.prototype = $.fn

  $.fn.init.prototype.on = function (eventType, child, callback) {
    if (typeof child === 'function') {
      callback = child;
      for (var i = 0; i < this.length; i++) {
        !function (index, node) {
          node.addEventListener(eventType, function (e) {
            callback.call(node, e)
          }, false);
        } (i, this[i])
      }
    }else {
      for (var i = 0; i < this.length; i++) {
        !function (index, node) {
          node.addEventListener(eventType, function (e) {
            let children = document.querySelectorAll(`#${node.id} ${child}`);
            let current = e.target;
            children.forEach((element, index) => {
              if (element === current || element === current.parentNode) {
                  callback.call(node, e, index)
              }
            })
          }, false);
        } (i, this[i])
      }
    }

    return this
  };

  $.fn.init.prototype.css = function (key, value) {
    if (arguments.length === 2) {
      for (var i = 0; i < this.length; i++) {
        this[i].style[key] = value;
      }
    } else if (arguments.length === 1 && typeof key === 'object') {
      var obj = key;

      for (var i = 0; i < this.length; i++) {
        for (var property in obj) {
          if (obj.hasOwnProperty(property)) {
            this[i].style[property] = obj[property]
          }
        }
      }
    }

    return this;
  };


  $.fn.init.prototype.click = function () {
    for (var i = 0; i < this.length; i++) {
      this[i].click();
    }
    return this;
  }

  $.isMobile = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);

}) ()


// extend of ECMA script
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
        return newval = handler.call(this, prop, oldval, val);
			}
			;
			
			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}

// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}
// if (!Object.prototype.watch) {
//   Object.defineProperty(Object.prototype, 'watch', {
//     enumerable: false,
//     configurable: true,
//     writable: false,
//     value: function (prop, handler) {
//       var newval = oldval = this[prop];

//       if (delete this[prop]) { // can't watch constants
//         Object.defineProperty(this, prop, {
//           get: function () {
//             return newval
//           },
//           set: function (val) {
//             oldval = newval;
//             return newval = handler.call(this, prop, oldval, val)
//           },
//           enumerable: true,
//           configurable: true
//         })
//       }
//     }
//   })
// }

// if(!Object.prototype.unwatch) {
//   Object.defineProperty(Object.prototype, 'unwatch', {
//     enumerable: false,
//     configurable: true,
//     writable: false,
//     value: function (prop) {
//       var val = this[prop];
//       delete this[prop];
//       this[prop] = val;
//     }
//   })
// }