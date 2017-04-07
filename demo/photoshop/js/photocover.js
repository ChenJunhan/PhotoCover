'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

    this.img = document.querySelector(selector);

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

      win.addEventListener('load', function (e) {
        _this.width = img.width;
        _this.height = img.height;

        _this.canvas = document.createElement('canvas');
        _this.ctx = _this.canvas.getContext('2d');
        _this._async();

        _this.canvas.width = img.width;
        _this.canvas.height = img.height;

        body.appendChild(_this.canvas);

        _this._initMouse();
      }.bind(this), false);

      // async canvas position and size during browser resize
      win.addEventListener('resize', function (e) {
        _this._async();
      }.bind(this), false);

      var currentOperate = [];

      var canvasMouseMove = function (e) {
        currentOperate.push(_this.drawByEvent(e));
      }.bind(this);

      // canvas down
      win.addEventListener('mousedown', function (e) {
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
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJjcmVhdGVFbGVtZW50IiwiZ2V0Q29udGV4dCIsIl9hc3luYyIsImFwcGVuZENoaWxkIiwiX2luaXRNb3VzZSIsImJpbmQiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlTW92ZSIsInB1c2giLCJkcmF3QnlFdmVudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjb29yZGluYXRlIiwiZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwieCIsInkiLCJpc09uQ2FudmFzIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwic3R5bGUiLCJjc3NUZXh0Iiwic2Nyb2xsTGVmdCIsInNjcm9sbFRvcCIsInR5cGUiLCJ0cmFuc2Zvcm0iLCJkaXNwbGF5IiwiY3Vyc29yIiwic2V0UmFkaXVzIiwiZmlsbFN0eWxlIiwiYmVnaW5QYXRoIiwiYXJjIiwiZmlsbCIsImNsb3NlUGF0aCIsImV2ZW50IiwiY2xpZW50WCIsImRvY3VtZW50RWxlbWVudCIsImNsaWVudFkiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0VG9wIiwiZHJhd0NpcmNsZSIsInciLCJoIiwiY2xlYXJSZWN0IiwidG9vbCIsInRvTG93ZXJDYXNlIiwic2V0UGVuIiwic2V0RXJhc2VyIiwiT2JqZWN0IiwiYXNzaWduIiwiYm9yZGVyUmFkaXVzIiwiYm9yZGVyIiwicG9wIiwibWFwIiwic3RlcHMiLCJzdGVwIiwiYXBwbHkiLCJzbGljZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFNQSxrQkFBa0I7QUFDdEJDLFVBQVEsRUFEYztBQUV0QkMsYUFBVyxHQUZXO0FBR3RCQyxTQUFPLE9BSGU7QUFJdEJDLFNBQU8sS0FKZTtBQUt0QkMsb0JBQWtCLEtBTEk7QUFNdEJDLHVCQUFxQixNQU5DO0FBT3RCQyxPQUFLLEtBUGlCO0FBUXRCQyxVQUFRO0FBUmMsQ0FBeEI7O0lBV01DLFU7QUFDSixzQkFBWUMsUUFBWixFQUFzQjtBQUFBOztBQUNwQixTQUFLQyxNQUFMLEdBQWNYLGdCQUFnQkMsTUFBOUI7QUFDQSxTQUFLVyxRQUFMLEdBQWdCWixnQkFBZ0JFLFNBQWhDO0FBQ0EsU0FBS1csS0FBTCxHQUFhYixnQkFBZ0JHLEtBQTdCO0FBQ0EsU0FBS1csU0FBTCxHQUFpQmQsZ0JBQWdCSSxLQUFqQzs7QUFFQSxTQUFLVyxnQkFBTCxHQUF3QixFQUF4Qjs7QUFFQSxTQUFLQyxHQUFMLEdBQVdDLFNBQVNDLGFBQVQsQ0FBdUJSLFFBQXZCLENBQVg7O0FBRUEsU0FBS1MsR0FBTCxHQUFXQyxNQUFYO0FBQ0EsU0FBS0MsR0FBTCxHQUFXSixRQUFYO0FBQ0EsU0FBS0ssSUFBTCxHQUFZLEtBQUtELEdBQUwsQ0FBU0MsSUFBckI7O0FBRUEsU0FBS0MsS0FBTDtBQUNBLFNBQUtDLEtBQUw7QUFDQSxTQUFLQyxNQUFMO0FBQ0EsU0FBS0MsSUFBTDtBQUNBLFNBQUtDLEdBQUw7QUFDQSxTQUFLQyxNQUFMO0FBQ0EsU0FBS0MsR0FBTDs7QUFFQSxTQUFLQyxLQUFMO0FBQ0Q7Ozs7NEJBRU87QUFBQTs7QUFDTixVQUFJLENBQUMsS0FBS2QsR0FBVixFQUFlO0FBQ2IsY0FBTWUsTUFBTSxtQkFBTixDQUFOO0FBQ0E7QUFDRDs7QUFKSyxpQkFNaUIs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QVAsQ0FBYzNELE1BQU04QixLQUFwQixFQUEyQjtBQUN6QjhCLHNCQUFjLENBRFc7QUFFekJDLGdDQUFzQnBGLGdCQUFnQk07QUFGYixPQUEzQjs7QUFLQSxXQUFLUSxTQUFMLEdBQWlCZCxnQkFBZ0JRLE1BQWpDO0FBQ0Q7OzsyQkFFTTtBQUFBOztBQUNMLFVBQUlxQixNQUFNLEtBQUtBLEdBQWY7QUFDQSxVQUFJaEIsUUFBUSxLQUFLQSxLQUFqQjs7QUFFQWdCLFVBQUkrQyxTQUFKLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixLQUFLcEQsS0FBekIsRUFBZ0MsS0FBS0MsTUFBckM7QUFDQSxXQUFLVixnQkFBTCxDQUFzQnNFLEdBQXRCOztBQUVBLFdBQUt0RSxnQkFBTCxDQUFzQnVFLEdBQXRCLENBQTBCLFVBQUNDLEtBQUQsRUFBVztBQUNuQ0EsY0FBTUQsR0FBTixDQUFVLFVBQUNFLElBQUQsRUFBVTtBQUNsQixjQUFJQSxLQUFLLENBQUwsTUFBWXhGLGdCQUFnQk8sR0FBaEMsRUFBcUM7QUFDbkMsbUJBQUtNLEtBQUwsR0FBYTJFLEtBQUssQ0FBTCxDQUFiO0FBQ0EsbUJBQUtmLFVBQUwsQ0FBZ0JnQixLQUFoQixTQUE0QkQsS0FBS0UsS0FBTCxDQUFXLENBQVgsQ0FBNUI7QUFDRCxXQUhELE1BR08sSUFBSUYsS0FBSyxDQUFMLE1BQVl4RixnQkFBZ0JRLE1BQWhDLEVBQXdDO0FBQzdDcUIsZ0JBQUkrQyxTQUFKLENBQWNhLEtBQWQsQ0FBb0I1RCxHQUFwQixFQUF5QjJELEtBQUtFLEtBQUwsQ0FBVyxDQUFYLENBQXpCO0FBQ0Q7QUFDRixTQVBEO0FBUUQsT0FURDs7QUFXQSxXQUFLN0UsS0FBTCxHQUFhQSxLQUFiO0FBQ0QiLCJmaWxlIjoicGhvdG9jb3Zlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcclxuICBSQURJVVM6IDIwLFxyXG4gIE1BWF9XSURUSDogODAwLFxyXG4gIENPTE9SOiAnYmxhY2snLFxyXG4gIE1PVVNFOiAncGVuJyxcclxuICBQRU5fQk9SREVSX0NPTE9SOiAncmVkJyxcclxuICBFUkFTRVJfQk9SREVSX0NPTE9SOiAnIzY2NicsXHJcbiAgUEVOOiAncGVuJyxcclxuICBFUkFTRVI6ICdlcmFzZXInXHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IERFRkFVTFRfT1BUSU9OUy5SQURJVVNcclxuICAgIHRoaXMubWF4V2lkdGggPSBERUZBVUxUX09QVElPTlMuTUFYX1dJRFRIXHJcbiAgICB0aGlzLmNvbG9yID0gREVGQVVMVF9PUFRJT05TLkNPTE9SXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5NT1VTRVxyXG5cclxuICAgIHRoaXMub3BlcmF0ZUhpc3RvcmllcyA9IFtdXHJcblxyXG4gICAgdGhpcy5pbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxyXG5cclxuICAgIHRoaXMud2luID0gd2luZG93XHJcbiAgICB0aGlzLmRvYyA9IGRvY3VtZW50XHJcbiAgICB0aGlzLmJvZHkgPSB0aGlzLmRvYy5ib2R5XHJcblxyXG4gICAgdGhpcy5tb3VzZVxyXG4gICAgdGhpcy53aWR0aFxyXG4gICAgdGhpcy5oZWlnaHRcclxuICAgIHRoaXMubGVmdFxyXG4gICAgdGhpcy50b3BcclxuICAgIHRoaXMuY2FudmFzXHJcbiAgICB0aGlzLmN0eFxyXG5cclxuICAgIHRoaXMuX2luaXQoKVxyXG4gIH1cclxuXHJcbiAgX2luaXQoKSB7XHJcbiAgICBpZiAoIXRoaXMuaW1nKSB7XHJcbiAgICAgIHRocm93IEVycm9yKCdObyBJbWFnZSBTZWxlY3RlZCcpXHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGxldCBbYm9keSwgd2luLCBpbWddID0gW3RoaXMuYm9keSwgdGhpcy53aW4sIHRoaXMuaW1nXVxyXG5cclxuICAgIC8vIGluaXRpYWwgY2FudmFzIGFuZCBpdHMgc2l6ZSBhbmQgcG9zaXRpb25cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKChlKSA9PiB7XHJcbiAgICAgIHRoaXMud2lkdGggPSBpbWcud2lkdGhcclxuICAgICAgdGhpcy5oZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICB0aGlzLl9hc3luYygpXHJcblxyXG4gICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgICBib2R5LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKVxyXG5cclxuICAgICAgdGhpcy5faW5pdE1vdXNlKClcclxuXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcblxyXG4gICAgLy8gYXN5bmMgY2FudmFzIHBvc2l0aW9uIGFuZCBzaXplIGR1cmluZyBicm93c2VyIHJlc2l6ZVxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgoZSkgPT4ge1xyXG4gICAgICB0aGlzLl9hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcblxyXG4gICAgbGV0IGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlKSA9PiB7XHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjYW52YXMgZG93blxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgoZSkgPT4ge1xyXG4gICAgICBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuXHJcbiAgICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoKGUpID0+IHtcclxuICAgICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcblxyXG4gICAgICBpZiAodGhpcy5pc09uQ2FudmFzKHgsIHkpKSB7XHJcbiAgICAgICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuICB9XHJcblxyXG4gIC8vIGFzeW5jIHggYW5kIHkgZnJvbSBpbWFnZSB0byBjYW52YXNcclxuICBfYXN5bmMoKSB7XHJcbiAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICB0aGlzLnRvcCA9IGNvb3JkaW5hdGUudG9wXHJcbiAgICB0aGlzLmxlZnQgPSBjb29yZGluYXRlLmxlZnRcclxuXHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5sZWZ0ICsgdGhpcy5ib2R5LnNjcm9sbExlZnR9cHg7XHJcbiAgICAgIHRvcDogJHt0aGlzLnRvcCArIHRoaXMuYm9keS5zY3JvbGxUb3B9cHg7XHJcbiAgICAgIHVzZS1zZWxlY3Q6IG5vbmU7XHJcbiAgICBgXHJcbiAgfVxyXG5cclxuICAvLyBpbml0aWFsIG1vdXNlIHNoYXBlIHdoZXJlIG1vdXNlIG9uIGNhbnZhc1xyXG4gIF9pbml0TW91c2UodHlwZSkge1xyXG4gICAgbGV0IFtib2R5LCB3aW5dID0gW3RoaXMuYm9keSwgdGhpcy53aW5dXHJcbiAgICBsZXQgbW91c2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgbW91c2Uuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgZGlzcGxheTogbm9uZTtcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAwO1xyXG4gICAgICB0b3A6IDA7XHJcbiAgICAgIHdpZHRoOiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgaGVpZ2h0OiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xyXG4gICAgICBib3JkZXItcmFkaXVzOiAxMDAlO1xyXG4gICAgYFxyXG4gICAgdGhpcy5tb3VzZSA9IG1vdXNlXHJcblxyXG4gICAgYm9keS5hcHBlbmRDaGlsZChtb3VzZSlcclxuXHJcbiAgICAvLyBjaGFuZ2UgbW91c2Ugc3R5bGVcclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKGUpID0+IHtcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1c31weCwgJHt5IC0gdGhpcy5yYWRpdXN9cHgpYFxyXG5cclxuICAgICAgaWYgKCFpc09uQ2FudmFzKSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdub25lJ1xyXG4gICAgICB9XHJcblxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG4gIH1cclxuXHJcbiAgc2V0UmFkaXVzKHJhZGl1cykge1xyXG4gICAgaWYgKHJhZGl1cyA8IDIgfHwgcmFkaXVzID4gMTAwKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzXHJcblxyXG4gICAgbW91c2Uuc3R5bGUud2lkdGggPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gICAgbW91c2Uuc3R5bGUuaGVpZ2h0ID0gcmFkaXVzICogMiArICdweCdcclxuICB9XHJcblxyXG4gIHpvb21JbihyYWRpdXMgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyArIHJhZGl1cylcclxuICB9XHJcblxyXG4gIHpvb21PdXQocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgLSByYWRpdXMpXHJcbiAgfVxyXG5cclxuICBkcmF3Q2lyY2xlKHgsIHksIHJhZGl1cykge1xyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcclxuICAgIGN0eC5iZWdpblBhdGgoKVxyXG4gICAgY3R4LmFyYyh4ICsgMSwgeSArIDEsIHJhZGl1cyB8fCB0aGlzLnJhZGl1cywgMCwgMzYwKVxyXG4gICAgY3R4LmZpbGwoKVxyXG4gICAgY3R4LmNsb3NlUGF0aCgpXHJcbiAgfVxyXG5cclxuXHJcbiAgZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpIHtcclxuICAgIGxldCB4LCB5XHJcbiAgICBsZXQgW2RvYywgYm9keV0gPSBbdGhpcy5kb2MsIHRoaXMuYm9keV1cclxuICAgIGxldCBjYW52YXMgPSB0aGlzLmNhbnZhc1xyXG5cclxuXHJcbiAgICBpZiAoZXZlbnQucGFnZVggfHwgZXZlbnQucGFnZVkpIHtcclxuICAgICAgeCA9IGV2ZW50LnBhZ2VYXHJcbiAgICAgIHkgPSBldmVudC5wYWdlWVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeCA9IGUuY2xpZW50WCArIGJvZHkuc2Nyb2xsTGVmdCArIGRvYy5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdFxyXG4gICAgICB5ID0gZS5jbGllbnRZICsgYm9keS5zY3JvbGxUb3AgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcFxyXG4gICAgfVxyXG5cclxuICAgIHggLT0gY2FudmFzLm9mZnNldExlZnRcclxuICAgIHkgLT0gY2FudmFzLm9mZnNldFRvcFxyXG5cclxuICAgIHJldHVybiBbeCwgeV1cclxuICB9XHJcblxyXG4gIGRyYXdCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBpZiAoIXRoaXMuY3R4KSByZXR1cm5cclxuXHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBbeCwgeV09IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpXHJcblxyXG4gICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuZHJhd0NpcmNsZSh4LCB5KVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB4IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIHkgLT0gdGhpcy5yYWRpdXNcclxuICAgICAgbGV0IFt3LCBoXSA9IFt0aGlzLnJhZGl1cyAqIDIsIHRoaXMucmFkaXVzICogMl1cclxuICAgICAgY3R4LmNsZWFyUmVjdCh4LCB5LCB3LCBoKVxyXG4gICAgICByZXR1cm4gW0RFRkFVTFRfT1BUSU9OUy5FUkFTRVIsIHgsIHksIHcsIGhdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHkpIHtcclxuXHJcbiAgICBpZiAoeCA8IHRoaXMubGVmdCB8fCB4ID4gKHRoaXMubGVmdCArIHRoaXMud2lkdGgpIHx8IHkgPCB0aGlzLnRvcCB8fCB5ID4gKHRoaXMudG9wICsgdGhpcy5oZWlnaHQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldE1heFdpZHRoKHdpZHRoKSB7XHJcbiAgICB0aGlzLm1heFdpZHRoID0gd2lkdGhcclxuICB9XHJcblxyXG4gIHNldENvbG9yKGNvbG9yKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcblxyXG4gIC8vIHBlbiwgZXJhc2VyXHJcbiAgc2V0VG9vbCh0b29sKSB7XHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IHRvb2xcclxuXHJcbiAgICBpZiAodG9vbC50b0xvd2VyQ2FzZSgpID09PSBERUZBVUxUX09QVElPTlMuUEVOKSB7XHJcbiAgICAgIHRoaXMuc2V0UGVuKClcclxuICAgIH0gZWxzZSBpZiAodG9vbC50b0xvd2VyQ2FzZSgpID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgIHRoaXMuc2V0RXJhc2VyKClcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICBzZXRQZW4oKSB7XHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICBPYmplY3QuYXNzaWduKG1vdXNlLnN0eWxlLCB7XHJcbiAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxyXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHtERUZBVUxUX09QVElPTlMuUEVOX0JPUkRFUl9DT0xPUn1gXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLlBFTlxyXG4gIH1cclxuXHJcbiAgc2V0RXJhc2VyKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6IDAsXHJcbiAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHtERUZBVUxUX09QVElPTlMuRVJBU0VSX0JPUkRFUl9DT0xPUn1gXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLkVSQVNFUlxyXG4gIH1cclxuXHJcbiAgdW5kbygpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IGNvbG9yID0gdGhpcy5jb2xvclxyXG5cclxuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucG9wKClcclxuXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMubWFwKChzdGVwcykgPT4ge1xyXG4gICAgICBzdGVwcy5tYXAoKHN0ZXApID0+IHtcclxuICAgICAgICBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICAgICAgdGhpcy5jb2xvciA9IHN0ZXBbMV1cclxuICAgICAgICAgIHRoaXMuZHJhd0NpcmNsZS5hcHBseSh0aGlzLCBzdGVwLnNsaWNlKDIpKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICAgICAgY3R4LmNsZWFyUmVjdC5hcHBseShjdHgsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcblxyXG59XHJcbiJdfQ==
