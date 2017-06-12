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
      win.addEventListener('resize', function (e) {
        _this._async();
      }.bind(this), false);

      var currentOperate = [];

      var canvasMouseMove = function (e) {
        e.preventDefault();
        currentOperate.push(_this.drawByEvent(e));
      }.bind(this);

      // canvas down
      win.addEventListener('mousedown', function (e) {
        e.preventDefault();
        currentOperate = [];
        currentOperate.push(_this.drawByEvent(e));

        win.addEventListener('mousemove', canvasMouseMove, false);
      }.bind(this), false);

      win.addEventListener('mouseup', function (e) {
        win.removeEventListener('mousemove', canvasMouseMove, false);
        var coordinate = _this.getCoordinateByEvent(e);
        var _ref2 = [e.pageX, e.pageY],
            x = _ref2[0],
            y = _ref2[1];


        if (_this.isOnCanvas(x, y)) {
          _this.operateHistories.push(currentOperate);
          currentOperate = [];
        }
      }.bind(this), false);
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

    // initial mouse shape where mouse on canvas

  }, {
    key: '_initMouse',
    value: function _initMouse(type) {
      var _this2 = this;

      var _ref3 = [this.body, this.win],
          body = _ref3[0],
          win = _ref3[1];

      var mouse = document.createElement('div');
      mouse.style.cssText = '\n      display: none;\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: ' + this.radius * 2 + 'px;\n      height: ' + this.radius * 2 + 'px;\n      border: 1px solid red;\n      border-radius: 100%;\n    ';
      this.mouse = mouse;

      body.appendChild(mouse);

      // change mouse style
      win.addEventListener('mousemove', function (e) {
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
      }.bind(this), false);
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

      if (x < this.left || x > this.left + this.width || y < this.top || y > this.top + this.height) {
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
  }, {
    key: 'getDataURL',
    value: function getDataURL() {
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      var tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(this.img, 0, 0, this.width, this.height);
      tempCtx.drawImage(this.canvas, 0, 0, this.width, this.height);

      return tempCanvas.toDataURL();
    }
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiY3JlYXRlRWxlbWVudCIsImdldENvbnRleHQiLCJfYXN5bmMiLCJhcHBlbmRDaGlsZCIsIl9pbml0TW91c2UiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsImJpbmQiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlTW92ZSIsInByZXZlbnREZWZhdWx0IiwicHVzaCIsImRyYXdCeUV2ZW50IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImNvb3JkaW5hdGUiLCJnZXRDb29yZGluYXRlQnlFdmVudCIsInBhZ2VYIiwicGFnZVkiLCJ4IiwieSIsImlzT25DYW52YXMiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJzdHlsZSIsImNzc1RleHQiLCJzY3JvbGxMZWZ0Iiwic2Nyb2xsVG9wIiwidHlwZSIsInRyYW5zZm9ybSIsImRpc3BsYXkiLCJjdXJzb3IiLCJzZXRSYWRpdXMiLCJmaWxsU3R5bGUiLCJiZWdpblBhdGgiLCJhcmMiLCJmaWxsIiwiY2xvc2VQYXRoIiwiZXZlbnQiLCJjbGllbnRYIiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50WSIsIm9mZnNldExlZnQiLCJvZmZzZXRUb3AiLCJkcmF3Q2lyY2xlIiwidyIsImgiLCJjbGVhclJlY3QiLCJ0b29sIiwidG9Mb3dlckNhc2UiLCJzZXRQZW4iLCJzZXRFcmFzZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIiwidGVtcENhbnZhcyIsInRlbXBDdHgiLCJkcmF3SW1hZ2UiLCJ0b0RhdGFVUkwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxrQkFBa0I7QUFDdEJDLFVBQVEsRUFEYztBQUV0QkMsYUFBVyxHQUZXO0FBR3RCQyxTQUFPLE9BSGU7QUFJdEJDLFNBQU8sS0FKZTtBQUt0QkMsb0JBQWtCLEtBTEk7QUFNdEJDLHVCQUFxQixNQU5DO0FBT3RCQyxPQUFLLEtBUGlCO0FBUXRCQyxVQUFRO0FBUmMsQ0FBeEI7O0lBV01DLFU7QUFDSixzQkFBWUMsUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLQyxNQUFMLEdBQWNYLGdCQUFnQkMsTUFBOUI7QUFDQSxTQUFLVyxRQUFMLEdBQWdCWixnQkFBZ0JFLFNBQWhDO0FBQ0EsU0FBS1csS0FBTCxHQUFhYixnQkFBZ0JHLEtBQTdCO0FBQ0EsU0FBS1csU0FBTCxHQUFpQmQsZ0JBQWdCSSxLQUFqQzs7QUFFQSxTQUFLVyxnQkFBTCxHQUF3QixFQUF4Qjs7QUFFQTtBQUNBLFFBQUksUUFBT0wsUUFBUCx5Q0FBT0EsUUFBUCxPQUFvQixRQUF4QixFQUFrQztBQUNoQyxXQUFLTSxHQUFMLEdBQVdOLFFBQVg7O0FBRUY7QUFDQyxLQUpELE1BSU8sSUFBSSxPQUFPQSxRQUFQLEtBQW9CLFFBQXhCLEVBQWtDO0FBQ3ZDLFdBQUtNLEdBQUwsR0FBV0MsU0FBU0MsYUFBVCxDQUF1QlIsUUFBdkIsQ0FBWDtBQUNEOztBQUVELFNBQUtTLEdBQUwsR0FBV0MsTUFBWDtBQUNBLFNBQUtDLEdBQUwsR0FBV0osUUFBWDtBQUNBLFNBQUtLLElBQUwsR0FBWSxLQUFLRCxHQUFMLENBQVNDLElBQXJCOztBQUVBLFNBQUtDLEtBQUw7QUFD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RWM7QUFDWCxVQUFJK0UsYUFBYTNFLFNBQVNlLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBakI7QUFDQTRELGlCQUFXcEUsS0FBWCxHQUFtQixLQUFLQSxLQUF4QjtBQUNBb0UsaUJBQVduRSxNQUFYLEdBQW9CLEtBQUtBLE1BQXpCO0FBQ0EsVUFBSW9FLFVBQVVELFdBQVczRCxVQUFYLENBQXNCLElBQXRCLENBQWQ7QUFDQTRELGNBQVFDLFNBQVIsQ0FBa0IsS0FBSzlFLEdBQXZCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBQWtDLEtBQUtRLEtBQXZDLEVBQThDLEtBQUtDLE1BQW5EO0FBQ0FvRSxjQUFRQyxTQUFSLENBQWtCLEtBQUtsRSxNQUF2QixFQUErQixDQUEvQixFQUFrQyxDQUFsQyxFQUFxQyxLQUFLSixLQUExQyxFQUFpRCxLQUFLQyxNQUF0RDs7QUFFQSxhQUFPbUUsV0FBV0csU0FBWCxFQUFQO0FBQ0giLCJmaWxlIjoicGhvdG9jb3Zlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcclxuICBSQURJVVM6IDIwLFxyXG4gIE1BWF9XSURUSDogODAwLFxyXG4gIENPTE9SOiAnYmxhY2snLFxyXG4gIE1PVVNFOiAncGVuJyxcclxuICBQRU5fQk9SREVSX0NPTE9SOiAncmVkJyxcclxuICBFUkFTRVJfQk9SREVSX0NPTE9SOiAnIzY2NicsXHJcbiAgUEVOOiAncGVuJyxcclxuICBFUkFTRVI6ICdlcmFzZXInXHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IERFRkFVTFRfT1BUSU9OUy5SQURJVVNcclxuICAgIHRoaXMubWF4V2lkdGggPSBERUZBVUxUX09QVElPTlMuTUFYX1dJRFRIXHJcbiAgICB0aGlzLmNvbG9yID0gREVGQVVMVF9PUFRJT05TLkNPTE9SXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5NT1VTRVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3RvcmllcyA9IFtdXHJcblxyXG4gICAgLy8gc2VsZWN0b3JcclxuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgIHRoaXMuaW1nID0gc2VsZWN0b3JcclxuXHJcbiAgICAvLyBpbWFnZSBlbGVtZW50XHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGhpcy5pbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMud2luID0gd2luZG93XHJcbiAgICB0aGlzLmRvYyA9IGRvY3VtZW50XHJcbiAgICB0aGlzLmJvZHkgPSB0aGlzLmRvYy5ib2R5XHJcblxyXG4gICAgdGhpcy5tb3VzZVxyXG4gICAgdGhpcy53aWR0aFxyXG4gICAgdGhpcy5oZWlnaHRcclxuICAgIHRoaXMubGVmdFxyXG4gICAgdGhpcy50b3BcclxuICAgIHRoaXMuY2FudmFzXHJcbiAgICB0aGlzLmN0eFxyXG5cclxuICAgIHRoaXMuX2luaXQoKVxyXG4gIH1cclxuXHJcbiAgX2luaXQoKSB7XHJcbiAgICBpZiAoIXRoaXMuaW1nKSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdObyBJbWFnZSBTZWxlY3RlZCcpXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGxldCBbYm9keSwgd2luLCBpbWddID0gW3RoaXMuYm9keSwgdGhpcy53aW4sIHRoaXMuaW1nXVxyXG5cclxuICAgIC8vIGluaXRpYWwgY2FudmFzIGFuZCBpdHMgc2l6ZSBhbmQgcG9zaXRpb25cclxuICAgIHRoaXMud2lkdGggPSBpbWcud2lkdGhcclxuICAgIHRoaXMuaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgdGhpcy5fYXN5bmMoKVxyXG5cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcylcclxuXHJcbiAgICB0aGlzLl9pbml0TW91c2UoKVxyXG5cclxuICAgIC8vIGFzeW5jIGNhbnZhcyBwb3NpdGlvbiBhbmQgc2l6ZSBkdXJpbmcgYnJvd3NlciByZXNpemVcclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKGUpID0+IHtcclxuICAgICAgdGhpcy5fYXN5bmMoKVxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG5cclxuICAgIGxldCBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlTW92ZSA9ICgoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIC8vIGNhbnZhcyBkb3duXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKChlKSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuXHJcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoKGUpID0+IHtcclxuICAgICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcblxyXG4gICAgICBpZiAodGhpcy5pc09uQ2FudmFzKHgsIHkpKSB7XHJcbiAgICAgICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuICB9XHJcblxyXG4gIC8vIGFzeW5jIHggYW5kIHkgZnJvbSBpbWFnZSB0byBjYW52YXNcclxuICBfYXN5bmMoKSB7XHJcbiAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICB0aGlzLnRvcCA9IGNvb3JkaW5hdGUudG9wXHJcbiAgICB0aGlzLmxlZnQgPSBjb29yZGluYXRlLmxlZnRcclxuXHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5sZWZ0ICsgdGhpcy5ib2R5LnNjcm9sbExlZnR9cHg7XHJcbiAgICAgIHRvcDogJHt0aGlzLnRvcCArIHRoaXMuYm9keS5zY3JvbGxUb3B9cHg7XHJcbiAgICAgIHVzZS1zZWxlY3Q6IG5vbmU7XHJcbiAgICBgXHJcbiAgfVxyXG5cclxuICAvLyBpbml0aWFsIG1vdXNlIHNoYXBlIHdoZXJlIG1vdXNlIG9uIGNhbnZhc1xyXG4gIF9pbml0TW91c2UodHlwZSkge1xyXG4gICAgbGV0IFtib2R5LCB3aW5dID0gW3RoaXMuYm9keSwgdGhpcy53aW5dXHJcbiAgICBsZXQgbW91c2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgbW91c2Uuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgICB0b3A6IDA7XHJcbiAgICAgIHdpZHRoOiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgaGVpZ2h0OiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xyXG4gICAgICBib3JkZXItcmFkaXVzOiAxMDAlO1xyXG4gICAgYFxyXG4gICAgdGhpcy5tb3VzZSA9IG1vdXNlXHJcblxyXG4gICAgYm9keS5hcHBlbmRDaGlsZChtb3VzZSlcclxuXHJcbiAgICAvLyBjaGFuZ2UgbW91c2Ugc3R5bGVcclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKGUpID0+IHtcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1c31weCwgJHt5IC0gdGhpcy5yYWRpdXN9cHgpYFxyXG5cclxuICAgICAgaWYgKCFpc09uQ2FudmFzKSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdub25lJ1xyXG4gICAgICB9XHJcblxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG4gIH1cclxuXHJcbiAgc2V0UmFkaXVzKHJhZGl1cykge1xyXG4gICAgaWYgKHJhZGl1cyA8IDIgfHwgcmFkaXVzID4gMTAwKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzXHJcblxyXG4gICAgbW91c2Uuc3R5bGUud2lkdGggPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gICAgbW91c2Uuc3R5bGUuaGVpZ2h0ID0gcmFkaXVzICogMiArICdweCdcclxuICB9XHJcblxyXG4gIHpvb21JbihyYWRpdXMgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyArIHJhZGl1cylcclxuICB9XHJcblxyXG4gIHpvb21PdXQocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgLSByYWRpdXMpXHJcbiAgfVxyXG5cclxuICBkcmF3Q2lyY2xlKHgsIHksIHJhZGl1cykge1xyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5iZWdpblBhdGgoKVxyXG4gICAgY3R4LmFyYyh4ICsgMSwgeSArIDEsIHJhZGl1cyB8fCB0aGlzLnJhZGl1cywgMCwgMzYwKVxyXG4gICAgY3R4LmZpbGwoKVxyXG4gICAgY3R4LmNsb3NlUGF0aCgpXHJcbiAgfVxyXG5cclxuXHJcbiAgZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpIHtcclxuICAgIGxldCB4LCB5XHJcbiAgICBsZXQgW2RvYywgYm9keV0gPSBbdGhpcy5kb2MsIHRoaXMuYm9keV1cclxuICAgIGxldCBjYW52YXMgPSB0aGlzLmNhbnZhc1xyXG5cclxuXHJcbiAgICBpZiAoZXZlbnQucGFnZVggfHwgZXZlbnQucGFnZVkpIHtcclxuICAgICAgeCA9IGV2ZW50LnBhZ2VYXHJcbiAgICAgIHkgPSBldmVudC5wYWdlWVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeCA9IGUuY2xpZW50WCArIGJvZHkuc2Nyb2xsTGVmdCArIGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdFxyXG4gICAgICB5ID0gZS5jbGllbnRZICsgYm9keS5zY3JvbGxUb3AgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxyXG4gICAgfVxyXG5cclxuICAgIHggLT0gY2FudmFzLm9mZnNldExlZnRcclxuICAgIHkgLT0gY2FudmFzLm9mZnNldFRvcFxyXG5cclxuICAgIHJldHVybiBbeCwgeV1cclxuICB9XHJcblxyXG4gIGRyYXdCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm5cclxuXHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBbeCwgeV09IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpXHJcblxyXG4gICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuZHJhd0NpcmNsZSh4LCB5KVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB4IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIHkgLT0gdGhpcy5yYWRpdXNcclxuICAgICAgbGV0IFt3LCBoXSA9IFt0aGlzLnJhZGl1cyAqIDIsIHRoaXMucmFkaXVzICogMl1cclxuICAgICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5FUkFTRVIsIHgsIHksIHcsIGhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHkpIHtcclxuXHJcbiAgICBpZiAoeCA8IHRoaXMubGVmdCB8fCB4ID4gKHRoaXMubGVmdCArIHRoaXMud2lkdGgpIHx8IHkgPCB0aGlzLnRvcCB8fCB5ID4gKHRoaXMudG9wICsgdGhpcy5oZWlnaHQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldE1heFdpZHRoKHdpZHRoKSB7XHJcbiAgICB0aGlzLm1heFdpZHRoID0gd2lkdGhcclxuICB9XHJcblxyXG4gIHNldENvbG9yKGNvbG9yKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcblxyXG4gIC8vIHBlbiwgZXJhc2VyXHJcbiAgc2V0VG9vbCh0b29sKSB7XHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IHRvb2xcclxuXHJcbiAgICBpZiAodG9vbC50b0xvd2VyQ2FzZSgpID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuc2V0UGVuKClcclxuICAgIH0gZWxzZSBpZiAodG9vbC50b0xvd2VyQ2FzZSgpID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgIHRoaXMuc2V0RXJhc2VyKClcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICBzZXRQZW4oKSB7XHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICBPYmplY3QuYXNzaWduKG1vdXNlLnN0eWxlLCB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxyXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHtERUZBVUxUX09QVElPTlMuUEVOX0JPUkRFUl9DT0xPUn1gXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLlBFTlxyXG4gIH1cclxuXHJcbiAgc2V0RXJhc2VyKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6IDAsXHJcbiAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHtERUZBVUxUX09QVElPTlMuRVJBU0VSX0JPUkRFUl9DT0xPUn1gXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLkVSQVNFUlxyXG4gIH1cclxuXHJcbiAgdW5kbygpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IGNvbG9yID0gdGhpcy5jb2xvclxyXG5cclxuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucG9wKClcclxuXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMubWFwKChzdGVwcykgPT4ge1xyXG4gICAgICBzdGVwcy5tYXAoKHN0ZXApID0+IHtcclxuICAgICAgICBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICAgICAgdGhpcy5jb2xvciA9IHN0ZXBbMV1cclxuICAgICAgICAgIHRoaXMuZHJhd0NpcmNsZS5hcHBseSh0aGlzLCBzdGVwLnNsaWNlKDIpKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICAgICAgY3R4LmNsZWFyUmVjdC5hcHBseShjdHgsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcblxyXG4gICAgZ2V0RGF0YVVSTCgpIHtcclxuICAgICAgbGV0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICB0ZW1wQ2FudmFzLndpZHRoID0gdGhpcy53aWR0aFxyXG4gICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IHRoaXMuaGVpZ2h0XHJcbiAgICAgIGxldCB0ZW1wQ3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcclxuICAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KVxyXG5cclxuICAgICAgcmV0dXJuIHRlbXBDYW52YXMudG9EYXRhVVJMKClcclxuICB9XHJcblxyXG59XHJcbiJdfQ==
