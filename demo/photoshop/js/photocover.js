'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_OPTIONS = {
  RADIUS: 20,
  MAX_WIDTH: 800,
  COLOR: 'black',
  MOUSE: 'pen',
  PEN_BORDER_COLOR: 'red',
  ERASER_BORDER_COLOR: '#666',
  PEN: 'pen',
  ERASER: 'eraser'
};

var PhotoCover = function () {
  function PhotoCover(selector) {
    _classCallCheck(this, PhotoCover);

    this.radius = DEFAULT_OPTIONS.RADIUS;
    this.maxWidth = DEFAULT_OPTIONS.MAX_WIDTH;
    this.color = DEFAULT_OPTIONS.COLOR;
    this.mouseType = DEFAULT_OPTIONS.MOUSE;

    this.operateHistories = [];

    // selector
    if ((typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) === 'object') {
      this.img = selector;

      // image element
    } else if (typeof selector === 'string') {
      this.img = document.querySelector(selector);
    }

    this.win = window;
    this.doc = document;
    this.body = this.doc.body;

    this.mouse;
    this.width;
    this.height;
    this.left;
    this.top;
    this.canvas;
    this.ctx;

    // format = [{
    //   element: window,
    //   events: [function () {}, function () {}]
    // }]
    this.registeredEvents = [];

    this._init();
  }

  _createClass(PhotoCover, [{
    key: '_init',
    value: function _init() {
      var _this = this;

      if (!this.img) {
        throw Error('No Image Selected');
        return;
      }

      var _ref = [this.body, this.win, this.img],
          body = _ref[0],
          win = _ref[1],
          img = _ref[2];

      // initial canvas and its size and position

      this.width = img.width;
      this.height = img.height;

      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this._async();

      this.canvas.width = img.width;
      this.canvas.height = img.height;

      body.appendChild(this.canvas);

      this._initMouse();

      // async canvas position and size during browser resize
      var resize = function (e) {
        _this._async();
      }.bind(this);
      win.addEventListener('resize', resize, false);
      this._pushRegisteredEvents(win, 'resize', resize);

      var currentOperate = [];

      var canvasMouseDown = function (e) {
        e.preventDefault();

        currentOperate = [];
        currentOperate.push(_this.drawByEvent(e));

        win.addEventListener('mousemove', canvasMouseMove, false);
      }.bind(this);

      var canvasMouseMove = function (e) {
        e.preventDefault();
        currentOperate.push(_this.drawByEvent(e));
      }.bind(this);

      var canvasMouseUp = function (e) {
        win.removeEventListener('mousemove', canvasMouseMove, false);
        var coordinate = _this.getCoordinateByEvent(e);
        var _ref2 = [e.pageX, e.pageY],
            x = _ref2[0],
            y = _ref2[1];


        if (_this.isOnCanvas(x, y)) {
          _this.operateHistories.push(currentOperate);
          currentOperate = [];
        }
      }.bind(this);

      // canvas down
      win.addEventListener('mousedown', canvasMouseDown, false);
      this._pushRegisteredEvents(win, 'mousedown', canvasMouseDown);

      win.addEventListener('mouseup', canvasMouseUp, false);
      this._pushRegisteredEvents(win, 'mouseup', canvasMouseUp);
    }

    // async x and y from image to canvas

  }, {
    key: '_async',
    value: function _async() {
      var coordinate = this.img.getBoundingClientRect();
      this.top = coordinate.top;
      this.left = coordinate.left;

      this.canvas.style.cssText = '\n      position: absolute;\n      left: ' + (this.left + this.body.scrollLeft) + 'px;\n      top: ' + (this.top + this.body.scrollTop) + 'px;\n      use-select: none;\n    ';
    }

    /**
     * save binds events
     * @param  {DOM} _element  DOM that you bind event
     * @param  {String} _event  event name
     * @param  {Function} _function event function
     * @return {Boolean} true when save success
     */

  }, {
    key: '_pushRegisteredEvents',
    value: function _pushRegisteredEvents(_element, _event, _function) {

      this.registeredEvents.push({
        'element': _element,
        'event': _event,
        'function': _function
      });

      return true;
    }

    // initial mouse shape where mouse on canvas

  }, {
    key: '_initMouse',
    value: function _initMouse(type) {
      var _this2 = this;

      var _ref3 = [this.body, this.win],
          body = _ref3[0],
          win = _ref3[1];

      var mouse = document.createElement('div');
      mouse.style.cssText = '\n      display: none;\n      position: absolute;\n      left: 0;\n      top: 0;\n      z-index: 10001;\n      width: ' + this.radius * 2 + 'px;\n      height: ' + this.radius * 2 + 'px;\n      border: 1px solid red;\n      border-radius: 100%;\n    ';
      this.mouse = mouse;

      body.appendChild(mouse);

      var mouseMove = function (e) {
        console.log(e);
        var _ref4 = [e.pageX, e.pageY],
            x = _ref4[0],
            y = _ref4[1];

        var isOnCanvas = _this2.isOnCanvas(x, y);

        mouse.style.transform = 'translate(' + (x - _this2.radius) + 'px, ' + (y - _this2.radius) + 'px)';

        if (!isOnCanvas) {
          mouse.style.display = 'none';
          body.style.cursor = 'default';
        } else {
          mouse.style.display = 'block';
          body.style.cursor = 'none';
        }
      }.bind(this);

      // change mouse style
      win.addEventListener('mousemove', mouseMove, false);
      this._pushRegisteredEvents(win, 'mousemove', mouseMove);
    }
  }, {
    key: 'setRadius',
    value: function setRadius(radius) {
      if (radius < 2 || radius > 100) {
        return;
      }

      var mouse = this.mouse;
      this.radius = radius;

      mouse.style.width = radius * 2 + 'px';
      mouse.style.height = radius * 2 + 'px';
    }
  }, {
    key: 'zoomIn',
    value: function zoomIn() {
      var radius = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;

      this.setRadius(this.radius + radius);
    }
  }, {
    key: 'zoomOut',
    value: function zoomOut() {
      var radius = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;

      this.setRadius(this.radius - radius);
    }
  }, {
    key: 'drawCircle',
    value: function drawCircle(x, y, radius) {
      var ctx = this.ctx;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, radius || this.radius, 0, 360);
      ctx.fill();
      ctx.closePath();
    }
  }, {
    key: 'getCoordinateByEvent',
    value: function getCoordinateByEvent(event) {
      var x = void 0,
          y = void 0;
      var _ref5 = [this.doc, this.body],
          doc = _ref5[0],
          body = _ref5[1];

      var canvas = this.canvas;

      if (event.pageX || event.pageY) {
        x = event.pageX;
        y = event.pageY;
      } else {
        x = e.clientX + body.scrollLeft + doc.documentElement.scrollLeft;
        y = e.clientY + body.scrollTop + doc.documentElement.scrollTop;
      }

      x -= canvas.offsetLeft;
      y -= canvas.offsetTop;

      return [x, y];
    }
  }, {
    key: 'drawByEvent',
    value: function drawByEvent(event) {
      if (!this.ctx) return;

      var ctx = this.ctx;

      var _getCoordinateByEvent = this.getCoordinateByEvent(event),
          _getCoordinateByEvent2 = _slicedToArray(_getCoordinateByEvent, 2),
          x = _getCoordinateByEvent2[0],
          y = _getCoordinateByEvent2[1];

      if (this.mouseType === DEFAULT_OPTIONS.PEN) {
        this.drawCircle(x, y);
        return [DEFAULT_OPTIONS.PEN, this.color, x, y, this.radius];
      } else if (this.mouseType === DEFAULT_OPTIONS.ERASER) {
        x -= this.radius;
        y -= this.radius;
        var w = this.radius * 2,
            h = this.radius * 2;

        ctx.clearRect(x, y, w, h);
        return [DEFAULT_OPTIONS.ERASER, x, y, w, h];
      }
    }
  }, {
    key: 'isOnCanvas',
    value: function isOnCanvas(x, y) {
      var body = this.body;
      var scrollTop = body.scrollTop;

      if (x < this.left || x > this.left + this.width || y < scrollTop + this.top || y > scrollTop + this.top + this.height) {
        return false;
      } else {
        return true;
      }
    }
  }, {
    key: 'setMaxWidth',
    value: function setMaxWidth(width) {
      this.maxWidth = width;
    }
  }, {
    key: 'setColor',
    value: function setColor(color) {
      this.color = color;
    }

    // pen, eraser

  }, {
    key: 'setTool',
    value: function setTool(tool) {
      this.mouseType = tool;

      if (tool.toLowerCase() === DEFAULT_OPTIONS.PEN) {
        this.setPen();
      } else if (tool.toLowerCase() === DEFAULT_OPTIONS.ERASER) {
        this.setEraser();
      }
    }
  }, {
    key: 'setPen',
    value: function setPen() {
      var mouse = this.mouse;
      Object.assign(mouse.style, {
        borderRadius: '100%',
        border: '1px solid ' + DEFAULT_OPTIONS.PEN_BORDER_COLOR
      });

      this.mouseType = DEFAULT_OPTIONS.PEN;
    }
  }, {
    key: 'setEraser',
    value: function setEraser() {
      var mouse = this.mouse;
      Object.assign(mouse.style, {
        borderRadius: 0,
        border: '1px dashed ' + DEFAULT_OPTIONS.ERASER_BORDER_COLOR
      });

      this.mouseType = DEFAULT_OPTIONS.ERASER;
    }
  }, {
    key: 'undo',
    value: function undo() {
      var _this3 = this;

      var ctx = this.ctx;
      var color = this.color;

      ctx.clearRect(0, 0, this.width, this.height);
      this.operateHistories.pop();

      this.operateHistories.map(function (steps) {
        steps.map(function (step) {
          if (step[0] === DEFAULT_OPTIONS.PEN) {
            _this3.color = step[1];
            _this3.drawCircle.apply(_this3, step.slice(2));
          } else if (step[0] === DEFAULT_OPTIONS.ERASER) {
            ctx.clearRect.apply(ctx, step.slice(1));
          }
        });
      });

      this.color = color;
    }

    /**
     * get image origin size
     * @param  {String}   src      iamge source url
     * @param  {Function} callback callback function, width as first parameter and height as second
     * @return {undefined}
     */

  }, {
    key: 'getImageOriginSize',
    value: function getImageOriginSize(src, callback) {
      var img = new Image();

      img.onload = function () {
        var width = img.width;
        var height = img.height;

        callback(width, height);
      };

      img.src = src;
    }
  }, {
    key: 'getDataURL',
    value: function getDataURL() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/jpeg';

      var _this4 = this;

      var quality = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.8;
      var callback = arguments[2];


      var src = this.img.src;

      this.getImageOriginSize(src, function (width, height) {
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        var tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(_this4.img, 0, 0, width, height);
        tempCtx.drawImage(_this4.canvas, 0, 0, width, height);

        callback(tempCanvas.toDataURL(type, quality));
      });
    }

    /**
     * remove dom that added into body,
     * remove all events that registered
     * @return {undefined}
     */

  }, {
    key: 'destroy',
    value: function destroy() {
      this.canvas.parentNode.removeChild(this.canvas);
      this.mouse.parentNode.removeChild(this.mouse);

      this.img.src = '';

      this.registeredEvents.forEach(function (v) {
        v.element.removeEventListener(v.event, v.function, false);
      });
      delete this;
    }
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJyZWdpc3RlcmVkRXZlbnRzIiwiX2luaXQiLCJFcnJvciIsImNyZWF0ZUVsZW1lbnQiLCJnZXRDb250ZXh0IiwiX2FzeW5jIiwiYXBwZW5kQ2hpbGQiLCJfaW5pdE1vdXNlIiwicmVzaXplIiwiYmluZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJfcHVzaFJlZ2lzdGVyZWRFdmVudHMiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlRG93biIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInB1c2giLCJkcmF3QnlFdmVudCIsImNhbnZhc01vdXNlTW92ZSIsImNhbnZhc01vdXNlVXAiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiY29vcmRpbmF0ZSIsImdldENvb3JkaW5hdGVCeUV2ZW50IiwicGFnZVgiLCJwYWdlWSIsIngiLCJ5IiwiaXNPbkNhbnZhcyIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInN0eWxlIiwiY3NzVGV4dCIsInNjcm9sbExlZnQiLCJzY3JvbGxUb3AiLCJfZWxlbWVudCIsIl9ldmVudCIsIl9mdW5jdGlvbiIsInR5cGUiLCJtb3VzZU1vdmUiLCJjb25zb2xlIiwibG9nIiwidHJhbnNmb3JtIiwiZGlzcGxheSIsImN1cnNvciIsInNldFJhZGl1cyIsImZpbGxTdHlsZSIsImJlZ2luUGF0aCIsImFyYyIsImZpbGwiLCJjbG9zZVBhdGgiLCJldmVudCIsImNsaWVudFgiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGllbnRZIiwib2Zmc2V0TGVmdCIsIm9mZnNldFRvcCIsImRyYXdDaXJjbGUiLCJ3IiwiaCIsImNsZWFyUmVjdCIsInRvb2wiLCJ0b0xvd2VyQ2FzZSIsInNldFBlbiIsInNldEVyYXNlciIsIk9iamVjdCIsImFzc2lnbiIsImJvcmRlclJhZGl1cyIsImJvcmRlciIsInBvcCIsIm1hcCIsInN0ZXBzIiwic3RlcCIsImFwcGx5Iiwic2xpY2UiLCJzcmMiLCJjYWxsYmFjayIsIkltYWdlIiwib25sb2FkIiwicXVhbGl0eSIsImdldEltYWdlT3JpZ2luU2l6ZSIsInRlbXBDYW52YXMiLCJ0ZW1wQ3R4IiwiZHJhd0ltYWdlIiwidG9EYXRhVVJMIiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwiZm9yRWFjaCIsInYiLCJlbGVtZW50IiwiZnVuY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxrQkFBa0I7QUFDdEJDLFVBQVEsRUFEYztBQUV0QkMsYUFBVyxHQUZXO0FBR3RCQyxTQUFPLE9BSGU7QUFJdEJDLFNBQU8sS0FKZTtBQUt0QkMsb0JBQWtCLEtBTEk7QUFNdEJDLHVCQUFxQixNQU5DO0FBT3RCQyxPQUFLLEtBUGlCO0FBUXRCQyxVQUFRO0FBUmMsQ0FBeEI7O0lBV01DLFU7QUFDSixzQkFBWUMsUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLQyxNQUFMLEdBQWNYLGdCQUFnQkMsTUFBOUI7QUFDQSxTQUFLVyxRQUFMLEdBQWdCWixnQkFBZ0JFLFNBQWhDO0FBQ0EsU0FBS1csS0FBTCxHQUFhYixnQkFBZ0JHLEtBQTdCO0FBQ0EsU0FBS1csU0FBTCxHQUFpQmQsZ0JBQWdCSSxLQUFqQzs7QUFFQSxTQUFLVyxnQkFBTCxHQUF3QixFQUF4Qjs7QUFFQTtBQUNBLFFBQUksUUFBT0wsUUFBUCx5Q0FBT0EsUUFBUCxPQUFv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TUFBTCxDQUFZcUYsVUFBWixDQUF1QkMsV0FBdkIsQ0FBbUMsS0FBS3RGLE1BQXhDO0FBQ0EsV0FBS0wsS0FBTCxDQUFXMEYsVUFBWCxDQUFzQkMsV0FBdEIsQ0FBa0MsS0FBSzNGLEtBQXZDOztBQUVBLFdBQUtQLEdBQUwsQ0FBU3VGLEdBQVQsR0FBZSxFQUFmOztBQUVBLFdBQUt6RSxnQkFBTCxDQUFzQnFGLE9BQXRCLENBQThCLGFBQUs7QUFDakNDLFVBQUVDLE9BQUYsQ0FBVW5FLG1CQUFWLENBQThCa0UsRUFBRXJDLEtBQWhDLEVBQXVDcUMsRUFBRUUsUUFBekMsRUFBbUQsS0FBbkQ7QUFDRCxPQUZEO0FBR0EsYUFBTyxJQUFQO0FBQ0QiLCJmaWxlIjoicGhvdG9jb3Zlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcclxuICBSQURJVVM6IDIwLFxyXG4gIE1BWF9XSURUSDogODAwLFxyXG4gIENPTE9SOiAnYmxhY2snLFxyXG4gIE1PVVNFOiAncGVuJyxcclxuICBQRU5fQk9SREVSX0NPTE9SOiAncmVkJyxcclxuICBFUkFTRVJfQk9SREVSX0NPTE9SOiAnIzY2NicsXHJcbiAgUEVOOiAncGVuJyxcclxuICBFUkFTRVI6ICdlcmFzZXInXHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IERFRkFVTFRfT1BUSU9OUy5SQURJVVNcclxuICAgIHRoaXMubWF4V2lkdGggPSBERUZBVUxUX09QVElPTlMuTUFYX1dJRFRIXHJcbiAgICB0aGlzLmNvbG9yID0gREVGQVVMVF9PUFRJT05TLkNPTE9SXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5NT1VTRVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3RvcmllcyA9IFtdXHJcblxyXG4gICAgLy8gc2VsZWN0b3JcclxuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMuaW1nID0gc2VsZWN0b3JcclxuXHJcbiAgICAgIC8vIGltYWdlIGVsZW1lbnRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy53aW4gPSB3aW5kb3dcclxuICAgIHRoaXMuZG9jID0gZG9jdW1lbnRcclxuICAgIHRoaXMuYm9keSA9IHRoaXMuZG9jLmJvZHlcclxuXHJcbiAgICB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodFxyXG4gICAgdGhpcy5sZWZ0XHJcbiAgICB0aGlzLnRvcFxyXG4gICAgdGhpcy5jYW52YXNcclxuICAgIHRoaXMuY3R4XHJcblxyXG4gICAgLy8gZm9ybWF0ID0gW3tcclxuICAgIC8vICAgZWxlbWVudDogd2luZG93LFxyXG4gICAgLy8gICBldmVudHM6IFtmdW5jdGlvbiAoKSB7fSwgZnVuY3Rpb24gKCkge31dXHJcbiAgICAvLyB9XVxyXG4gICAgdGhpcy5yZWdpc3RlcmVkRXZlbnRzID0gW11cclxuXHJcbiAgICB0aGlzLl9pbml0KClcclxuICB9XHJcblxyXG4gIF9pbml0KCkge1xyXG4gICAgaWYgKCF0aGlzLmltZykge1xyXG4gICAgICB0aHJvdyBFcnJvcignTm8gSW1hZ2UgU2VsZWN0ZWQnKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbiwgaW1nXSA9IFt0aGlzLmJvZHksIHRoaXMud2luLCB0aGlzLmltZ11cclxuXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgdGhpcy5faW5pdE1vdXNlKClcclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICBsZXQgcmVzaXplID0gKGUgPT4ge1xyXG4gICAgICB0aGlzLl9hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSlcclxuICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3Jlc2l6ZScsIHJlc2l6ZSlcclxuXHJcblxyXG4gICAgbGV0IGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VEb3duID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlVXAgPSAoKGUpID0+IHtcclxuICAgICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcblxyXG4gICAgICBpZiAodGhpcy5pc09uQ2FudmFzKHgsIHkpKSB7XHJcbiAgICAgICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2FudmFzIGRvd25cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24sIGZhbHNlKVxyXG4gICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAnbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duKVxyXG5cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgY2FudmFzTW91c2VVcCwgZmFsc2UpXHJcbiAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdtb3VzZXVwJywgY2FudmFzTW91c2VVcClcclxuICB9XHJcblxyXG4gIC8vIGFzeW5jIHggYW5kIHkgZnJvbSBpbWFnZSB0byBjYW52YXNcclxuICBfYXN5bmMoKSB7XHJcbiAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICB0aGlzLnRvcCA9IGNvb3JkaW5hdGUudG9wXHJcbiAgICB0aGlzLmxlZnQgPSBjb29yZGluYXRlLmxlZnRcclxuXHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5sZWZ0ICsgdGhpcy5ib2R5LnNjcm9sbExlZnR9cHg7XHJcbiAgICAgIHRvcDogJHt0aGlzLnRvcCArIHRoaXMuYm9keS5zY3JvbGxUb3B9cHg7XHJcbiAgICAgIHVzZS1zZWxlY3Q6IG5vbmU7XHJcbiAgICBgXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBzYXZlIGJpbmRzIGV2ZW50c1xyXG4gICAqIEBwYXJhbSAge0RPTX0gX2VsZW1lbnQgIERPTSB0aGF0IHlvdSBiaW5kIGV2ZW50XHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSBfZXZlbnQgIGV2ZW50IG5hbWVcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gX2Z1bmN0aW9uIGV2ZW50IGZ1bmN0aW9uXHJcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSB3aGVuIHNhdmUgc3VjY2Vzc1xyXG4gICAqL1xyXG4gIF9wdXNoUmVnaXN0ZXJlZEV2ZW50cyhfZWxlbWVudCwgX2V2ZW50LCBfZnVuY3Rpb24pIHtcclxuXHJcbiAgICB0aGlzLnJlZ2lzdGVyZWRFdmVudHMucHVzaCh7XHJcbiAgICAgICdlbGVtZW50JzogX2VsZW1lbnQsXHJcbiAgICAgICdldmVudCc6IF9ldmVudCxcclxuICAgICAgJ2Z1bmN0aW9uJzogX2Z1bmN0aW9uXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiB0cnVlXHJcblxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBfaW5pdE1vdXNlKHR5cGUpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB6LWluZGV4OiAxMDAwMTtcclxuICAgICAgd2lkdGg6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBoZWlnaHQ6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XHJcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XHJcbiAgICBgXHJcbiAgICB0aGlzLm1vdXNlID0gbW91c2VcclxuXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKG1vdXNlKVxyXG5cclxuICAgIGxldCBtb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1c31weCwgJHt5IC0gdGhpcy5yYWRpdXN9cHgpYFxyXG5cclxuICAgICAgaWYgKCFpc09uQ2FudmFzKSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdub25lJ1xyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlLCBmYWxzZSlcclxuICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZSlcclxuXHJcbiAgfVxyXG5cclxuICBzZXRSYWRpdXMocmFkaXVzKSB7XHJcbiAgICBpZiAocmFkaXVzIDwgMiB8fCByYWRpdXMgPiAxMDApIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXNcclxuXHJcbiAgICBtb3VzZS5zdHlsZS53aWR0aCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgICBtb3VzZS5zdHlsZS5oZWlnaHQgPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gIH1cclxuXHJcbiAgem9vbUluKHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzICsgcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgem9vbU91dChyYWRpdXMgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyAtIHJhZGl1cylcclxuICB9XHJcblxyXG4gIGRyYXdDaXJjbGUoeCwgeSwgcmFkaXVzKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpXHJcbiAgICBjdHguYXJjKHggKyAxLCB5ICsgMSwgcmFkaXVzIHx8IHRoaXMucmFkaXVzLCAwLCAzNjApXHJcbiAgICBjdHguZmlsbCgpXHJcbiAgICBjdHguY2xvc2VQYXRoKClcclxuICB9XHJcblxyXG5cclxuICBnZXRDb29yZGluYXRlQnlFdmVudChldmVudCkge1xyXG4gICAgbGV0IHgsIHlcclxuICAgIGxldCBbZG9jLCBib2R5XSA9IFt0aGlzLmRvYywgdGhpcy5ib2R5XVxyXG4gICAgbGV0IGNhbnZhcyA9IHRoaXMuY2FudmFzXHJcblxyXG5cclxuICAgIGlmIChldmVudC5wYWdlWCB8fCBldmVudC5wYWdlWSkge1xyXG4gICAgICB4ID0gZXZlbnQucGFnZVhcclxuICAgICAgeSA9IGV2ZW50LnBhZ2VZXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB4ID0gZS5jbGllbnRYICsgYm9keS5zY3JvbGxMZWZ0ICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0XHJcbiAgICAgIHkgPSBlLmNsaWVudFkgKyBib2R5LnNjcm9sbFRvcCArIGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXHJcbiAgICB9XHJcblxyXG4gICAgeCAtPSBjYW52YXMub2Zmc2V0TGVmdFxyXG4gICAgeSAtPSBjYW52YXMub2Zmc2V0VG9wXHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XVxyXG4gIH1cclxuXHJcbiAgZHJhd0J5RXZlbnQoZXZlbnQpIHtcclxuICAgIGlmICghdGhpcy5jdHgpIHJldHVyblxyXG5cclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IFt4LCB5XSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpXHJcblxyXG4gICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuZHJhd0NpcmNsZSh4LCB5KVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB4IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIHkgLT0gdGhpcy5yYWRpdXNcclxuICAgICAgbGV0IFt3LCBoXSA9IFt0aGlzLnJhZGl1cyAqIDIsIHRoaXMucmFkaXVzICogMl1cclxuICAgICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5FUkFTRVIsIHgsIHksIHcsIGhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHkpIHtcclxuICAgIGxldCBib2R5ID0gdGhpcy5ib2R5XHJcbiAgICBsZXQgc2Nyb2xsVG9wID0gYm9keS5zY3JvbGxUb3BcclxuXHJcbiAgICBpZiAoeCA8IHRoaXMubGVmdCB8fCB4ID4gKHRoaXMubGVmdCArIHRoaXMud2lkdGgpIHx8IHkgPCAoc2Nyb2xsVG9wICsgdGhpcy50b3ApIHx8IHkgPiAoc2Nyb2xsVG9wICsgdGhpcy50b3AgKyB0aGlzLmhlaWdodCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0TWF4V2lkdGgod2lkdGgpIHtcclxuICAgIHRoaXMubWF4V2lkdGggPSB3aWR0aFxyXG4gIH1cclxuXHJcbiAgc2V0Q29sb3IoY29sb3IpIHtcclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcbiAgLy8gcGVuLCBlcmFzZXJcclxuICBzZXRUb29sKHRvb2wpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gdG9vbFxyXG5cclxuICAgIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgdGhpcy5zZXRQZW4oKVxyXG4gICAgfSBlbHNlIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgdGhpcy5zZXRFcmFzZXIoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHNldFBlbigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke0RFRkFVTFRfT1BUSU9OUy5QRU5fQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuUEVOXHJcbiAgfVxyXG5cclxuICBzZXRFcmFzZXIoKSB7XHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICBPYmplY3QuYXNzaWduKG1vdXNlLnN0eWxlLCB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogMCxcclxuICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke0RFRkFVTFRfT1BUSU9OUy5FUkFTRVJfQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuRVJBU0VSXHJcbiAgfVxyXG5cclxuICB1bmRvKCkge1xyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgY29sb3IgPSB0aGlzLmNvbG9yXHJcblxyXG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcclxuICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5wb3AoKVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5tYXAoKHN0ZXBzKSA9PiB7XHJcbiAgICAgIHN0ZXBzLm1hcCgoc3RlcCkgPT4ge1xyXG4gICAgICAgIGlmIChzdGVwWzBdID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbG9yID0gc3RlcFsxXVxyXG4gICAgICAgICAgdGhpcy5kcmF3Q2lyY2xlLmFwcGx5KHRoaXMsIHN0ZXAuc2xpY2UoMikpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgICAgICBjdHguY2xlYXJSZWN0LmFwcGx5KGN0eCwgc3RlcC5zbGljZSgxKSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCBpbWFnZSBvcmlnaW4gc2l6ZVxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICBzcmMgICAgICBpYW1nZSBzb3VyY2UgdXJsXHJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrIGZ1bmN0aW9uLCB3aWR0aCBhcyBmaXJzdCBwYXJhbWV0ZXIgYW5kIGhlaWdodCBhcyBzZWNvbmRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgY2FsbGJhY2spIHtcclxuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKVxyXG5cclxuICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGxldCB3aWR0aCA9IGltZy53aWR0aFxyXG4gICAgICBsZXQgaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgICAgY2FsbGJhY2sod2lkdGgsIGhlaWdodClcclxuICAgIH1cclxuXHJcbiAgICBpbWcuc3JjID0gc3JjXHJcbiAgfVxyXG5cclxuICBnZXREYXRhVVJMKHR5cGUgPSAnaW1hZ2UvanBlZycsIHF1YWxpdHkgPSAwLjgsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgbGV0IHNyYyA9IHRoaXMuaW1nLnNyY1xyXG5cclxuICAgIHRoaXMuZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgKHdpZHRoLCBoZWlnaHQpID0+IHtcclxuICAgICAgbGV0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICB0ZW1wQ2FudmFzLndpZHRoID0gd2lkdGhcclxuICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgICAgbGV0IHRlbXBDdHggPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgICAgY2FsbGJhY2sodGVtcENhbnZhcy50b0RhdGFVUkwodHlwZSwgcXVhbGl0eSkpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmVtb3ZlIGRvbSB0aGF0IGFkZGVkIGludG8gYm9keSxcclxuICAgKiByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IHJlZ2lzdGVyZWRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpXHJcbiAgICB0aGlzLm1vdXNlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5tb3VzZSlcclxuXHJcbiAgICB0aGlzLmltZy5zcmMgPSAnJ1xyXG5cclxuICAgIHRoaXMucmVnaXN0ZXJlZEV2ZW50cy5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICB2LmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih2LmV2ZW50LCB2LmZ1bmN0aW9uLCBmYWxzZSlcclxuICAgIH0pXHJcbiAgICBkZWxldGUgdGhpc1xyXG4gIH1cclxufVxyXG4iXX0=
