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

    // selector
    if (typeof selector === 'string') {
      this.img = document.querySelector(selector);

      // image element
    } else {
      this.img = selector;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiY3JlYXRlRWxlbWVudCIsImdldENvbnRleHQiLCJfYXN5bmMiLCJhcHBlbmRDaGlsZCIsIl9pbml0TW91c2UiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsImJpbmQiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlTW92ZSIsInByZXZlbnREZWZhdWx0IiwicHVzaCIsImRyYXdCeUV2ZW50IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImNvb3JkaW5hdGUiLCJnZXRDb29yZGluYXRlQnlFdmVudCIsInBhZ2VYIiwicGFnZVkiLCJ4IiwieSIsImlzT25DYW52YXMiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJzdHlsZSIsImNzc1RleHQiLCJzY3JvbGxMZWZ0Iiwic2Nyb2xsVG9wIiwidHlwZSIsInRyYW5zZm9ybSIsImRpc3BsYXkiLCJjdXJzb3IiLCJzZXRSYWRpdXMiLCJmaWxsU3R5bGUiLCJiZWdpblBhdGgiLCJhcmMiLCJmaWxsIiwiY2xvc2VQYXRoIiwiZXZlbnQiLCJjbGllbnRYIiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50WSIsIm9mZnNldExlZnQiLCJvZmZzZXRUb3AiLCJkcmF3Q2lyY2xlIiwidyIsImgiLCJjbGVhclJlY3QiLCJ0b29sIiwidG9Mb3dlckNhc2UiLCJzZXRQZW4iLCJzZXRFcmFzZXIiLCJPYmplY3QiLCJhc3NpZ24iLCJib3JkZXJSYWRpdXMiLCJib3JkZXIiLCJwb3AiLCJtYXAiLCJzdGVwcyIsInN0ZXAiLCJhcHBseSIsInNsaWNlIiwidGVtcENhbnZhcyIsInRlbXBDdHgiLCJkcmF3SW1hZ2UiLCJ0b0RhdGFVUkwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsa0JBQWtCO0FBQ3RCQyxVQUFRLEVBRGM7QUFFdEJDLGFBQVcsR0FGVztBQUd0QkMsU0FBTyxPQUhlO0FBSXRCQyxTQUFPLEtBSmU7QUFLdEJDLG9CQUFrQixLQUxJO0FBTXRCQyx1QkFBcUIsTUFOQztBQU90QkMsT0FBSyxLQVBpQjtBQVF0QkMsVUFBUTtBQVJjLENBQXhCOztJQVdNQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFjWCxnQkFBZ0JDLE1BQTlCO0FBQ0EsU0FBS1csUUFBTCxHQUFnQlosZ0JBQWdCRSxTQUFoQztBQUNBLFNBQUtXLEtBQUwsR0FBYWIsZ0JBQWdCRyxLQUE3QjtBQUNBLFNBQUtXLFNBQUwsR0FBaUJkLGdCQUFnQkksS0FBakM7O0FBRUEsU0FBS1csZ0JBQUwsR0FBd0IsRUFBeEI7O0FBRUE7QUFDQSxRQUFJLE9BQU9MLFFBQVAsS0FBb0IsUUFBeEIsRUFBa0M7QUFDaEMsV0FBS00sR0FBTCxHQUFXQyxTQUFTQyxhQUFULENBQXVCUixRQUF2QixDQUFYOztBQUVGO0FBQ0MsS0FKRCxNQUlPO0FBQ0wsV0FBS00sR0FBTCxHQUFXTixRQUFYO0FBQ0Q7O0FBRUQsU0FBS1MsR0FBTCxHQUFXQyxNQUFYO0FBQ0EsU0FBS0MsR0FBTCxHQUFXSixRQUFYO0FBQ0EsU0FBS0ssSUFBTCxHQUFZLEtBQUtELEdBQUwsQ0FBU0MsSUFBckI7O0FBRUEsU0FBS0MsS0FBTDtBQUNBLFNBQUtDLEtBQUw7QUFDQSxTQUFLQyxNQUFMO0FBQ0EsU0FBS0MsSUFBTDtBQUNB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QjtBQUNBNEQsaUJBQVdwRSxLQUFYLEdBQW1CLEtBQUtBLEtBQXhCO0FBQ0FvRSxpQkFBV25FLE1BQVgsR0FBb0IsS0FBS0EsTUFBekI7QUFDQSxVQUFJb0UsVUFBVUQsV0FBVzNELFVBQVgsQ0FBc0IsSUFBdEIsQ0FBZDtBQUNBNEQsY0FBUUMsU0FBUixDQUFrQixLQUFLOUUsR0FBdkIsRUFBNEIsQ0FBNUIsRUFBK0IsQ0FBL0IsRUFBa0MsS0FBS1EsS0FBdkMsRUFBOEMsS0FBS0MsTUFBbkQ7QUFDQW9FLGNBQVFDLFNBQVIsQ0FBa0IsS0FBS2xFLE1BQXZCLEVBQStCLENBQS9CLEVBQWtDLENBQWxDLEVBQXFDLEtBQUtKLEtBQTFDLEVBQWlELEtBQUtDLE1BQXREOztBQUVBLGFBQU9tRSxXQUFXRyxTQUFYLEVBQVA7QUFDSCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdwZW4nLFxyXG4gIFBFTl9CT1JERVJfQ09MT1I6ICdyZWQnLFxyXG4gIEVSQVNFUl9CT1JERVJfQ09MT1I6ICcjNjY2JyxcclxuICBQRU46ICdwZW4nLFxyXG4gIEVSQVNFUjogJ2VyYXNlcidcclxufVxyXG5cclxuY2xhc3MgUGhvdG9Db3ZlciB7XHJcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcclxuICAgIHRoaXMucmFkaXVzID0gREVGQVVMVF9PUFRJT05TLlJBRElVU1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IERFRkFVTFRfT1BUSU9OUy5NQVhfV0lEVEhcclxuICAgIHRoaXMuY29sb3IgPSBERUZBVUxUX09QVElPTlMuQ09MT1JcclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLk1PVVNFXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzID0gW11cclxuXHJcbiAgICAvLyBzZWxlY3RvclxyXG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgdGhpcy5pbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxyXG5cclxuICAgIC8vIGltYWdlIGVsZW1lbnRcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuaW1nID0gc2VsZWN0b3JcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLndpbiA9IHdpbmRvd1xyXG4gICAgdGhpcy5kb2MgPSBkb2N1bWVudFxyXG4gICAgdGhpcy5ib2R5ID0gdGhpcy5kb2MuYm9keVxyXG5cclxuICAgIHRoaXMubW91c2VcclxuICAgIHRoaXMud2lkdGhcclxuICAgIHRoaXMuaGVpZ2h0XHJcbiAgICB0aGlzLmxlZnRcclxuICAgIHRoaXMudG9wXHJcbiAgICB0aGlzLmNhbnZhc1xyXG4gICAgdGhpcy5jdHhcclxuXHJcbiAgICB0aGlzLl9pbml0KClcclxuICB9XHJcblxyXG4gIF9pbml0KCkge1xyXG4gICAgaWYgKCF0aGlzLmltZykge1xyXG4gICAgICB0aHJvdyBFcnJvcignTm8gSW1hZ2UgU2VsZWN0ZWQnKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbiwgaW1nXSA9IFt0aGlzLmJvZHksIHRoaXMud2luLCB0aGlzLmltZ11cclxuXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodFxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgdGhpcy5faW5pdE1vdXNlKClcclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKChlKSA9PiB7XHJcbiAgICAgIHRoaXMuX2FzeW5jKClcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuXHJcbiAgICBsZXQgY3VycmVudE9wZXJhdGUgPSBbXVxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjYW52YXMgZG93blxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgoZSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG4gICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKChlKSA9PiB7XHJcbiAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgICBsZXQgY29vcmRpbmF0ZSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZSlcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNPbkNhbnZhcyh4LCB5KSkge1xyXG4gICAgICAgIHRoaXMub3BlcmF0ZUhpc3Rvcmllcy5wdXNoKGN1cnJlbnRPcGVyYXRlKVxyXG4gICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgfVxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcbiAgfVxyXG5cclxuICAvLyBhc3luYyB4IGFuZCB5IGZyb20gaW1hZ2UgdG8gY2FudmFzXHJcbiAgX2FzeW5jKCkge1xyXG4gICAgbGV0IGNvb3JkaW5hdGUgPSB0aGlzLmltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgdGhpcy50b3AgPSBjb29yZGluYXRlLnRvcFxyXG4gICAgdGhpcy5sZWZ0ID0gY29vcmRpbmF0ZS5sZWZ0XHJcblxyXG4gICAgdGhpcy5jYW52YXMuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAke3RoaXMubGVmdCArIHRoaXMuYm9keS5zY3JvbGxMZWZ0fXB4O1xyXG4gICAgICB0b3A6ICR7dGhpcy50b3AgKyB0aGlzLmJvZHkuc2Nyb2xsVG9wfXB4O1xyXG4gICAgICB1c2Utc2VsZWN0OiBub25lO1xyXG4gICAgYFxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBfaW5pdE1vdXNlKHR5cGUpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB3aWR0aDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGhlaWdodDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcclxuICAgICAgYm9yZGVyLXJhZGl1czogMTAwJTtcclxuICAgIGBcclxuICAgIHRoaXMubW91c2UgPSBtb3VzZVxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQobW91c2UpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKChlKSA9PiB7XHJcbiAgICAgIGxldCBbeCwgeV0gPSBbZS5wYWdlWCwgZS5wYWdlWV1cclxuICAgICAgbGV0IGlzT25DYW52YXMgPSB0aGlzLmlzT25DYW52YXMoeCwgeSlcclxuXHJcbiAgICAgIG1vdXNlLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4IC0gdGhpcy5yYWRpdXN9cHgsICR7eSAtIHRoaXMucmFkaXVzfXB4KWBcclxuXHJcbiAgICAgIGlmICghaXNPbkNhbnZhcykge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSdcclxuICAgICAgfVxyXG5cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICB9XHJcblxyXG4gIHNldFJhZGl1cyhyYWRpdXMpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgIG1vdXNlLnN0eWxlLmhlaWdodCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgfVxyXG5cclxuICB6b29tSW4ocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgZHJhd0NpcmNsZSh4LCB5LCByYWRpdXMpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3I7XHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCByYWRpdXMgfHwgdGhpcy5yYWRpdXMsIDAsIDM2MClcclxuICAgIGN0eC5maWxsKClcclxuICAgIGN0eC5jbG9zZVBhdGgoKVxyXG4gIH1cclxuXHJcblxyXG4gIGdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBsZXQgeCwgeVxyXG4gICAgbGV0IFtkb2MsIGJvZHldID0gW3RoaXMuZG9jLCB0aGlzLmJvZHldXHJcbiAgICBsZXQgY2FudmFzID0gdGhpcy5jYW52YXNcclxuXHJcblxyXG4gICAgaWYgKGV2ZW50LnBhZ2VYIHx8IGV2ZW50LnBhZ2VZKSB7XHJcbiAgICAgIHggPSBldmVudC5wYWdlWFxyXG4gICAgICB5ID0gZXZlbnQucGFnZVlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHggPSBlLmNsaWVudFggKyBib2R5LnNjcm9sbExlZnQgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnRcclxuICAgICAgeSA9IGUuY2xpZW50WSArIGJvZHkuc2Nyb2xsVG9wICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcclxuICAgIH1cclxuXHJcbiAgICB4IC09IGNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICB5IC09IGNhbnZhcy5vZmZzZXRUb3BcclxuXHJcbiAgICByZXR1cm4gW3gsIHldXHJcbiAgfVxyXG5cclxuICBkcmF3QnlFdmVudChldmVudCkge1xyXG4gICAgaWYgKCF0aGlzLmN0eCkgcmV0dXJuXHJcblxyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgW3gsIHldPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KVxyXG5cclxuICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLmRyYXdDaXJjbGUoeCwgeSlcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuUEVOLCB0aGlzLmNvbG9yLCB4LCB5LCB0aGlzLnJhZGl1c11cclxuICAgIH0gZWxzZSBpZiAodGhpcy5tb3VzZVR5cGUgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgeCAtPSB0aGlzLnJhZGl1c1xyXG4gICAgICB5IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIGxldCBbdywgaF0gPSBbdGhpcy5yYWRpdXMgKiAyLCB0aGlzLnJhZGl1cyAqIDJdXHJcbiAgICAgIGN0eC5jbGVhclJlY3QoeCwgeSwgdywgaClcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuRVJBU0VSLCB4LCB5LCB3LCBoXVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaXNPbkNhbnZhcyh4LCB5KSB7XHJcblxyXG4gICAgaWYgKHggPCB0aGlzLmxlZnQgfHwgeCA+ICh0aGlzLmxlZnQgKyB0aGlzLndpZHRoKSB8fCB5IDwgdGhpcy50b3AgfHwgeSA+ICh0aGlzLnRvcCArIHRoaXMuaGVpZ2h0KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRNYXhXaWR0aCh3aWR0aCkge1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IHdpZHRoXHJcbiAgfVxyXG5cclxuICBzZXRDb2xvcihjb2xvcikge1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAvLyBwZW4sIGVyYXNlclxyXG4gIHNldFRvb2wodG9vbCkge1xyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSB0b29sXHJcblxyXG4gICAgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLnNldFBlbigpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB0aGlzLnNldEVyYXNlcigpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgc2V0UGVuKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcclxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7REVGQVVMVF9PUFRJT05TLlBFTl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5QRU5cclxuICB9XHJcblxyXG4gIHNldEVyYXNlcigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAwLFxyXG4gICAgICBib3JkZXI6IGAxcHggZGFzaGVkICR7REVGQVVMVF9PUFRJT05TLkVSQVNFUl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5FUkFTRVJcclxuICB9XHJcblxyXG4gIHVuZG8oKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBjb2xvciA9IHRoaXMuY29sb3JcclxuXHJcbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KVxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLnBvcCgpXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzLm1hcCgoc3RlcHMpID0+IHtcclxuICAgICAgc3RlcHMubWFwKChzdGVwKSA9PiB7XHJcbiAgICAgICAgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5QRU4pIHtcclxuICAgICAgICAgIHRoaXMuY29sb3IgPSBzdGVwWzFdXHJcbiAgICAgICAgICB0aGlzLmRyYXdDaXJjbGUuYXBwbHkodGhpcywgc3RlcC5zbGljZSgyKSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgICAgIGN0eC5jbGVhclJlY3QuYXBwbHkoY3R4LCBzdGVwLnNsaWNlKDEpKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAgIGdldERhdGFVUkwoKSB7XHJcbiAgICAgIGxldCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgdGVtcENhbnZhcy53aWR0aCA9IHRoaXMud2lkdGhcclxuICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodFxyXG4gICAgICBsZXQgdGVtcEN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgICB0ZW1wQ3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXHJcbiAgICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodClcclxuXHJcbiAgICAgIHJldHVybiB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgpXHJcbiAgfVxyXG5cclxufVxyXG4iXX0=
