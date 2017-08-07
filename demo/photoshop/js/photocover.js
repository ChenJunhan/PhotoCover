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
    this.isMobile = navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1;

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

      if (!this.isMobile) {
        this._initMouse();
      }

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

        if (!_this.isMobile) {
          win.addEventListener('mousemove', canvasMouseMove, false);
        } else {
          win.addEventListener('touchmove', canvasMouseMove, false);
        }
      }.bind(this);

      var canvasMouseMove = function (e) {
        e.preventDefault();
        currentOperate.push(_this.drawByEvent(e));
      }.bind(this);

      var canvasMouseUp = function (e) {
        e.preventDefault();

        if (!_this.isMobile) {
          win.removeEventListener('mousemove', canvasMouseMove, false);
        } else {
          win.removeEventListener('touchmove', canvasMouseMove, false);
        }

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
      if (!this.isMobile) {
        win.addEventListener('mousedown', canvasMouseDown, false);
        this._pushRegisteredEvents(win, 'mousedown', canvasMouseDown);

        win.addEventListener('mouseup', canvasMouseUp, false);
        this._pushRegisteredEvents(win, 'mouseup', canvasMouseUp);
      } else {
        win.addEventListener('touchstart', canvasMouseDown, false);
        this._pushRegisteredEvents(win, 'touchstart', canvasMouseDown);

        win.addEventListener('touchend', canvasMouseUp, false);
        this._pushRegisteredEvents(win, 'touchend', canvasMouseUp);
      }
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
      if (!this.isMobile) {
        win.addEventListener('mousemove', mouseMove, false);
        this._pushRegisteredEvents(win, 'mousemove', mouseMove);
      } else {
        win.addEventListener('touchmove', mouseMove, false);
        this._pushRegisteredEvents(win, 'touchmove', mouseMove);
      }
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

      if (this.isMobile) {
        event = event.changedTouches[0];
      }

      if (event.pageX || event.pageY) {
        x = event.pageX;
        y = event.pageY;
      } else {
        x = event.clientX + body.scrollLeft + doc.documentElement.scrollLeft;
        y = event.clientY + body.scrollTop + doc.documentElement.scrollTop;
      }

      x -= canvas.offsetLeft;
      y -= canvas.offsetTop;

      // console.log(x, y)

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsImlzTW9iaWxlIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaW5kZXhPZiIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJyZWdpc3RlcmVkRXZlbnRzIiwiX2luaXQiLCJFcnJvciIsImNyZWF0ZUVsZW1lbnQiLCJnZXRDb250ZXh0IiwiX2FzeW5jIiwiYXBwZW5kQ2hpbGQiLCJfaW5pdE1vdXNlIiwicmVzaXplIiwiYmluZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJfcHVzaFJlZ2lzdGVyZWRFdmVudHMiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlRG93biIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInB1c2giLCJkcmF3QnlFdmVudCIsImNhbnZhc01vdXNlTW92ZSIsImNhbnZhc01vdXNlVXAiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiY29vcmRpbmF0ZSIsImdldENvb3JkaW5hdGVCeUV2ZW50IiwicGFnZVgiLCJwYWdlWSIsIngiLCJ5IiwiaXNPbkNhbnZhcyIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInN0eWxlIiwiY3NzVGV4dCIsInNjcm9sbExlZnQiLCJzY3JvbGxUb3AiLCJfZWxlbWVudCIsIl9ldmVudCIsIl9mdW5jdGlvbiIsInR5cGUiLCJtb3VzZU1vdmUiLCJ0cmFuc2Zvcm0iLCJkaXNwbGF5IiwiY3Vyc29yIiwic2V0UmFkaXVzIiwiZmlsbFN0eWxlIiwiYmVnaW5QYXRoIiwiYXJjIiwiZmlsbCIsImNsb3NlUGF0aCIsImV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJjbGllbnRYIiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50WSIsIm9mZnNldExlZnQiLCJvZmZzZXRUb3AiLCJkcmF3Q2lyY2xlIiwidyIsImgiLCJjbGVhclJlY3QiLCJ0b29sIiwidG9Mb3dlckNhc2UiLCJzZXRQZW4iLCJzZXRFcmFzZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIiwic3JjIiwiY2FsbGJhY2siLCJJbWFnZSIsIm9ubG9hZCIsInF1YWxpdHkiLCJnZXRJbWFnZU9yaWdpblNpemUiLCJ0ZW1wQ2FudmFzIiwidGVtcEN0eCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsImZvckVhY2giLCJ2IiwiZWxlbWVudCIsImZ1bmN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBTUEsa0JBQWtCO0FBQ3RCQyxVQUFRLEVBRGM7QUFFdEJDLGFBQVcsR0FGVztBQUd0QkMsU0FBTyxPQUhlO0FBSXRCQyxTQUFPLEtBSmU7QUFLdEJDLG9CQUFrQixLQUxJO0FBTXRCQyx1QkFBcUIsTUFOQztBQU90QkMsT0FBSyxLQVBpQjtBQVF0QkMsVUFBUTtBQVJjLENBQXhCOztJQVdNQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFjWCxnQkFBZ0JDLE1BQTlCO0FBQ0EsU0FBS1csUUFBTCxHQUFnQlosZ0JBQWdCRSxTQUFoQztBQUNBLFNBQUtXLEtBQUwsR0FBYWIsZ0JBQWdCRyxLQUE3QjtBQUNBLFNBQUtXLFNBQUwsR0FBaUJkLGdCQUFnQkksS0FBakM7QUFDQSxTQUFLVyxRQUFMLEdBQWdCQyxVQUFV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Q0FBcUI3QyxJQUFyQixFQUEyQndDLE9BQTNCLENBQVQ7QUFDRCxPQVREO0FBVUQ7O0FBRUQ7Ozs7Ozs7OzhCQUtVO0FBQ1IsV0FBSzlFLE1BQUwsQ0FBWW9GLFVBQVosQ0FBdUJDLFdBQXZCLENBQW1DLEtBQUtyRixNQUF4QztBQUNBLFdBQUtMLEtBQUwsQ0FBV3lGLFVBQVgsQ0FBc0JDLFdBQXRCLENBQWtDLEtBQUsxRixLQUF2Qzs7QUFFQSxXQUFLUCxHQUFMLENBQVNzRixHQUFULEdBQWUsRUFBZjs7QUFFQSxXQUFLeEUsZ0JBQUwsQ0FBc0JvRixPQUF0QixDQUE4QixhQUFLO0FBQ2pDQyxVQUFFQyxPQUFGLENBQVVsRSxtQkFBVixDQUE4QmlFLEVBQUV0QyxLQUFoQyxFQUF1Q3NDLEVBQUVFLFFBQXpDLEVBQW1ELEtBQW5EO0FBQ0QsT0FGRDtBQUdBLGFBQU8sSUFBUDtBQUNEIiwiZmlsZSI6InBob3RvY292ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBERUZBVUxUX09QVElPTlMgPSB7XHJcbiAgUkFESVVTOiAyMCxcclxuICBNQVhfV0lEVEg6IDgwMCxcclxuICBDT0xPUjogJ2JsYWNrJyxcclxuICBNT1VTRTogJ3BlbicsXHJcbiAgUEVOX0JPUkRFUl9DT0xPUjogJ3JlZCcsXHJcbiAgRVJBU0VSX0JPUkRFUl9DT0xPUjogJyM2NjYnLFxyXG4gIFBFTjogJ3BlbicsXHJcbiAgRVJBU0VSOiAnZXJhc2VyJ1xyXG59XHJcblxyXG5jbGFzcyBQaG90b0NvdmVyIHtcclxuICBjb25zdHJ1Y3RvcihzZWxlY3Rvcikge1xyXG4gICAgdGhpcy5yYWRpdXMgPSBERUZBVUxUX09QVElPTlMuUkFESVVTXHJcbiAgICB0aGlzLm1heFdpZHRoID0gREVGQVVMVF9PUFRJT05TLk1BWF9XSURUSFxyXG4gICAgdGhpcy5jb2xvciA9IERFRkFVTFRfT1BUSU9OUy5DT0xPUlxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuTU9VU0VcclxuICAgIHRoaXMuaXNNb2JpbGUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ2lQaG9uZScpID4gLTEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAtMVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3RvcmllcyA9IFtdXHJcblxyXG4gICAgLy8gc2VsZWN0b3JcclxuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMuaW1nID0gc2VsZWN0b3JcclxuXHJcbiAgICAgIC8vIGltYWdlIGVsZW1lbnRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy53aW4gPSB3aW5kb3dcclxuICAgIHRoaXMuZG9jID0gZG9jdW1lbnRcclxuICAgIHRoaXMuYm9keSA9IHRoaXMuZG9jLmJvZHlcclxuXHJcbiAgICB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodFxyXG4gICAgdGhpcy5sZWZ0XHJcbiAgICB0aGlzLnRvcFxyXG4gICAgdGhpcy5jYW52YXNcclxuICAgIHRoaXMuY3R4XHJcblxyXG4gICAgLy8gZm9ybWF0ID0gW3tcclxuICAgIC8vICAgZWxlbWVudDogd2luZG93LFxyXG4gICAgLy8gICBldmVudHM6IFtmdW5jdGlvbiAoKSB7fSwgZnVuY3Rpb24gKCkge31dXHJcbiAgICAvLyB9XVxyXG4gICAgdGhpcy5yZWdpc3RlcmVkRXZlbnRzID0gW11cclxuXHJcbiAgICB0aGlzLl9pbml0KClcclxuICB9XHJcblxyXG4gIF9pbml0KCkge1xyXG4gICAgaWYgKCF0aGlzLmltZykge1xyXG4gICAgICB0aHJvdyBFcnJvcignTm8gSW1hZ2UgU2VsZWN0ZWQnKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbiwgaW1nXSA9IFt0aGlzLmJvZHksIHRoaXMud2luLCB0aGlzLmltZ11cclxuXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7IHRoaXMuX2luaXRNb3VzZSgpIH1cclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICBsZXQgcmVzaXplID0gKGUgPT4ge1xyXG4gICAgICB0aGlzLl9hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSlcclxuICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3Jlc2l6ZScsIHJlc2l6ZSlcclxuXHJcblxyXG4gICAgbGV0IGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VEb3duID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICBpZiAoIXRoaXMuaXNNb2JpbGUpIHsgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpIH1cclxuICAgICAgZWxzZSB7IHdpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKSB9XHJcbiAgICAgIFxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VVcCA9ICgoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICAgIGlmICghdGhpcy5pc01vYmlsZSkgeyB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSkgfVxyXG4gICAgICBlbHNlIHsgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpIH1cclxuICAgICAgXHJcbiAgICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcblxyXG4gICAgICBpZiAodGhpcy5pc09uQ2FudmFzKHgsIHkpKSB7XHJcbiAgICAgICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2FudmFzIGRvd25cclxuICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAnbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duKVxyXG5cclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBjYW52YXNNb3VzZVVwLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAnbW91c2V1cCcsIGNhbnZhc01vdXNlVXApIFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBjYW52YXNNb3VzZURvd24sIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICd0b3VjaHN0YXJ0JywgY2FudmFzTW91c2VEb3duKVxyXG5cclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgY2FudmFzTW91c2VVcCwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3RvdWNoZW5kJywgY2FudmFzTW91c2VVcClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIGFzeW5jIHggYW5kIHkgZnJvbSBpbWFnZSB0byBjYW52YXNcclxuICBfYXN5bmMoKSB7XHJcbiAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICB0aGlzLnRvcCA9IGNvb3JkaW5hdGUudG9wXHJcbiAgICB0aGlzLmxlZnQgPSBjb29yZGluYXRlLmxlZnRcclxuXHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5sZWZ0ICsgdGhpcy5ib2R5LnNjcm9sbExlZnR9cHg7XHJcbiAgICAgIHRvcDogJHt0aGlzLnRvcCArIHRoaXMuYm9keS5zY3JvbGxUb3B9cHg7XHJcbiAgICAgIHVzZS1zZWxlY3Q6IG5vbmU7XHJcbiAgICBgXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBzYXZlIGJpbmRzIGV2ZW50c1xyXG4gICAqIEBwYXJhbSAge0RPTX0gX2VsZW1lbnQgIERPTSB0aGF0IHlvdSBiaW5kIGV2ZW50XHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSBfZXZlbnQgIGV2ZW50IG5hbWVcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gX2Z1bmN0aW9uIGV2ZW50IGZ1bmN0aW9uXHJcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSB3aGVuIHNhdmUgc3VjY2Vzc1xyXG4gICAqL1xyXG4gIF9wdXNoUmVnaXN0ZXJlZEV2ZW50cyhfZWxlbWVudCwgX2V2ZW50LCBfZnVuY3Rpb24pIHtcclxuXHJcbiAgICB0aGlzLnJlZ2lzdGVyZWRFdmVudHMucHVzaCh7XHJcbiAgICAgICdlbGVtZW50JzogX2VsZW1lbnQsXHJcbiAgICAgICdldmVudCc6IF9ldmVudCxcclxuICAgICAgJ2Z1bmN0aW9uJzogX2Z1bmN0aW9uXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiB0cnVlXHJcblxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBfaW5pdE1vdXNlKHR5cGUpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB6LWluZGV4OiAxMDAwMTtcclxuICAgICAgd2lkdGg6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBoZWlnaHQ6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XHJcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XHJcbiAgICBgXHJcbiAgICB0aGlzLm1vdXNlID0gbW91c2VcclxuXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKG1vdXNlKVxyXG5cclxuICAgIGxldCBtb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1c31weCwgJHt5IC0gdGhpcy5yYWRpdXN9cHgpYFxyXG5cclxuICAgICAgaWYgKCFpc09uQ2FudmFzKSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdub25lJ1xyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICBpZiAoIXRoaXMuaXNNb2JpbGUpIHtcclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBtb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICd0b3VjaG1vdmUnLCBtb3VzZU1vdmUpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRSYWRpdXMocmFkaXVzKSB7XHJcbiAgICBpZiAocmFkaXVzIDwgMiB8fCByYWRpdXMgPiAxMDApIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXNcclxuXHJcbiAgICBtb3VzZS5zdHlsZS53aWR0aCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgICBtb3VzZS5zdHlsZS5oZWlnaHQgPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gIH1cclxuXHJcbiAgem9vbUluKHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzICsgcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgem9vbU91dChyYWRpdXMgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyAtIHJhZGl1cylcclxuICB9XHJcblxyXG4gIGRyYXdDaXJjbGUoeCwgeSwgcmFkaXVzKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xyXG4gICAgY3R4LmJlZ2luUGF0aCgpXHJcbiAgICBjdHguYXJjKHggKyAxLCB5ICsgMSwgcmFkaXVzIHx8IHRoaXMucmFkaXVzLCAwLCAzNjApXHJcbiAgICBjdHguZmlsbCgpXHJcbiAgICBjdHguY2xvc2VQYXRoKClcclxuICB9XHJcblxyXG5cclxuICBnZXRDb29yZGluYXRlQnlFdmVudChldmVudCkge1xyXG4gICAgbGV0IHgsIHlcclxuICAgIGxldCBbZG9jLCBib2R5XSA9IFt0aGlzLmRvYywgdGhpcy5ib2R5XVxyXG4gICAgbGV0IGNhbnZhcyA9IHRoaXMuY2FudmFzXHJcblxyXG4gICAgaWYgKHRoaXMuaXNNb2JpbGUpIHsgZXZlbnQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB9XHJcblxyXG4gICAgaWYgKGV2ZW50LnBhZ2VYIHx8IGV2ZW50LnBhZ2VZKSB7XHJcbiAgICAgIHggPSBldmVudC5wYWdlWFxyXG4gICAgICB5ID0gZXZlbnQucGFnZVlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHggPSBldmVudC5jbGllbnRYICsgYm9keS5zY3JvbGxMZWZ0ICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0XHJcbiAgICAgIHkgPSBldmVudC5jbGllbnRZICsgYm9keS5zY3JvbGxUb3AgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxyXG4gICAgfVxyXG5cclxuICAgIHggLT0gY2FudmFzLm9mZnNldExlZnRcclxuICAgIHkgLT0gY2FudmFzLm9mZnNldFRvcFxyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKHgsIHkpXHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XVxyXG4gIH1cclxuXHJcbiAgZHJhd0J5RXZlbnQoZXZlbnQpIHtcclxuICAgIGlmICghdGhpcy5jdHgpIHJldHVyblxyXG5cclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IFt4LCB5XSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpXHJcblxyXG4gICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuZHJhd0NpcmNsZSh4LCB5KVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB4IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIHkgLT0gdGhpcy5yYWRpdXNcclxuICAgICAgbGV0IFt3LCBoXSA9IFt0aGlzLnJhZGl1cyAqIDIsIHRoaXMucmFkaXVzICogMl1cclxuICAgICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5FUkFTRVIsIHgsIHksIHcsIGhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHkpIHtcclxuICAgIGxldCBib2R5ID0gdGhpcy5ib2R5XHJcbiAgICBsZXQgc2Nyb2xsVG9wID0gYm9keS5zY3JvbGxUb3BcclxuXHJcbiAgICBpZiAoeCA8IHRoaXMubGVmdCB8fCB4ID4gKHRoaXMubGVmdCArIHRoaXMud2lkdGgpIHx8IHkgPCAoc2Nyb2xsVG9wICsgdGhpcy50b3ApIHx8IHkgPiAoc2Nyb2xsVG9wICsgdGhpcy50b3AgKyB0aGlzLmhlaWdodCkpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gdHJ1ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0TWF4V2lkdGgod2lkdGgpIHtcclxuICAgIHRoaXMubWF4V2lkdGggPSB3aWR0aFxyXG4gIH1cclxuXHJcbiAgc2V0Q29sb3IoY29sb3IpIHtcclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcbiAgLy8gcGVuLCBlcmFzZXJcclxuICBzZXRUb29sKHRvb2wpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gdG9vbFxyXG5cclxuICAgIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgdGhpcy5zZXRQZW4oKVxyXG4gICAgfSBlbHNlIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgdGhpcy5zZXRFcmFzZXIoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHNldFBlbigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke0RFRkFVTFRfT1BUSU9OUy5QRU5fQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuUEVOXHJcbiAgfVxyXG5cclxuICBzZXRFcmFzZXIoKSB7XHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICBPYmplY3QuYXNzaWduKG1vdXNlLnN0eWxlLCB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogMCxcclxuICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke0RFRkFVTFRfT1BUSU9OUy5FUkFTRVJfQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuRVJBU0VSXHJcbiAgfVxyXG5cclxuICB1bmRvKCkge1xyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgY29sb3IgPSB0aGlzLmNvbG9yXHJcblxyXG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcclxuICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5wb3AoKVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5tYXAoKHN0ZXBzKSA9PiB7XHJcbiAgICAgIHN0ZXBzLm1hcCgoc3RlcCkgPT4ge1xyXG4gICAgICAgIGlmIChzdGVwWzBdID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbG9yID0gc3RlcFsxXVxyXG4gICAgICAgICAgdGhpcy5kcmF3Q2lyY2xlLmFwcGx5KHRoaXMsIHN0ZXAuc2xpY2UoMikpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgICAgICBjdHguY2xlYXJSZWN0LmFwcGx5KGN0eCwgc3RlcC5zbGljZSgxKSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCBpbWFnZSBvcmlnaW4gc2l6ZVxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICBzcmMgICAgICBpYW1nZSBzb3VyY2UgdXJsXHJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrIGZ1bmN0aW9uLCB3aWR0aCBhcyBmaXJzdCBwYXJhbWV0ZXIgYW5kIGhlaWdodCBhcyBzZWNvbmRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgY2FsbGJhY2spIHtcclxuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKVxyXG5cclxuICAgIGltZy5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgIGxldCB3aWR0aCA9IGltZy53aWR0aFxyXG4gICAgICBsZXQgaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgICAgY2FsbGJhY2sod2lkdGgsIGhlaWdodClcclxuICAgIH1cclxuXHJcbiAgICBpbWcuc3JjID0gc3JjXHJcbiAgfVxyXG5cclxuICBnZXREYXRhVVJMKHR5cGUgPSAnaW1hZ2UvanBlZycsIHF1YWxpdHkgPSAwLjgsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgbGV0IHNyYyA9IHRoaXMuaW1nLnNyY1xyXG5cclxuICAgIHRoaXMuZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgKHdpZHRoLCBoZWlnaHQpID0+IHtcclxuICAgICAgbGV0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICB0ZW1wQ2FudmFzLndpZHRoID0gd2lkdGhcclxuICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgICAgbGV0IHRlbXBDdHggPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgICAgY2FsbGJhY2sodGVtcENhbnZhcy50b0RhdGFVUkwodHlwZSwgcXVhbGl0eSkpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmVtb3ZlIGRvbSB0aGF0IGFkZGVkIGludG8gYm9keSxcclxuICAgKiByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IHJlZ2lzdGVyZWRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZGVzdHJveSgpIHtcclxuICAgIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpXHJcbiAgICB0aGlzLm1vdXNlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5tb3VzZSlcclxuXHJcbiAgICB0aGlzLmltZy5zcmMgPSAnJ1xyXG5cclxuICAgIHRoaXMucmVnaXN0ZXJlZEV2ZW50cy5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICB2LmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcih2LmV2ZW50LCB2LmZ1bmN0aW9uLCBmYWxzZSlcclxuICAgIH0pXHJcbiAgICBkZWxldGUgdGhpc1xyXG4gIH1cclxufVxyXG4iXX0=
