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
        // console.log(e)
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
        event = event.touches[0];
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

      console.log(x, y);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsImlzTW9iaWxlIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaW5kZXhPZiIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJyZWdpc3RlcmVkRXZlbnRzIiwiX2luaXQiLCJFcnJvciIsImNyZWF0ZUVsZW1lbnQiLCJnZXRDb250ZXh0IiwiX2FzeW5jIiwiYXBwZW5kQ2hpbGQiLCJfaW5pdE1vdXNlIiwicmVzaXplIiwiYmluZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJfcHVzaFJlZ2lzdGVyZWRFdmVudHMiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlRG93biIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInB1c2giLCJkcmF3QnlFdmVudCIsImNhbnZhc01vdXNlTW92ZSIsImNhbnZhc01vdXNlVXAiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiY29vcmRpbmF0ZSIsImdldENvb3JkaW5hdGVCeUV2ZW50IiwicGFnZVgiLCJwYWdlWSIsIngiLCJ5IiwiaXNPbkNhbnZhcyIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInN0eWxlIiwiY3NzVGV4dCIsInNjcm9sbExlZnQiLCJzY3JvbGxUb3AiLCJfZWxlbWVudCIsIl9ldmVudCIsIl9mdW5jdGlvbiIsInR5cGUiLCJtb3VzZU1vdmUiLCJ0cmFuc2Zvcm0iLCJkaXNwbGF5IiwiY3Vyc29yIiwic2V0UmFkaXVzIiwiZmlsbFN0eWxlIiwiYmVnaW5QYXRoIiwiYXJjIiwiZmlsbCIsImNsb3NlUGF0aCIsImV2ZW50IiwidG91Y2hlcyIsImNsaWVudFgiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGllbnRZIiwib2Zmc2V0TGVmdCIsIm9mZnNldFRvcCIsImNvbnNvbGUiLCJsb2ciLCJkcmF3Q2lyY2xlIiwidyIsImgiLCJjbGVhclJlY3QiLCJ0b29sIiwidG9Mb3dlckNhc2UiLCJzZXRQZW4iLCJzZXRFcmFzZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIiwic3JjIiwiY2FsbGJhY2siLCJJbWFnZSIsIm9ubG9hZCIsInF1YWxpdHkiLCJnZXRJbWFnZU9yaWdpblNpemUiLCJ0ZW1wQ2FudmFzIiwidGVtcEN0eCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsImZvckVhY2giLCJ2IiwiZWxlbWVudCIsImZ1bmN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsSUFBTUEsa0JBQWtCO0FBQ3RCQyxVQUFRLEVBRGM7QUFFdEJDLGFBQVcsR0FGVztBQUd0QkMsU0FBTyxPQUhlO0FBSXRCQyxTQUFPLEtBSmU7QUFLdEJDLG9CQUFrQixLQUxJO0FBTXRCQyx1QkFBcUIsTUFOQztBQU90QkMsT0FBSyxLQVBpQjtBQVF0QkMsVUFBUTtBQVJjLENBQXhCOztJQVdNQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFjWCxnQkFBZ0JDLE1BQTlCO0FBQ0EsU0FBS1csUUFBTCxHQUFnQlosZ0JBQWdCRSxTQUFoQztBQUNBLFNBQUtXLEtBQUwsR0FBYWIsZ0JBQWdCRyxLQUE3QjtBQUNBLFNBQUtXLFNBQUwsR0FBaUJkLGdCQUFnQkksS0FBakM7QUFDQSxTQUFLVyxRQUFMLEdB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ckIsRUFBMkIwQyxPQUEzQixDQUFUO0FBQ0QsT0FURDtBQVVEOztBQUVEOzs7Ozs7Ozs4QkFLVTtBQUNSLFdBQUtoRixNQUFMLENBQVlzRixVQUFaLENBQXVCQyxXQUF2QixDQUFtQyxLQUFLdkYsTUFBeEM7QUFDQSxXQUFLTCxLQUFMLENBQVcyRixVQUFYLENBQXNCQyxXQUF0QixDQUFrQyxLQUFLNUYsS0FBdkM7O0FBRUEsV0FBS1AsR0FBTCxDQUFTd0YsR0FBVCxHQUFlLEVBQWY7O0FBRUEsV0FBSzFFLGdCQUFMLENBQXNCc0YsT0FBdEIsQ0FBOEIsYUFBSztBQUNqQ0MsVUFBRUMsT0FBRixDQUFVcEUsbUJBQVYsQ0FBOEJtRSxFQUFFeEMsS0FBaEMsRUFBdUN3QyxFQUFFRSxRQUF6QyxFQUFtRCxLQUFuRDtBQUNELE9BRkQ7QUFHQSxhQUFPLElBQVA7QUFDRCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdwZW4nLFxyXG4gIFBFTl9CT1JERVJfQ09MT1I6ICdyZWQnLFxyXG4gIEVSQVNFUl9CT1JERVJfQ09MT1I6ICcjNjY2JyxcclxuICBQRU46ICdwZW4nLFxyXG4gIEVSQVNFUjogJ2VyYXNlcidcclxufVxyXG5cclxuY2xhc3MgUGhvdG9Db3ZlciB7XHJcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcclxuICAgIHRoaXMucmFkaXVzID0gREVGQVVMVF9PUFRJT05TLlJBRElVU1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IERFRkFVTFRfT1BUSU9OUy5NQVhfV0lEVEhcclxuICAgIHRoaXMuY29sb3IgPSBERUZBVUxUX09QVElPTlMuQ09MT1JcclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLk1PVVNFXHJcbiAgICB0aGlzLmlzTW9iaWxlID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdpUGhvbmUnKSA+IC0xIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpID4gLTFcclxuXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMgPSBbXVxyXG5cclxuICAgIC8vIHNlbGVjdG9yXHJcbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0Jykge1xyXG4gICAgICB0aGlzLmltZyA9IHNlbGVjdG9yXHJcblxyXG4gICAgICAvLyBpbWFnZSBlbGVtZW50XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGhpcy5pbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMud2luID0gd2luZG93XHJcbiAgICB0aGlzLmRvYyA9IGRvY3VtZW50XHJcbiAgICB0aGlzLmJvZHkgPSB0aGlzLmRvYy5ib2R5XHJcblxyXG4gICAgdGhpcy5tb3VzZVxyXG4gICAgdGhpcy53aWR0aFxyXG4gICAgdGhpcy5oZWlnaHRcclxuICAgIHRoaXMubGVmdFxyXG4gICAgdGhpcy50b3BcclxuICAgIHRoaXMuY2FudmFzXHJcbiAgICB0aGlzLmN0eFxyXG5cclxuICAgIC8vIGZvcm1hdCA9IFt7XHJcbiAgICAvLyAgIGVsZW1lbnQ6IHdpbmRvdyxcclxuICAgIC8vICAgZXZlbnRzOiBbZnVuY3Rpb24gKCkge30sIGZ1bmN0aW9uICgpIHt9XVxyXG4gICAgLy8gfV1cclxuICAgIHRoaXMucmVnaXN0ZXJlZEV2ZW50cyA9IFtdXHJcblxyXG4gICAgdGhpcy5faW5pdCgpXHJcbiAgfVxyXG5cclxuICBfaW5pdCgpIHtcclxuICAgIGlmICghdGhpcy5pbWcpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ05vIEltYWdlIFNlbGVjdGVkJylcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IFtib2R5LCB3aW4sIGltZ10gPSBbdGhpcy5ib2R5LCB0aGlzLndpbiwgdGhpcy5pbWddXHJcblxyXG4gICAgLy8gaW5pdGlhbCBjYW52YXMgYW5kIGl0cyBzaXplIGFuZCBwb3NpdGlvblxyXG4gICAgdGhpcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgdGhpcy5oZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICB0aGlzLl9hc3luYygpXHJcblxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSBpbWcud2lkdGhcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKVxyXG5cclxuICAgIHRoaXMuX2luaXRNb3VzZSgpXHJcblxyXG4gICAgLy8gYXN5bmMgY2FudmFzIHBvc2l0aW9uIGFuZCBzaXplIGR1cmluZyBicm93c2VyIHJlc2l6ZVxyXG4gICAgbGV0IHJlc2l6ZSA9IChlID0+IHtcclxuICAgICAgdGhpcy5fYXN5bmMoKVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSwgZmFsc2UpXHJcbiAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdyZXNpemUnLCByZXNpemUpXHJcblxyXG5cclxuICAgIGxldCBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlRG93biA9ICgoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG5cclxuICAgICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7IHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKSB9XHJcbiAgICAgIGVsc2UgeyB3aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSkgfVxyXG4gICAgICBcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlVXAgPSAoKGUpID0+IHtcclxuICAgICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7IHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKSB9XHJcbiAgICAgIGVsc2UgeyB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSkgfVxyXG4gICAgICBcclxuICAgICAgbGV0IGNvb3JkaW5hdGUgPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGUpXHJcbiAgICAgIGxldCBbeCwgeV0gPSBbZS5wYWdlWCwgZS5wYWdlWV1cclxuXHJcbiAgICAgIGlmICh0aGlzLmlzT25DYW52YXMoeCwgeSkpIHtcclxuICAgICAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucHVzaChjdXJyZW50T3BlcmF0ZSlcclxuICAgICAgICBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjYW52YXMgZG93blxyXG4gICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7XHJcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24sIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24pXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNhbnZhc01vdXNlVXAsIGZhbHNlKVxyXG4gICAgICB0aGlzLl9wdXNoUmVnaXN0ZXJlZEV2ZW50cyh3aW4sICdtb3VzZXVwJywgY2FudmFzTW91c2VVcCkgXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGNhbnZhc01vdXNlRG93biwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3RvdWNoc3RhcnQnLCBjYW52YXNNb3VzZURvd24pXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBjYW52YXNNb3VzZVVwLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAndG91Y2hlbmQnLCBjYW52YXNNb3VzZVVwKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgeCBhbmQgeSBmcm9tIGltYWdlIHRvIGNhbnZhc1xyXG4gIF9hc3luYygpIHtcclxuICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5pbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcclxuICAgIHRoaXMudG9wID0gY29vcmRpbmF0ZS50b3BcclxuICAgIHRoaXMubGVmdCA9IGNvb3JkaW5hdGUubGVmdFxyXG5cclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogJHt0aGlzLmxlZnQgKyB0aGlzLmJvZHkuc2Nyb2xsTGVmdH1weDtcclxuICAgICAgdG9wOiAke3RoaXMudG9wICsgdGhpcy5ib2R5LnNjcm9sbFRvcH1weDtcclxuICAgICAgdXNlLXNlbGVjdDogbm9uZTtcclxuICAgIGBcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHNhdmUgYmluZHMgZXZlbnRzXHJcbiAgICogQHBhcmFtICB7RE9NfSBfZWxlbWVudCAgRE9NIHRoYXQgeW91IGJpbmQgZXZlbnRcclxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IF9ldmVudCAgZXZlbnQgbmFtZVxyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBfZnVuY3Rpb24gZXZlbnQgZnVuY3Rpb25cclxuICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIHdoZW4gc2F2ZSBzdWNjZXNzXHJcbiAgICovXHJcbiAgX3B1c2hSZWdpc3RlcmVkRXZlbnRzKF9lbGVtZW50LCBfZXZlbnQsIF9mdW5jdGlvbikge1xyXG5cclxuICAgIHRoaXMucmVnaXN0ZXJlZEV2ZW50cy5wdXNoKHtcclxuICAgICAgJ2VsZW1lbnQnOiBfZWxlbWVudCxcclxuICAgICAgJ2V2ZW50JzogX2V2ZW50LFxyXG4gICAgICAnZnVuY3Rpb24nOiBfZnVuY3Rpb25cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIHRydWVcclxuXHJcbiAgfVxyXG5cclxuICAvLyBpbml0aWFsIG1vdXNlIHNoYXBlIHdoZXJlIG1vdXNlIG9uIGNhbnZhc1xyXG4gIF9pbml0TW91c2UodHlwZSkge1xyXG4gICAgbGV0IFtib2R5LCB3aW5dID0gW3RoaXMuYm9keSwgdGhpcy53aW5dXHJcbiAgICBsZXQgbW91c2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgbW91c2Uuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgICB0b3A6IDA7XHJcbiAgICAgIHotaW5kZXg6IDEwMDAxO1xyXG4gICAgICB3aWR0aDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGhlaWdodDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcclxuICAgICAgYm9yZGVyLXJhZGl1czogMTAwJTtcclxuICAgIGBcclxuICAgIHRoaXMubW91c2UgPSBtb3VzZVxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQobW91c2UpXHJcblxyXG4gICAgbGV0IG1vdXNlTW92ZSA9ICgoZSkgPT4ge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhlKVxyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcbiAgICAgIGxldCBpc09uQ2FudmFzID0gdGhpcy5pc09uQ2FudmFzKHgsIHkpXHJcblxyXG4gICAgICBtb3VzZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eCAtIHRoaXMucmFkaXVzfXB4LCAke3kgLSB0aGlzLnJhZGl1c31weClgXHJcblxyXG4gICAgICBpZiAoIWlzT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ25vbmUnXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjaGFuZ2UgbW91c2Ugc3R5bGVcclxuICAgIGlmICghdGhpcy5pc01vYmlsZSkge1xyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgdGhpcy5fcHVzaFJlZ2lzdGVyZWRFdmVudHMod2luLCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG1vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIHRoaXMuX3B1c2hSZWdpc3RlcmVkRXZlbnRzKHdpbiwgJ3RvdWNobW92ZScsIG1vdXNlTW92ZSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldFJhZGl1cyhyYWRpdXMpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgIG1vdXNlLnN0eWxlLmhlaWdodCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgfVxyXG5cclxuICB6b29tSW4ocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgZHJhd0NpcmNsZSh4LCB5LCByYWRpdXMpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCByYWRpdXMgfHwgdGhpcy5yYWRpdXMsIDAsIDM2MClcclxuICAgIGN0eC5maWxsKClcclxuICAgIGN0eC5jbG9zZVBhdGgoKVxyXG4gIH1cclxuXHJcblxyXG4gIGdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBsZXQgeCwgeVxyXG4gICAgbGV0IFtkb2MsIGJvZHldID0gW3RoaXMuZG9jLCB0aGlzLmJvZHldXHJcbiAgICBsZXQgY2FudmFzID0gdGhpcy5jYW52YXNcclxuXHJcbiAgICBpZiAodGhpcy5pc01vYmlsZSkge1xyXG4gICAgICBldmVudCA9IGV2ZW50LnRvdWNoZXNbMF1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoZXZlbnQucGFnZVggfHwgZXZlbnQucGFnZVkpIHtcclxuICAgICAgeCA9IGV2ZW50LnBhZ2VYXHJcbiAgICAgIHkgPSBldmVudC5wYWdlWVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeCA9IGV2ZW50LmNsaWVudFggKyBib2R5LnNjcm9sbExlZnQgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnRcclxuICAgICAgeSA9IGV2ZW50LmNsaWVudFkgKyBib2R5LnNjcm9sbFRvcCArIGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wXHJcbiAgICB9XHJcblxyXG4gICAgeCAtPSBjYW52YXMub2Zmc2V0TGVmdFxyXG4gICAgeSAtPSBjYW52YXMub2Zmc2V0VG9wXHJcblxyXG4gICAgY29uc29sZS5sb2coeCwgeSlcclxuXHJcbiAgICByZXR1cm4gW3gsIHldXHJcbiAgfVxyXG5cclxuICBkcmF3QnlFdmVudChldmVudCkge1xyXG4gICAgaWYgKCF0aGlzLmN0eCkgcmV0dXJuXHJcblxyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgW3gsIHldID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChldmVudClcclxuXHJcbiAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgdGhpcy5kcmF3Q2lyY2xlKHgsIHkpXHJcbiAgICAgIHJldHVybiBbREVGQVVMVF9PUFRJT05TLlBFTiwgdGhpcy5jb2xvciwgeCwgeSwgdGhpcy5yYWRpdXNdXHJcbiAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgIHggLT0gdGhpcy5yYWRpdXNcclxuICAgICAgeSAtPSB0aGlzLnJhZGl1c1xyXG4gICAgICBsZXQgW3csIGhdID0gW3RoaXMucmFkaXVzICogMiwgdGhpcy5yYWRpdXMgKiAyXVxyXG4gICAgICBjdHguY2xlYXJSZWN0KHgsIHksIHcsIGgpXHJcbiAgICAgIHJldHVybiBbREVGQVVMVF9PUFRJT05TLkVSQVNFUiwgeCwgeSwgdywgaF1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlzT25DYW52YXMoeCwgeSkge1xyXG4gICAgbGV0IGJvZHkgPSB0aGlzLmJvZHlcclxuICAgIGxldCBzY3JvbGxUb3AgPSBib2R5LnNjcm9sbFRvcFxyXG5cclxuICAgIGlmICh4IDwgdGhpcy5sZWZ0IHx8IHggPiAodGhpcy5sZWZ0ICsgdGhpcy53aWR0aCkgfHwgeSA8IChzY3JvbGxUb3AgKyB0aGlzLnRvcCkgfHwgeSA+IChzY3JvbGxUb3AgKyB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRNYXhXaWR0aCh3aWR0aCkge1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IHdpZHRoXHJcbiAgfVxyXG5cclxuICBzZXRDb2xvcihjb2xvcikge1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAvLyBwZW4sIGVyYXNlclxyXG4gIHNldFRvb2wodG9vbCkge1xyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSB0b29sXHJcblxyXG4gICAgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLnNldFBlbigpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB0aGlzLnNldEVyYXNlcigpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgc2V0UGVuKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcclxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7REVGQVVMVF9PUFRJT05TLlBFTl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5QRU5cclxuICB9XHJcblxyXG4gIHNldEVyYXNlcigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAwLFxyXG4gICAgICBib3JkZXI6IGAxcHggZGFzaGVkICR7REVGQVVMVF9PUFRJT05TLkVSQVNFUl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5FUkFTRVJcclxuICB9XHJcblxyXG4gIHVuZG8oKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBjb2xvciA9IHRoaXMuY29sb3JcclxuXHJcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KVxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnBvcCgpXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLm1hcCgoc3RlcHMpID0+IHtcclxuICAgICAgc3RlcHMubWFwKChzdGVwKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgICAgIHRoaXMuY29sb3IgPSBzdGVwWzFdXHJcbiAgICAgICAgICB0aGlzLmRyYXdDaXJjbGUuYXBwbHkodGhpcywgc3RlcC5zbGljZSgyKSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgICAgIGN0eC5jbGVhclJlY3QuYXBwbHkoY3R4LCBzdGVwLnNsaWNlKDEpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogZ2V0IGltYWdlIG9yaWdpbiBzaXplXHJcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgIHNyYyAgICAgIGlhbWdlIHNvdXJjZSB1cmxcclxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2sgZnVuY3Rpb24sIHdpZHRoIGFzIGZpcnN0IHBhcmFtZXRlciBhbmQgaGVpZ2h0IGFzIHNlY29uZFxyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgKi9cclxuICBnZXRJbWFnZU9yaWdpblNpemUoc3JjLCBjYWxsYmFjaykge1xyXG4gICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpXHJcblxyXG4gICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgbGV0IHdpZHRoID0gaW1nLndpZHRoXHJcbiAgICAgIGxldCBoZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgICBjYWxsYmFjayh3aWR0aCwgaGVpZ2h0KVxyXG4gICAgfVxyXG5cclxuICAgIGltZy5zcmMgPSBzcmNcclxuICB9XHJcblxyXG4gIGdldERhdGFVUkwodHlwZSA9ICdpbWFnZS9qcGVnJywgcXVhbGl0eSA9IDAuOCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICBsZXQgc3JjID0gdGhpcy5pbWcuc3JjXHJcblxyXG4gICAgdGhpcy5nZXRJbWFnZU9yaWdpblNpemUoc3JjLCAod2lkdGgsIGhlaWdodCkgPT4ge1xyXG4gICAgICBsZXQgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgIHRlbXBDYW52YXMud2lkdGggPSB3aWR0aFxyXG4gICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgICBsZXQgdGVtcEN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICB0ZW1wQ3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgd2lkdGgsIGhlaWdodClcclxuICAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgICBjYWxsYmFjayh0ZW1wQ2FudmFzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZW1vdmUgZG9tIHRoYXQgYWRkZWQgaW50byBib2R5LFxyXG4gICAqIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgcmVnaXN0ZXJlZFxyXG4gICAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcylcclxuICAgIHRoaXMubW91c2UucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm1vdXNlKVxyXG5cclxuICAgIHRoaXMuaW1nLnNyYyA9ICcnXHJcblxyXG4gICAgdGhpcy5yZWdpc3RlcmVkRXZlbnRzLmZvckVhY2godiA9PiB7XHJcbiAgICAgIHYuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHYuZXZlbnQsIHYuZnVuY3Rpb24sIGZhbHNlKVxyXG4gICAgfSlcclxuICAgIGRlbGV0ZSB0aGlzXHJcbiAgfVxyXG59XHJcbiJdfQ==
