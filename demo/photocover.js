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
        return [DEFAULT_OPTIONS.PEN, x, y, this.radius];
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
      ctx.clearRect(0, 0, this.width, this.height);
      this.operateHistories.pop();

      this.operateHistories.map(function (steps) {
        steps.map(function (step) {
          if (step[0] === DEFAULT_OPTIONS.PEN) {
            _this3.drawCircle.apply(_this3, step.slice(1));
          } else if (step[0] === DEFAULT_OPTIONS.ERASER) {
            ctx.clearRect.apply(null, step.slice(1));
          }
        });
      });

      console.log(this.operateHistories);
    }
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBFTl9CT1JERVJfQ09MT1IiLCJFUkFTRVJfQk9SREVSX0NPTE9SIiwiUEVOIiwiRVJBU0VSIiwiUGhvdG9Db3ZlciIsInNlbGVjdG9yIiwicmFkaXVzIiwibWF4V2lkdGgiLCJjb2xvciIsIm1vdXNlVHlwZSIsIm9wZXJhdGVIaXN0b3JpZXMiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJjcmVhdGVFbGVtZW50IiwiZ2V0Q29udGV4dCIsIl9hc3luYyIsImFwcGVuZENoaWxkIiwiX2luaXRNb3VzZSIsImJpbmQiLCJjdXJyZW50T3BlcmF0ZSIsImNhbnZhc01vdXNlTW92ZSIsInB1c2giLCJkcmF3QnlFdmVudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjb29yZGluYXRlIiwiZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwieCIsInkiLCJpc09uQ2FudmFzIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwic3R5bGUiLCJjc3NUZXh0Iiwic2Nyb2xsTGVmdCIsInNjcm9sbFRvcCIsInR5cGUiLCJ0cmFuc2Zvcm0iLCJkaXNwbGF5IiwiY3Vyc29yIiwic2V0UmFkaXVzIiwiYmVnaW5QYXRoIiwiYXJjIiwiZmlsbCIsImNsb3NlUGF0aCIsImV2ZW50IiwiY2xpZW50WCIsImRvY3VtZW50RWxlbWVudCIsImNsaWVudFkiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0VG9wIiwiZHJhd0NpcmNsZSIsInciLCJoIiwiY2xlYXJSZWN0IiwidG9vbCIsInRvTG93ZXJDYXNlIiwic2V0UGVuIiwic2V0RXJhc2VyIiwiT2JqZWN0IiwiYXNzaWduIiwiYm9yZGVyUmFkaXVzIiwiYm9yZGVyIiwicG9wIiwibWFwIiwic3RlcHMiLCJzdGVwIiwiYXBwbHkiLCJzbGljZSIsImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsa0JBQWtCO0FBQ3RCQyxVQUFRLEVBRGM7QUFFdEJDLGFBQVcsR0FGVztBQUd0QkMsU0FBTyxPQUhlO0FBSXRCQyxTQUFPLEtBSmU7QUFLdEJDLG9CQUFrQixLQUxJO0FBTXRCQyx1QkFBcUIsTUFOQztBQU90QkMsT0FBSyxLQVBpQjtBQVF0QkMsVUFBUTtBQVJjLENBQXhCOztJQVdNQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFjWCxnQkFBZ0JDLE1BQTlCO0FBQ0EsU0FBS1csUUFBTCxHQUFnQlosZ0JBQWdCRSxTQUFoQztBQUNBLFNBQUtXLEtBQUwsR0FBYWIsZ0JBQWdCRyxLQUE3QjtBQUNBLFNBQUtXLFNBQUwsR0FBaUJkLGdCQUFnQkksS0FBakM7O0FBRUEsU0FBS1csZ0JBQUwsR0FBd0IsRUFBeEI7O0FBRUEsU0FBS0MsR0FBTCxHQUFXQyxTQUFTQyxhQUFULENBQXVCUixRQUF2QixDQUFYOztBQUVBLFNBQUtTLEdBQUwsR0FBV0MsTUFBWDtBQUNBLFNBQUtDLEdBQUwsR0FBV0osUUFBWDtBQUNBLFNBQUtLLElBQUwsR0FBWSxLQUFLRCxHQUFMLENBQVNDLElBQXJCOztBQUVBLFNBQUtDLEtBQUw7QUFDQSxTQUFLQyxLQUFMO0FBQ0EsU0FBS0MsTUFBTDtBQUNBLFNBQUtDLElBQUw7QUFDQSxTQUFLQyxHQUFMO0FBQ0EsU0FBS0MsTUFBTDtBQUNBLFNBQUtDLEdBQUw7O0FBRUEsU0FBS0MsS0FBTDtBQUNEOzs7OzRCQUVPO0FBQUE7O0FBQ04sVUFBSSxDQUFDLEtBQUtkLEdBQVYsRUFBZTtBQUNiLGNBQU1lLE1BQU0sbUJBQU4sQ0FBTjtBQUNBO0FBQ0Q7O0FBSkssaUJB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ekJDLGdDQUFzQm5GLGdCQUFnQk07QUFGYixPQUEzQjs7QUFLQSxXQUFLUSxTQUFMLEdBQWlCZCxnQkFBZ0JRLE1BQWpDO0FBQ0Q7OzsyQkFFTTtBQUFBOztBQUNMLFVBQUlxQixNQUFNLEtBQUtBLEdBQWY7QUFDQUEsVUFBSThDLFNBQUosQ0FBYyxDQUFkLEVBQWlCLENBQWpCLEVBQW9CLEtBQUtuRCxLQUF6QixFQUFnQyxLQUFLQyxNQUFyQztBQUNBLFdBQUtWLGdCQUFMLENBQXNCcUUsR0FBdEI7O0FBRUEsV0FBS3JFLGdCQUFMLENBQXNCc0UsR0FBdEIsQ0FBMEIsVUFBQ0MsS0FBRCxFQUFXO0FBQ25DQSxjQUFNRCxHQUFOLENBQVUsVUFBQ0UsSUFBRCxFQUFVO0FBQ2xCLGNBQUlBLEtBQUssQ0FBTCxNQUFZdkYsZ0JBQWdCTyxHQUFoQyxFQUFxQztBQUNuQyxtQkFBS2lFLFVBQUwsQ0FBZ0JnQixLQUFoQixTQUE0QkQsS0FBS0UsS0FBTCxDQUFXLENBQVgsQ0FBNUI7QUFDRCxXQUZELE1BRU8sSUFBSUYsS0FBSyxDQUFMLE1BQVl2RixnQkFBZ0JRLE1BQWhDLEVBQXdDO0FBQzdDcUIsZ0JBQUk4QyxTQUFKLENBQWNhLEtBQWQsQ0FBb0IsSUFBcEIsRUFBMEJELEtBQUtFLEtBQUwsQ0FBVyxDQUFYLENBQTFCO0FBQ0Q7QUFDRixTQU5EO0FBT0QsT0FSRDs7QUFXQUMsY0FBUUMsR0FBUixDQUFZLEtBQUs1RSxnQkFBakI7QUFFRCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdwZW4nLFxyXG4gIFBFTl9CT1JERVJfQ09MT1I6ICdyZWQnLFxyXG4gIEVSQVNFUl9CT1JERVJfQ09MT1I6ICcjNjY2JyxcclxuICBQRU46ICdwZW4nLFxyXG4gIEVSQVNFUjogJ2VyYXNlcidcclxufVxyXG5cclxuY2xhc3MgUGhvdG9Db3ZlciB7XHJcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3IpIHtcclxuICAgIHRoaXMucmFkaXVzID0gREVGQVVMVF9PUFRJT05TLlJBRElVU1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IERFRkFVTFRfT1BUSU9OUy5NQVhfV0lEVEhcclxuICAgIHRoaXMuY29sb3IgPSBERUZBVUxUX09QVElPTlMuQ09MT1JcclxuICAgIHRoaXMubW91c2VUeXBlID0gREVGQVVMVF9PUFRJT05TLk1PVVNFXHJcblxyXG4gICAgdGhpcy5vcGVyYXRlSGlzdG9yaWVzID0gW11cclxuXHJcbiAgICB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXHJcblxyXG4gICAgdGhpcy53aW4gPSB3aW5kb3dcclxuICAgIHRoaXMuZG9jID0gZG9jdW1lbnRcclxuICAgIHRoaXMuYm9keSA9IHRoaXMuZG9jLmJvZHlcclxuXHJcbiAgICB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodFxyXG4gICAgdGhpcy5sZWZ0XHJcbiAgICB0aGlzLnRvcFxyXG4gICAgdGhpcy5jYW52YXNcclxuICAgIHRoaXMuY3R4XHJcblxyXG4gICAgdGhpcy5faW5pdCgpXHJcbiAgfVxyXG5cclxuICBfaW5pdCgpIHtcclxuICAgIGlmICghdGhpcy5pbWcpIHtcclxuICAgICAgdGhyb3cgRXJyb3IoJ05vIEltYWdlIFNlbGVjdGVkJylcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IFtib2R5LCB3aW4sIGltZ10gPSBbdGhpcy5ib2R5LCB0aGlzLndpbiwgdGhpcy5pbWddXHJcblxyXG4gICAgLy8gaW5pdGlhbCBjYW52YXMgYW5kIGl0cyBzaXplIGFuZCBwb3NpdGlvblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKGUpID0+IHtcclxuICAgICAgdGhpcy53aWR0aCA9IGltZy53aWR0aFxyXG4gICAgICB0aGlzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAgIHRoaXMuX2FzeW5jKClcclxuXHJcbiAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gaW1nLndpZHRoXHJcbiAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgICB0aGlzLl9pbml0TW91c2UoKVxyXG5cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKChlKSA9PiB7XHJcbiAgICAgIHRoaXMuX2FzeW5jKClcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuXHJcbiAgICBsZXQgY3VycmVudE9wZXJhdGUgPSBbXVxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZU1vdmUgPSAoKGUpID0+IHtcclxuICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIC8vIGNhbnZhcyBkb3duXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKChlKSA9PiB7XHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG5cclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgoZSkgPT4ge1xyXG4gICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgbGV0IGNvb3JkaW5hdGUgPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGUpXHJcbiAgICAgIGxldCBbeCwgeV0gPSBbZS5wYWdlWCwgZS5wYWdlWV1cclxuXHJcbiAgICAgIGlmICh0aGlzLmlzT25DYW52YXMoeCwgeSkpIHtcclxuICAgICAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucHVzaChjdXJyZW50T3BlcmF0ZSlcclxuICAgICAgICBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgeCBhbmQgeSBmcm9tIGltYWdlIHRvIGNhbnZhc1xyXG4gIF9hc3luYygpIHtcclxuICAgIGxldCBjb29yZGluYXRlID0gdGhpcy5pbWcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcclxuICAgIHRoaXMudG9wID0gY29vcmRpbmF0ZS50b3BcclxuICAgIHRoaXMubGVmdCA9IGNvb3JkaW5hdGUubGVmdFxyXG5cclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogJHt0aGlzLmxlZnQgKyB0aGlzLmJvZHkuc2Nyb2xsTGVmdH1weDtcclxuICAgICAgdG9wOiAke3RoaXMudG9wICsgdGhpcy5ib2R5LnNjcm9sbFRvcH1weDtcclxuICAgICAgdXNlLXNlbGVjdDogbm9uZTtcclxuICAgIGBcclxuICB9XHJcblxyXG4gIC8vIGluaXRpYWwgbW91c2Ugc2hhcGUgd2hlcmUgbW91c2Ugb24gY2FudmFzXHJcbiAgX2luaXRNb3VzZSh0eXBlKSB7XHJcbiAgICBsZXQgW2JvZHksIHdpbl0gPSBbdGhpcy5ib2R5LCB0aGlzLndpbl1cclxuICAgIGxldCBtb3VzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICBtb3VzZS5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBkaXNwbGF5OiBub25lO1xyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6IDA7XHJcbiAgICAgIHRvcDogMDtcclxuICAgICAgd2lkdGg6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBoZWlnaHQ6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XHJcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XHJcbiAgICBgXHJcbiAgICB0aGlzLm1vdXNlID0gbW91c2VcclxuXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKG1vdXNlKVxyXG5cclxuICAgIC8vIGNoYW5nZSBtb3VzZSBzdHlsZVxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgoZSkgPT4ge1xyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcbiAgICAgIGxldCBpc09uQ2FudmFzID0gdGhpcy5pc09uQ2FudmFzKHgsIHkpXHJcblxyXG4gICAgICBtb3VzZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eCAtIHRoaXMucmFkaXVzfXB4LCAke3kgLSB0aGlzLnJhZGl1c31weClgXHJcblxyXG4gICAgICBpZiAoIWlzT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ25vbmUnXHJcbiAgICAgIH1cclxuXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcbiAgfVxyXG5cclxuICBzZXRSYWRpdXMocmFkaXVzKSB7XHJcbiAgICBpZiAocmFkaXVzIDwgMiB8fCByYWRpdXMgPiAxMDApIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXNcclxuXHJcbiAgICBtb3VzZS5zdHlsZS53aWR0aCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgICBtb3VzZS5zdHlsZS5oZWlnaHQgPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gIH1cclxuXHJcbiAgem9vbUluKHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzICsgcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgem9vbU91dChyYWRpdXMgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyAtIHJhZGl1cylcclxuICB9XHJcblxyXG4gIGRyYXdDaXJjbGUoeCwgeSwgcmFkaXVzKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCByYWRpdXMgfHwgdGhpcy5yYWRpdXMsIDAsIDM2MClcclxuICAgIGN0eC5maWxsKClcclxuICAgIGN0eC5jbG9zZVBhdGgoKVxyXG4gIH1cclxuXHJcblxyXG4gIGdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KSB7XHJcbiAgICBsZXQgeCwgeVxyXG4gICAgbGV0IFtkb2MsIGJvZHldID0gW3RoaXMuZG9jLCB0aGlzLmJvZHldXHJcbiAgICBsZXQgY2FudmFzID0gdGhpcy5jYW52YXNcclxuXHJcblxyXG4gICAgaWYgKGV2ZW50LnBhZ2VYIHx8IGV2ZW50LnBhZ2VZKSB7XHJcbiAgICAgIHggPSBldmVudC5wYWdlWFxyXG4gICAgICB5ID0gZXZlbnQucGFnZVlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHggPSBlLmNsaWVudFggKyBib2R5LnNjcm9sbExlZnQgKyBkb2MuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnRcclxuICAgICAgeSA9IGUuY2xpZW50WSArIGJvZHkuc2Nyb2xsVG9wICsgZG9jLmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3BcclxuICAgIH1cclxuXHJcbiAgICB4IC09IGNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICB5IC09IGNhbnZhcy5vZmZzZXRUb3BcclxuXHJcbiAgICByZXR1cm4gW3gsIHldXHJcbiAgfVxyXG5cclxuICBkcmF3QnlFdmVudChldmVudCkge1xyXG4gICAgaWYgKCF0aGlzLmN0eCkgcmV0dXJuXHJcblxyXG4gICAgbGV0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBsZXQgW3gsIHldPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50KVxyXG5cclxuICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLmRyYXdDaXJjbGUoeCwgeSlcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuUEVOLCB4LCB5LCB0aGlzLnJhZGl1c11cclxuICAgIH0gZWxzZSBpZiAodGhpcy5tb3VzZVR5cGUgPT09IERFRkFVTFRfT1BUSU9OUy5FUkFTRVIpIHtcclxuICAgICAgeCAtPSB0aGlzLnJhZGl1c1xyXG4gICAgICB5IC09IHRoaXMucmFkaXVzXHJcbiAgICAgIGxldCBbdywgaF0gPSBbdGhpcy5yYWRpdXMgKiAyLCB0aGlzLnJhZGl1cyAqIDJdXHJcbiAgICAgIGN0eC5jbGVhclJlY3QoeCwgeSwgdywgaClcclxuICAgICAgcmV0dXJuIFtERUZBVUxUX09QVElPTlMuRVJBU0VSLCB4LCB5LCB3LCBoXVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaXNPbkNhbnZhcyh4LCB5KSB7XHJcblxyXG4gICAgaWYgKHggPCB0aGlzLmxlZnQgfHwgeCA+ICh0aGlzLmxlZnQgKyB0aGlzLndpZHRoKSB8fCB5IDwgdGhpcy50b3AgfHwgeSA+ICh0aGlzLnRvcCArIHRoaXMuaGVpZ2h0KSkge1xyXG4gICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0cnVlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRNYXhXaWR0aCh3aWR0aCkge1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IHdpZHRoXHJcbiAgfVxyXG5cclxuICBzZXRDb2xvcihjb2xvcikge1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAvLyBwZW4sIGVyYXNlclxyXG4gIHNldFRvb2wodG9vbCkge1xyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSB0b29sXHJcblxyXG4gICAgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICB0aGlzLnNldFBlbigpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wudG9Mb3dlckNhc2UoKSA9PT0gREVGQVVMVF9PUFRJT05TLkVSQVNFUikge1xyXG4gICAgICB0aGlzLnNldEVyYXNlcigpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuXHJcbiAgc2V0UGVuKCkge1xyXG4gICAgbGV0IG1vdXNlID0gdGhpcy5tb3VzZVxyXG4gICAgT2JqZWN0LmFzc2lnbihtb3VzZS5zdHlsZSwge1xyXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcclxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7REVGQVVMVF9PUFRJT05TLlBFTl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5QRU5cclxuICB9XHJcblxyXG4gIHNldEVyYXNlcigpIHtcclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuICAgIE9iamVjdC5hc3NpZ24obW91c2Uuc3R5bGUsIHtcclxuICAgICAgYm9yZGVyUmFkaXVzOiAwLFxyXG4gICAgICBib3JkZXI6IGAxcHggZGFzaGVkICR7REVGQVVMVF9PUFRJT05TLkVSQVNFUl9CT1JERVJfQ09MT1J9YFxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5FUkFTRVJcclxuICB9XHJcblxyXG4gIHVuZG8oKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMucG9wKClcclxuXHJcbiAgICB0aGlzLm9wZXJhdGVIaXN0b3JpZXMubWFwKChzdGVwcykgPT4ge1xyXG4gICAgICBzdGVwcy5tYXAoKHN0ZXApID0+IHtcclxuICAgICAgICBpZiAoc3RlcFswXSA9PT0gREVGQVVMVF9PUFRJT05TLlBFTikge1xyXG4gICAgICAgICAgdGhpcy5kcmF3Q2lyY2xlLmFwcGx5KHRoaXMsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBERUZBVUxUX09QVElPTlMuRVJBU0VSKSB7XHJcbiAgICAgICAgICBjdHguY2xlYXJSZWN0LmFwcGx5KG51bGwsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgY29uc29sZS5sb2codGhpcy5vcGVyYXRlSGlzdG9yaWVzKVxyXG5cclxuICB9XHJcbn1cclxuIl19
