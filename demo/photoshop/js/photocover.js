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
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJjcmVhdGVFbGVtZW50IiwiZ2V0Q29udGV4dCIsIl9hc3luYyIsImFwcGVuZENoaWxkIiwiX2luaXRNb3VzZSIsImJpbmQiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlTW92ZSIsInByZXZlbnREZWZhdWx0IiwicHVzaCIsImRyYXdCeUV2ZW50IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImNvb3JkaW5hdGUiLCJnZXRDb29yZGluYXRlQnlFdmVudCIsInBhZ2VYIiwicGFnZVkiLCJ4IiwieSIsImlzT25DYW52YXMiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJzdHlsZSIsImNzc1RleHQiLCJzY3JvbGxMZWZ0Iiwic2Nyb2xsVG9wIiwidHlwZSIsInRyYW5zZm9ybSIsImRpc3BsYXkiLCJjdXJzb3IiLCJzZXRSYWRpdXMiLCJmaWxsU3R5bGUiLCJiZWdpblBhdGgiLCJhcmMiLCJmaWxsIiwiY2xvc2VQYXRoIiwiZXZlbnQiLCJjbGllbnRYIiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50WSIsIm9mZnNldExlZnQiLCJvZmZzZXRUb3AiLCJkcmF3Q2lyY2xlIiwidyIsImgiLCJjbGVhclJlY3QiLCJ0b29sIiwidG9Mb3dlckNhc2UiLCJzZXRQZW4iLCJzZXRFcmFzZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBLElBQU1BLGtCQUFrQjtBQUN0QkMsVUFBUSxFQURjO0FBRXRCQyxhQUFXLEdBRlc7QUFHdEJDLFNBQU8sT0FIZTtBQUl0QkMsU0FBTyxLQUplO0FBS3RCQyxvQkFBa0IsS0FMSTtBQU10QkMsdUJBQXFCLE1BTkM7QUFPdEJDLE9BQUssS0FQaUI7QUFRdEJDLFVBQVE7QUFSYyxDQUF4Qjs7SUFXTUMsVTtBQUNKLHNCQUFZQyxRQUFaLEVBQXNCO0FBQUE7O0FBQ3BCLFNBQUtDLE1BQUwsR0FBY1gsZ0JBQWdCQyxNQUE5QjtBQUNBLFNBQUtXLFFBQUwsR0FBZ0JaLGdCQUFnQkUsU0FBaEM7QUFDQSxTQUFLVyxLQUFMLEdBQWFiLGdCQUFnQkcsS0FBN0I7QUFDQSxTQUFLVyxTQUFMLEdBQWlCZCxnQkFBZ0JJLEtBQWpDOztBQUVBLFNBQUtXLGdCQUFMLEdBQXdCLEVBQXhCOztBQUVBLFNBQUtDLEdBQUwsR0FBV0MsU0FBU0MsYUFBVCxDQUF1QlIsUUFBdkIsQ0FBWDs7QUFFQSxTQUFLUyxHQUFMLEdBQVdDLE1BQVg7QUFDQSxTQUFLQyxHQUFMLEdBQVdKLFFBQVg7QUFDQSxTQUFLSyxJQUFMLEdBQVksS0FBS0QsR0FBTCxDQUFTQyxJQUFyQjs7QUFFQSxTQUFLQyxLQUFMO0FBQ0EsU0FBS0MsS0FBTDtBQUNBLFNBQUtDLE1BQUw7QUFDQSxTQUFLQyxJQUFMO0FBQ0EsU0FBS0MsR0FBTDtBQUNBLFNBQUtDLE1BQUw7QUFDQSxTQUFLQyxHQUFMOztBQUVBLFNBQUtDLEtBQUw7QUFDRDs7Ozs0QkFFTztBQUFBOztBQUNOLFVBQUksQ0FBQyxLQUFLZCxHQUFWLEVBQWU7QUFDYixjQUFNZSxNQUFNLG1CQUFOLENBQU47QUFDQTtB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Ozs7Z0NBRVc7QUFDVixVQUFJZ0IsUUFBUSxLQUFLQSxLQUFqQjtBQUNBMkQsYUFBT0MsTUFBUCxDQUFjNUQsTUFBTStCLEtBQXBCLEVBQTJCO0FBQ3pCOEIsc0JBQWMsQ0FEVztBQUV6QkMsZ0NBQXNCckYsZ0JBQWdCTTtBQUZiLE9BQTNCOztBQUtBLFdBQUtRLFNBQUwsR0FBaUJkLGdCQUFnQlEsTUFBakM7QUFDRDs7OzJCQUVNO0FBQUE7O0FBQ0wsVUFBSXFCLE1BQU0sS0FBS0EsR0FBZjtBQUNBLFVBQUloQixRQUFRLEtBQUtBLEtBQWpCOztBQUVBZ0IsVUFBSWdELFNBQUosQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLEtBQUtyRCxLQUF6QixFQUFnQyxLQUFLQyxNQUFyQztBQUNBLFdBQUtWLGdCQUFMLENBQXNCdUUsR0FBdEI7O0FBRUEsV0FBS3ZFLGdCQUFMLENBQXNCd0UsR0FBdEIsQ0FBMEIsVUFBQ0MsS0FBRCxFQUFXO0FBQ25DQSxjQUFNRCxHQUFOLENBQVUsVUFBQ0UsSUFBRCxFQUFVO0FBQ2xCLGNBQUlBLEtBQUssQ0FBTCxNQUFZekYsZ0JBQWdCTyxHQUFoQyxFQUFxQztBQUNuQyxtQkFBS00sS0FBTCxHQUFhNEUsS0FBSyxDQUFMLENBQWI7QUFDQSxtQkFBS2YsVUFBTCxDQUFnQmdCLEtBQWhCLFNBQTRCRCxLQUFLRSxLQUFMLENBQVcsQ0FBWCxDQUE1QjtBQUNELFdBSEQsTUFHTyxJQUFJRixLQUFLLENBQUwsTUFBWXpGLGdCQUFnQlEsTUFBaEMsRUFBd0M7QUFDN0NxQixnQkFBSWdELFNBQUosQ0FBY2EsS0FBZCxDQUFvQjdELEdBQXBCLEVBQXlCNEQsS0FBS0UsS0FBTCxDQUFXLENBQVgsQ0FBekI7QUFDRDtBQUNGLFNBUEQ7QUFRRCxPQVREOztBQVdBLFdBQUs5RSxLQUFMLEdBQWFBLEtBQWI7QUFDRCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdwZW4nLFxyXG4gIFBFTl9CT1JERVJfQ09MT1I6ICdyZWQnLFxyXG4gIEVSQVNFUl9CT1JERVJfQ09MT1I6ICcjNjY2JyxcclxuICBQRU46ICdwZW4nLFxyXG4gIEVSQVNFUjogJ2VyYXNlcidcclxufVxyXG5cclxuY2xhc3MgUGhvdG9Db3ZlciB7XHJcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcclxuICAgIHRoaXMucmFkaXVzID0gREVGQVVMVF9PUFRJT05TLlJBRElVU1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IERFRkFVTFRfT1BUSU9OUy5NQVhfV0lEVEhcclxuICAgIHRoaXMuY29sb3IgPSBERUZBVUxUX09QVElPTlMuQ09MT1JcclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLk1PVVNFXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzID0gW11cclxuXHJcbiAgICB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXHJcblxyXG4gICAgdGhpcy53aW4gPSB3aW5kb3dcclxuICAgIHRoaXMuZG9jID0gZG9jdW1lbnRcclxuICAgIHRoaXMuYm9keSA9IHRoaXMuZG9jLmJvZHlcclxuXHJcbiAgICB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodFxyXG4gICAgdGhpcy5sZWZ0XHJcbiAgICB0aGlzLnRvcFxyXG4gICAgdGhpcy5jYW52YXNcclxuICAgIHRoaXMuY3R4XHJcblxyXG4gICAgdGhpcy5faW5pdCgpXHJcbiAgfVxyXG5cclxuICBfaW5pdCgpIHtcclxuICAgIGlmICghdGhpcy5pbWcpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ05vIEltYWdlIFNlbGVjdGVkJylcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IFtib2R5LCB3aW4sIGltZ10gPSBbdGhpcy5ib2R5LCB0aGlzLndpbiwgdGhpcy5pbWddXHJcblxyXG4gICAgLy8gaW5pdGlhbCBjYW52YXMgYW5kIGl0cyBzaXplIGFuZCBwb3NpdGlvblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKGUpID0+IHtcclxuICAgICAgdGhpcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgICB0aGlzLl9pbml0TW91c2UoKVxyXG5cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKChlKSA9PiB7XHJcbiAgICAgIHRoaXMuX2FzeW5jKClcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuXHJcbiAgICBsZXQgY3VycmVudE9wZXJhdGUgPSBbXVxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjYW52YXMgZG93blxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKChlKSA9PiB7XHJcbiAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZSlcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNPbkNhbnZhcyh4LCB5KSkge1xyXG4gICAgICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5wdXNoKGN1cnJlbnRPcGVyYXRlKVxyXG4gICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgfVxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcbiAgfVxyXG5cclxuICAvLyBhc3luYyB4IGFuZCB5IGZyb20gaW1hZ2UgdG8gY2FudmFzXHJcbiAgX2FzeW5jKCkge1xyXG4gICAgbGV0IGNvb3JkaW5hdGUgPSB0aGlzLmltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgdGhpcy50b3AgPSBjb29yZGluYXRlLnRvcFxyXG4gICAgdGhpcy5sZWZ0ID0gY29vcmRpbmF0ZS5sZWZ0XHJcblxyXG4gICAgdGhpcy5jYW52YXMuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAke3RoaXMubGVmdCArIHRoaXMuYm9keS5zY3JvbGxMZWZ0fXB4O1xyXG4gICAgICB0b3A6ICR7dGhpcy50b3AgKyB0aGlzLmJvZHkuc2Nyb2xsVG9wfXB4O1xyXG4gICAgICB1c2Utc2VsZWN0OiBub25lO1xyXG4gICAgYFxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBfaW5pdE1vdXNlKHR5cGUpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB3aWR0aDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGhlaWdodDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcclxuICAgICAgYm9yZGVyLXJhZGl1czogMTAwJTtcclxuICAgIGBcclxuICAgIHRoaXMubW91c2UgPSBtb3VzZVxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQobW91c2UpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKChlKSA9PiB7XHJcbiAgICAgIGxldCBbeCwgeV0gPSBbZS5wYWdlWCwgZS5wYWdlWV1cclxuICAgICAgbGV0IGlzT25DYW52YXMgPSB0aGlzLmlzT25DYW52YXMoeCwgeSlcclxuXHJcbiAgICAgIG1vdXNlLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4IC0gdGhpcy5yYWRpdXN9cHgsICR7eSAtIHRoaXMucmFkaXVzfXB4KWBcclxuXHJcbiAgICAgIGlmICghaXNPbkNhbnZhcykge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSdcclxuICAgICAgfVxyXG5cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICB9XHJcblxyXG4gIHNldFJhZGl1cyhyYWRpdXMpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgIG1vdXNlLnN0eWxlLmhlaWdodCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgfVxyXG5cclxuICB6b29tSW4ocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgZHJhd0NpcmNsZSh4LCB5LCByYWRpdXMpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCByYWRpdXMgfHwgdGhpcy5yYWRpdXMsIDAsIDM2MClcclxuICAgIGN0eC5maWxsKClcclxuICAgIGN0eC5jbG9zZVBhdGgoKVxyXG4gIH1cclxuXHJcblxyXG4gIGdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBsZXQgeCwgeVxyXG4gICAgbGV0IFtkb2MsIGJvZHldID0gW3RoaXMuZG9jLCB0aGlzLmJvZHldXHJcbiAgICBsZXQgY2FudmFzID0gdGhpcy5jYW52YXNcclxuXHJcblxyXG4gICAgaWYgKGV2ZW50LnBhZ2VYIHx8IGV2ZW50LnBhZ2VZKSB7XHJcbiAgICAgIHggPSBldmVudC5wYWdlWFxyXG4gICAgICB5ID0gZXZlbnQucGFnZVlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHggPSBlLmNsaWVudFggKyBib2R5LnNjcm9sbExlZnQgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnRcclxuICAgICAgeSA9IGUuY2xpZW50WSArIGJvZHkuc2Nyb2xsVG9wICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcclxuICAgIH1cclxuXHJcbiAgICB4IC09IGNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICB5IC09IGNhbnZhcy5vZmZzZXRUb3BcclxuXHJcbiAgICByZXR1cm4gW3gsIHldXHJcbiAgfVxyXG5cclxuICBkcmF3QnlFdmVudChldmVudCkge1xyXG4gICAgaWYgKCF0aGlzLmN0eCkgcmV0dXJuXHJcblxyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgW3gsIHldPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KVxyXG5cclxuICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLmRyYXdDaXJjbGUoeCwgeSlcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuUEVOLCB0aGlzLmNvbG9yLCB4LCB5LCB0aGlzLnJhZGl1c11cclxuICAgIH0gZWxzZSBpZiAodGhpcy5tb3VzZVR5cGUgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgeCAtPSB0aGlzLnJhZGl1c1xyXG4gICAgICB5IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIGxldCBbdywgaF0gPSBbdGhpcy5yYWRpdXMgKiAyLCB0aGlzLnJhZGl1cyAqIDJdXHJcbiAgICAgIGN0eC5jbGVhclJlY3QoeCwgeSwgdywgaClcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuRVJBU0VSLCB4LCB5LCB3LCBoXVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaXNPbkNhbnZhcyh4LCB5KSB7XHJcblxyXG4gICAgaWYgKHggPCB0aGlzLmxlZnQgfHwgeCA+ICh0aGlzLmxlZnQgKyB0aGlzLndpZHRoKSB8fCB5IDwgdGhpcy50b3AgfHwgeSA+ICh0aGlzLnRvcCArIHRoaXMuaGVpZ2h0KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRNYXhXaWR0aCh3aWR0aCkge1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IHdpZHRoXHJcbiAgfVxyXG5cclxuICBzZXRDb2xvcihjb2xvcikge1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAvLyBwZW4sIGVyYXNlclxyXG4gIHNldFRvb2wodG9vbCkge1xyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSB0b29sXHJcblxyXG4gICAgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLnNldFBlbigpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB0aGlzLnNldEVyYXNlcigpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgc2V0UGVuKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcclxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7REVGQVVMVF9PUFRJT05TLlBFTl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5QRU5cclxuICB9XHJcblxyXG4gIHNldEVyYXNlcigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAwLFxyXG4gICAgICBib3JkZXI6IGAxcHggZGFzaGVkICR7REVGQVVMVF9PUFRJT05TLkVSQVNFUl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5FUkFTRVJcclxuICB9XHJcblxyXG4gIHVuZG8oKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBjb2xvciA9IHRoaXMuY29sb3JcclxuXHJcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KVxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnBvcCgpXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLm1hcCgoc3RlcHMpID0+IHtcclxuICAgICAgc3RlcHMubWFwKChzdGVwKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgICAgIHRoaXMuY29sb3IgPSBzdGVwWzFdXHJcbiAgICAgICAgICB0aGlzLmRyYXdDaXJjbGUuYXBwbHkodGhpcywgc3RlcC5zbGljZSgyKSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgICAgIGN0eC5jbGVhclJlY3QuYXBwbHkoY3R4LCBzdGVwLnNsaWNlKDEpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxufVxyXG4iXX0=
