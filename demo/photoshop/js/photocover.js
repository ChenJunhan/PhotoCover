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
  ERASER: 'eraser',
  LINECAP: 'round'
};

var PhotoCover = function () {
  function PhotoCover(selector) {
    _classCallCheck(this, PhotoCover);

    this.radius = DEFAULT_OPTIONS.RADIUS;
    this.maxWidth = DEFAULT_OPTIONS.MAX_WIDTH;
    this.color = DEFAULT_OPTIONS.COLOR;
    this.linecap = DEFAULT_OPTIONS.LINECAP;
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

        var _getCoordinateByEvent = _this.getCoordinateByEvent(e),
            _getCoordinateByEvent2 = _slicedToArray(_getCoordinateByEvent, 2),
            x = _getCoordinateByEvent2[0],
            y = _getCoordinateByEvent2[1];

        _this.ctx.moveTo(x, y);

        currentOperate = [];

        if (_this.isOnCanvas(x, y, true)) {

          _this.ctx.beginPath();
          currentOperate.push(['MOVE_TO', x, y]);

          if (!_this.isMobile) {
            win.addEventListener('mousemove', canvasMouseMove, false);
          } else {
            win.addEventListener('touchmove', canvasMouseMove, false);
          }
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
          console.log(_this.operateHistories);
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
    key: 'drawLine',
    value: function drawLine(x, y, radius) {
      var ctx = this.ctx;

      ctx.lineCap = this.linecap;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = (radius || this.radius) * 2;
      ctx.lineTo(x, y);
      ctx.stroke();
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

      return [x, y];
    }
  }, {
    key: 'drawByEvent',
    value: function drawByEvent(event) {
      if (!this.ctx) return;

      var ctx = this.ctx;

      var _getCoordinateByEvent3 = this.getCoordinateByEvent(event),
          _getCoordinateByEvent4 = _slicedToArray(_getCoordinateByEvent3, 2),
          x = _getCoordinateByEvent4[0],
          y = _getCoordinateByEvent4[1];

      if (this.mouseType === DEFAULT_OPTIONS.PEN) {
        this.drawLine(x, y);
        // this.drawCircle(x, y)
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
      var isRelative = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var body = this.body;
      var scrollTop = body.scrollTop;

      if (isRelative) {
        if (x < 0 || x > this.width || y < 0 || y > this.height) {
          return false;
        } else {
          return true;
        }
      } else {
        if (x < this.left || x > this.left + this.width || y < scrollTop + this.top || y > scrollTop + this.top + this.height) {
          return false;
        } else {
          return true;
        }
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

      ctx.save();

      ctx.clearRect(0, 0, this.width, this.height);
      this.operateHistories.pop();

      this.operateHistories.map(function (steps) {
        steps.map(function (step) {
          if (step[0] === DEFAULT_OPTIONS.PEN) {
            _this3.color = step[1];
            _this3.drawLine(step[2], step[3], step[4]);
          } else if (step[0] === DEFAULT_OPTIONS.ERASER) {
            ctx.clearRect.apply(ctx, step.slice(1));
          } else if (step[0] === 'MOVE_TO') {
            ctx.beginPath(step[1], step[2]);
            ctx.moveTo.apply(ctx, step.slice(1));
          }
        });
      });

      console.log(this.operateHistories.length);

      this.color = color;
      ctx.restore();
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiTElORUNBUCIsIlBob3RvQ292ZXIiLCJzZWxlY3RvciIsInJhZGl1cyIsIm1heFdpZHRoIiwiY29sb3IiLCJsaW5lY2FwIiwibW91c2VUeXBlIiwiaXNNb2JpbGUiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJpbmRleE9mIiwib3BlcmF0ZUhpc3RvcmllcyIsImltZyIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsIndpbiIsIndpbmRvdyIsImRvYyIsImJvZHkiLCJtb3VzZSIsIndpZHRoIiwiaGVpZ2h0IiwibGVmdCIsInRvcCIsImNhbnZhcyIsImN0eCIsInJlZ2lzdGVyZWRFdmVudHMiLCJfaW5pdCIsIkVycm9yIiwiY3JlYXRlRWxlbWVudCIsImdldENvbnRleHQiLCJfYXN5bmMiLCJhcHBlbmRDaGlsZCIsIl9pbml0TW91c2UiLCJyZXNpemUiLCJiaW5kIiwiYWRkRXZlbnRMaXN0ZW5lciIsIl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyIsImN1cnJlbnRPcGVyYXRlIiwiY2FudmFzTW91c2VEb3duIiwiZSIsInByZXZlbnREZWZhdWx0IiwiZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQiLCJ4IiwieSIsIm1vdmVUbyIsImlzT25DYW52YXMiLCJiZWdpblBhdGgiLCJwdXNoIiwiY2FudmFzTW91c2VNb3ZlIiwiZHJhd0J5RXZlbnQiLCJjYW52YXNNb3VzZVVwIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImNvb3JkaW5hdGUiLCJwYWdlWCIsInBhZ2VZIiwiY29uc29sZSIsImxvZyIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInN0eWxlIiwiY3NzVGV4dCIsInNjcm9sbExlZnQiLCJzY3JvbGxUb3AiLCJfZWxlbWVudCIsIl9ldmVudCIsIl9mdW5jdGlvbiIsInR5cGUiLCJtb3VzZU1vdmUiLCJ0cmFuc2Zvcm0iLCJkaXNwbGF5IiwiY3Vyc29yIiwic2V0UmFkaXVzIiwiZmlsbFN0eWxlIiwiYXJjIiwiZmlsbCIsImNsb3NlUGF0aCIsImxpbmVDYXAiLCJzdHJva2VTdHlsZSIsImxpbmVXaWR0aCIsImxpbmVUbyIsInN0cm9rZSIsImV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJjbGllbnRYIiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50WSIsIm9mZnNldExlZnQiLCJvZmZzZXRUb3AiLCJkcmF3TGluZSIsInciLCJoIiwiY2xlYXJSZWN0IiwiaXNSZWxhdGl2ZSIsInRvb2wiLCJ0b0xvd2VyQ2FzZSIsInNldFBlbiIsInNldEVyYXNlciIsIk9iamVjdCIsImFzc2lnbiIsImJvcmRlclJhZGl1cyIsImJvcmRlciIsInNhdmUiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIiwibGVuZ3RoIiwicmVzdG9yZSIsInNyYyIsImNhbGxiYWNrIiwiSW1hZ2UiLCJvbmxvYWQiLCJxdWFsaXR5IiwiZ2V0SW1hZ2VPcmlnaW5TaXplIiwidGVtcENhbnZhcyIsInRlbXBDdHgiLCJkcmF3SW1hZ2UiLCJ0b0RhdGFVUkwiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJmb3JFYWNoIiwidiIsImVsZW1lbnQiLCJmdW5jdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQU1BLGtCQUFrQjtBQUN0QkMsVUFBUSxFQURjO0FBRXRCQyxhQUFXLEdBRlc7QUFHdEJDLFNBQU8sT0FIZTtBQUl0QkMsU0FBTyxLQUplO0FBS3RCQyxvQkFBa0IsS0FMSTtBQU10QkMsdUJBQXFCLE1BTkM7QUFPdEJDLE9BQUssS0FQaUI7QUFRdEJDLFVBQVEsUUFSYztBQVN0QkMsV0FBUztBQVRhLENBQXhCOztJQVlNQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFj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eEIsRUFBNkIsVUFBQzFGLEtBQUQsRUFBUUMsTUFBUixFQUFtQjtBQUM5QyxZQUFJK0YsYUFBYXZHLFNBQVNnQixhQUFULENBQXVCLFFBQXZCLENBQWpCO0FBQ0F1RixtQkFBV2hHLEtBQVgsR0FBbUJBLEtBQW5CO0FBQ0FnRyxtQkFBVy9GLE1BQVgsR0FBb0JBLE1BQXBCO0FBQ0EsWUFBSWdHLFVBQVVELFdBQVd0RixVQUFYLENBQXNCLElBQXRCLENBQWQ7QUFDQXVGLGdCQUFRQyxTQUFSLENBQWtCLE9BQUsxRyxHQUF2QixFQUE0QixDQUE1QixFQUErQixDQUEvQixFQUFrQ1EsS0FBbEMsRUFBeUNDLE1BQXpDO0FBQ0FnRyxnQkFBUUMsU0FBUixDQUFrQixPQUFLOUYsTUFBdkIsRUFBK0IsQ0FBL0IsRUFBa0MsQ0FBbEMsRUFBcUNKLEtBQXJDLEVBQTRDQyxNQUE1Qzs7QUFFQTBGLGlCQUFTSyxXQUFXRyxTQUFYLENBQXFCckQsSUFBckIsRUFBMkJnRCxPQUEzQixDQUFUO0FBQ0QsT0FURDtBQVVEOztBQUVEOzs7Ozs7Ozs4QkFLVTtBQUNSLFdBQUsxRixNQUFMLENBQVlnRyxVQUFaLENBQXVCQyxXQUF2QixDQUFtQyxLQUFLakcsTUFBeEM7QUFDQSxXQUFLTCxLQUFMLENBQVdxRyxVQUFYLENBQXNCQyxXQUF0QixDQUFrQyxLQUFLdEcsS0FBdkM7O0FBRUEsV0FBS1AsR0FBTCxDQUFTa0csR0FBVCxHQUFlLEVBQWY7O0FBRUEsV0FBS3BGLGdCQUFMLENBQXNCZ0csT0FBdEIsQ0FBOEIsYUFBSztBQUNqQ0MsVUFBRUMsT0FBRixDQUFVeEUsbUJBQVYsQ0FBOEJ1RSxFQUFFMUMsS0FBaEMsRUFBdUMwQyxFQUFFRSxRQUF6QyxFQUFtRCxLQUFuRDtBQUNELE9BRkQ7QUFHQSxhQUFPLElBQVA7QUFDRCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdwZW4nLFxyXG4gIFBFTl9CT1JERVJfQ09MT1I6ICdyZWQnLFxyXG4gIEVSQVNFUl9CT1JERVJfQ09MT1I6ICcjNjY2JyxcclxuICBQRU46ICdwZW4nLFxyXG4gIEVSQVNFUjogJ2VyYXNlcicsXHJcbiAgTElORUNBUDogJ3JvdW5kJ1xyXG59XHJcblxyXG5jbGFzcyBQaG90b0NvdmVyIHtcclxuICBjb25zdHJ1Y3RvcihzZWxlY3Rvcikge1xyXG4gICAgdGhpcy5yYWRpdXMgPSBERUZBVUxUX09QVElPTlMuUkFESVVTXHJcbiAgICB0aGlzLm1heFdpZHRoID0gREVGQVVMVF9PUFRJT05TLk1BWF9XSURUSFxyXG4gICAgdGhpcy5jb2xvciA9IERFRkFVTFRfT1BUSU9OUy5DT0xPUlxyXG4gICAgdGhpcy5saW5lY2FwPSBERUZBVUxUX09QVElPTlMuTElORUNBUFxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuTU9VU0VcclxuICAgIHRoaXMuaXNNb2JpbGUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ2lQaG9uZScpID4gLTEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAtMVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3RvcmllcyA9IFtdXHJcblxyXG4gICAgLy8gc2VsZWN0b3JcclxuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMuaW1nID0gc2VsZWN0b3JcclxuXHJcbiAgICAgIC8vIGltYWdlIGVsZW1lbnRcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy53aW4gPSB3aW5kb3dcclxuICAgIHRoaXMuZG9jID0gZG9jdW1lbnRcclxuICAgIHRoaXMuYm9keSA9IHRoaXMuZG9jLmJvZHlcclxuXHJcbiAgICB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodFxyXG4gICAgdGhpcy5sZWZ0XHJcbiAgICB0aGlzLnRvcFxyXG4gICAgdGhpcy5jYW52YXNcclxuICAgIHRoaXMuY3R4XHJcblxyXG4gICAgLy8gZm9ybWF0ID0gW3tcclxuICAgIC8vICAgZWxlbWVudDogd2luZG93LFxyXG4gICAgLy8gICBldmVudHM6IFtmdW5jdGlvbiAoKSB7fSwgZnVuY3Rpb24gKCkge31dXHJcbiAgICAvLyB9XVxyXG4gICAgdGhpcy5yZWdpc3RlcmVkRXZlbnRzID0gW11cclxuXHJcbiAgICB0aGlzLl9pbml0KClcclxuICB9XHJcblxyXG4gIF9pbml0KCkge1xyXG4gICAgaWYgKCF0aGlzLmltZykge1xyXG4gICAgICB0aHJvdyBFcnJvcignTm8gSW1hZ2UgU2VsZWN0ZWQnKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbiwgaW1nXSA9IFt0aGlzLmJvZHksIHRoaXMud2luLCB0aGlzLmltZ11cclxuXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7IHRoaXMuX2luaXRNb3VzZSgpIH1cclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICBsZXQgcmVzaXplID0gKGUgPT4ge1xyXG4gICAgICB0aGlzLl9hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSlcclxuICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3Jlc2l6ZScsIHJlc2l6ZSlcclxuXHJcblxyXG4gICAgbGV0IGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VEb3duID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG5cclxuICAgICAgY29uc3QgW3gsIHldID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG4gICAgICB0aGlzLmN0eC5tb3ZlVG8oeCwgeSlcclxuXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICAgIGlmICh0aGlzLmlzT25DYW52YXMoeCwgeSwgdHJ1ZSkpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKClcclxuICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKFsnTU9WRV9UTycsIHgsIHldKVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuaXNNb2JpbGUpIHsgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpIH1cclxuICAgICAgICBlbHNlIHsgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpIH1cclxuICAgICAgfVxyXG4gICAgICBcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlVXAgPSAoKGUpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgICBpZiAoIXRoaXMuaXNNb2JpbGUpIHsgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpIH1cclxuICAgICAgZWxzZSB7IHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKSB9XHJcbiAgICAgIFxyXG4gICAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZSlcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNPbkNhbnZhcyh4LCB5KSkge1xyXG4gICAgICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5wdXNoKGN1cnJlbnRPcGVyYXRlKVxyXG4gICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLm9wZXJhdGVIaXN0b3JpZXMpXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjYW52YXMgZG93blxyXG4gICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7XHJcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24sIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24pXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNhbnZhc01vdXNlVXAsIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdtb3VzZXVwJywgY2FudmFzTW91c2VVcCkgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGNhbnZhc01vdXNlRG93biwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3RvdWNoc3RhcnQnLCBjYW52YXNNb3VzZURvd24pXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBjYW52YXNNb3VzZVVwLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAndG91Y2hlbmQnLCBjYW52YXNNb3VzZVVwKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgeCBhbmQgeSBmcm9tIGltYWdlIHRvIGNhbnZhc1xyXG4gIF9hc3luYygpIHtcclxuICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5pbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcclxuICAgIHRoaXMudG9wID0gY29vcmRpbmF0ZS50b3BcclxuICAgIHRoaXMubGVmdCA9IGNvb3JkaW5hdGUubGVmdFxyXG5cclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogJHt0aGlzLmxlZnQgKyB0aGlzLmJvZHkuc2Nyb2xsTGVmdH1weDtcclxuICAgICAgdG9wOiAke3RoaXMudG9wICsgdGhpcy5ib2R5LnNjcm9sbFRvcH1weDtcclxuICAgICAgdXNlLXNlbGVjdDogbm9uZTtcclxuICAgIGBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHNhdmUgYmluZHMgZXZlbnRzXHJcbiAgICogQHBhcmFtICB7RE9NfSBfZWxlbWVudCAgRE9NIHRoYXQgeW91IGJpbmQgZXZlbnRcclxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IF9ldmVudCAgZXZlbnQgbmFtZVxyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBfZnVuY3Rpb24gZXZlbnQgZnVuY3Rpb25cclxuICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIHdoZW4gc2F2ZSBzdWNjZXNzXHJcbiAgICovXHJcbiAgX3B1c2hSZWdpc3RlcmVkRXZlbnRzKF9lbGVtZW50LCBfZXZlbnQsIF9mdW5jdGlvbikge1xyXG5cclxuICAgIHRoaXMucmVnaXN0ZXJlZEV2ZW50cy5wdXNoKHtcclxuICAgICAgJ2VsZW1lbnQnOiBfZWxlbWVudCxcclxuICAgICAgJ2V2ZW50JzogX2V2ZW50LFxyXG4gICAgICAnZnVuY3Rpb24nOiBfZnVuY3Rpb25cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIHRydWVcclxuXHJcbiAgfVxyXG5cclxuICAvLyBpbml0aWFsIG1vdXNlIHNoYXBlIHdoZXJlIG1vdXNlIG9uIGNhbnZhc1xyXG4gIF9pbml0TW91c2UodHlwZSkge1xyXG4gICAgbGV0IFtib2R5LCB3aW5dID0gW3RoaXMuYm9keSwgdGhpcy53aW5dXHJcbiAgICBsZXQgbW91c2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgbW91c2Uuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgICB0b3A6IDA7XHJcbiAgICAgIHotaW5kZXg6IDEwMDAxO1xyXG4gICAgICB3aWR0aDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGhlaWdodDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcclxuICAgICAgYm9yZGVyLXJhZGl1czogMTAwJTtcclxuICAgIGBcclxuICAgIHRoaXMubW91c2UgPSBtb3VzZVxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQobW91c2UpXHJcblxyXG4gICAgbGV0IG1vdXNlTW92ZSA9ICgoZSkgPT4ge1xyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcbiAgICAgIGxldCBpc09uQ2FudmFzID0gdGhpcy5pc09uQ2FudmFzKHgsIHkpXHJcblxyXG4gICAgICBtb3VzZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eCAtIHRoaXMucmFkaXVzfXB4LCAke3kgLSB0aGlzLnJhZGl1c31weClgXHJcblxyXG4gICAgICBpZiAoIWlzT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ25vbmUnXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjaGFuZ2UgbW91c2Ugc3R5bGVcclxuICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG1vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3RvdWNobW92ZScsIG1vdXNlTW92ZSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldFJhZGl1cyhyYWRpdXMpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgIG1vdXNlLnN0eWxlLmhlaWdodCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgfVxyXG5cclxuICB6b29tSW4ocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgZHJhd0NpcmNsZSh4LCB5LCByYWRpdXMpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCByYWRpdXMgfHwgdGhpcy5yYWRpdXMsIDAsIDM2MClcclxuICAgIGN0eC5maWxsKClcclxuICAgIGN0eC5jbG9zZVBhdGgoKVxyXG4gIH1cclxuXHJcbiAgZHJhd0xpbmUoeCwgeSwgcmFkaXVzKSB7XHJcbiAgICBjb25zdCBjdHggPSB0aGlzLmN0eFxyXG5cclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5saW5lY2FwXHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yXHJcbiAgICBjdHgubGluZVdpZHRoID0gKHJhZGl1cyB8fCB0aGlzLnJhZGl1cykgKiAyXHJcbiAgICBjdHgubGluZVRvKHgsIHkpXHJcbiAgICBjdHguc3Ryb2tlKClcclxuICB9XHJcblxyXG5cclxuICBnZXRDb29yZGluYXRlQnlFdmVudChldmVudCkge1xyXG4gICAgbGV0IHgsIHlcclxuICAgIGxldCBbZG9jLCBib2R5XSA9IFt0aGlzLmRvYywgdGhpcy5ib2R5XVxyXG4gICAgbGV0IGNhbnZhcyA9IHRoaXMuY2FudmFzXHJcblxyXG4gICAgaWYgKHRoaXMuaXNNb2JpbGUpIHsgZXZlbnQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB9XHJcblxyXG4gICAgaWYgKGV2ZW50LnBhZ2VYIHx8IGV2ZW50LnBhZ2VZKSB7XHJcbiAgICAgIHggPSBldmVudC5wYWdlWFxyXG4gICAgICB5ID0gZXZlbnQucGFnZVlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHggPSBldmVudC5jbGllbnRYICsgYm9keS5zY3JvbGxMZWZ0ICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0XHJcbiAgICAgIHkgPSBldmVudC5jbGllbnRZICsgYm9keS5zY3JvbGxUb3AgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxyXG4gICAgfVxyXG5cclxuICAgIHggLT0gY2FudmFzLm9mZnNldExlZnRcclxuICAgIHkgLT0gY2FudmFzLm9mZnNldFRvcFxyXG5cclxuICAgIHJldHVybiBbeCwgeV1cclxuICB9XHJcblxyXG4gIGRyYXdCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm5cclxuXHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBbeCwgeV0gPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KVxyXG5cclxuICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLmRyYXdMaW5lKHgsIHkpXHJcbiAgICAgIC8vIHRoaXMuZHJhd0NpcmNsZSh4LCB5KVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB4IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIHkgLT0gdGhpcy5yYWRpdXNcclxuICAgICAgbGV0IFt3LCBoXSA9IFt0aGlzLnJhZGl1cyAqIDIsIHRoaXMucmFkaXVzICogMl1cclxuICAgICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5FUkFTRVIsIHgsIHksIHcsIGhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHksIGlzUmVsYXRpdmUgPSBmYWxzZSkge1xyXG4gICAgbGV0IGJvZHkgPSB0aGlzLmJvZHlcclxuICAgIGxldCBzY3JvbGxUb3AgPSBib2R5LnNjcm9sbFRvcFxyXG5cclxuICAgIGlmIChpc1JlbGF0aXZlKSB7XHJcbiAgICAgIGlmICh4IDwgMCB8fCB4ID4gdGhpcy53aWR0aCB8fCB5IDwgMCB8fCB5ID4gdGhpcy5oZWlnaHQpIHsgcmV0dXJuIGZhbHNlIH1cclxuICAgICAgZWxzZSB7IHJldHVybiB0cnVlIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh4IDwgdGhpcy5sZWZ0IHx8IHggPiAodGhpcy5sZWZ0ICsgdGhpcy53aWR0aCkgfHwgeSA8IChzY3JvbGxUb3AgKyB0aGlzLnRvcCkgfHwgeSA+IChzY3JvbGxUb3AgKyB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0KSkgeyByZXR1cm4gZmFsc2UgfVxyXG4gICAgICBlbHNlIHsgcmV0dXJuIHRydWUgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0TWF4V2lkdGgod2lkdGgpIHtcclxuICAgIHRoaXMubWF4V2lkdGggPSB3aWR0aFxyXG4gIH1cclxuXHJcbiAgc2V0Q29sb3IoY29sb3IpIHtcclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcbiAgLy8gcGVuLCBlcmFzZXJcclxuICBzZXRUb29sKHRvb2wpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gdG9vbFxyXG5cclxuICAgIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgdGhpcy5zZXRQZW4oKVxyXG4gICAgfSBlbHNlIGlmICh0b29sLnRvTG93ZXJDYXNlKCkgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgdGhpcy5zZXRFcmFzZXIoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHNldFBlbigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke0RFRkFVTFRfT1BUSU9OUy5QRU5fQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuUEVOXHJcbiAgfVxyXG5cclxuICBzZXRFcmFzZXIoKSB7XHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICBPYmplY3QuYXNzaWduKG1vdXNlLnN0eWxlLCB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogMCxcclxuICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke0RFRkFVTFRfT1BUSU9OUy5FUkFTRVJfQk9SREVSX0NPTE9SfWBcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBERUZBVUxUX09QVElPTlMuRVJBU0VSXHJcbiAgfVxyXG5cclxuICB1bmRvKCkge1xyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgY29sb3IgPSB0aGlzLmNvbG9yXHJcblxyXG4gICAgY3R4LnNhdmUoKVxyXG5cclxuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucG9wKClcclxuXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMubWFwKChzdGVwcykgPT4ge1xyXG4gICAgICBzdGVwcy5tYXAoKHN0ZXApID0+IHtcclxuICAgICAgICBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICAgICAgdGhpcy5jb2xvciA9IHN0ZXBbMV1cclxuICAgICAgICAgIHRoaXMuZHJhd0xpbmUoc3RlcFsyXSwgc3RlcFszXSwgc3RlcFs0XSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgICAgIGN0eC5jbGVhclJlY3QuYXBwbHkoY3R4LCBzdGVwLnNsaWNlKDEpKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RlcFswXSA9PT0gJ01PVkVfVE8nKSB7XHJcbiAgICAgICAgICBjdHguYmVnaW5QYXRoKHN0ZXBbMV0sIHN0ZXBbMl0pXHJcbiAgICAgICAgICBjdHgubW92ZVRvLmFwcGx5KGN0eCwgc3RlcC5zbGljZSgxKSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIGNvbnNvbGUubG9nKHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5sZW5ndGgpXHJcblxyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgICBjdHgucmVzdG9yZSgpXHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0IGltYWdlIG9yaWdpbiBzaXplXHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHNyYyAgICAgIGlhbWdlIHNvdXJjZSB1cmxcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2sgZnVuY3Rpb24sIHdpZHRoIGFzIGZpcnN0IHBhcmFtZXRlciBhbmQgaGVpZ2h0IGFzIHNlY29uZFxyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgKi9cclxuICBnZXRJbWFnZU9yaWdpblNpemUoc3JjLCBjYWxsYmFjaykge1xyXG4gICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpXHJcblxyXG4gICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgbGV0IHdpZHRoID0gaW1nLndpZHRoXHJcbiAgICAgIGxldCBoZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgICBjYWxsYmFjayh3aWR0aCwgaGVpZ2h0KVxyXG4gICAgfVxyXG5cclxuICAgIGltZy5zcmMgPSBzcmNcclxuICB9XHJcblxyXG4gIGdldERhdGFVUkwodHlwZSA9ICdpbWFnZS9qcGVnJywgcXVhbGl0eSA9IDAuOCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICBsZXQgc3JjID0gdGhpcy5pbWcuc3JjXHJcblxyXG4gICAgdGhpcy5nZXRJbWFnZU9yaWdpblNpemUoc3JjLCAod2lkdGgsIGhlaWdodCkgPT4ge1xyXG4gICAgICBsZXQgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgIHRlbXBDYW52YXMud2lkdGggPSB3aWR0aFxyXG4gICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgICBsZXQgdGVtcEN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICB0ZW1wQ3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgd2lkdGgsIGhlaWdodClcclxuICAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgICBjYWxsYmFjayh0ZW1wQ2FudmFzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZW1vdmUgZG9tIHRoYXQgYWRkZWQgaW50byBib2R5LFxyXG4gICAqIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgcmVnaXN0ZXJlZFxyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcylcclxuICAgIHRoaXMubW91c2UucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm1vdXNlKVxyXG5cclxuICAgIHRoaXMuaW1nLnNyYyA9ICcnXHJcblxyXG4gICAgdGhpcy5yZWdpc3RlcmVkRXZlbnRzLmZvckVhY2godiA9PiB7XHJcbiAgICAgIHYuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHYuZXZlbnQsIHYuZnVuY3Rpb24sIGZhbHNlKVxyXG4gICAgfSlcclxuICAgIGRlbGV0ZSB0aGlzXHJcbiAgfVxyXG59XHJcbiJdfQ==
