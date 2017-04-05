'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_OPTIONS = {
  RADIUS: 20,
  MAX_WIDTH: 800,
  COLOR: 'black',
  MOUSE: 'circle'
};

var PhotoCover = function () {
  function PhotoCover(selector) {
    _classCallCheck(this, PhotoCover);

    this.radius = DEFAULT_OPTIONS.RADIUS;
    this.maxWidth = DEFAULT_OPTIONS.MAX_WIDTH;
    this.color = DEFAULT_OPTIONS.COLOR;
    this.mouseType = DEFAULT_OPTIONS.MOUSE;

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

      var _ref = [this.body, this.win],
          body = _ref[0],
          win = _ref[1];

      // initial canvas and its size and position

      this.img.addEventListener('load', function (e) {
        _this.width = e.target.width;
        _this.height = e.target.height;

        _this.canvas = document.createElement('canvas');
        _this.ctx = _this.canvas.getContext('2d');
        _this._async();

        body.appendChild(_this.canvas);

        _this._initMouse();
      }.bind(this), false);

      // async canvas position and size during browser resize
      win.addEventListener('resize', function (e) {
        _this._async();
      }.bind(this), false);

      var canvasMouseMove = function (e) {
        _this.drawByEvent(e);
      }.bind(this);

      // canvas down
      win.addEventListener('mousedown', function (e) {
        _this.drawByEvent(e);

        win.addEventListener('mousemove', canvasMouseMove, false);
      }.bind(this), false);

      win.addEventListener('mouseup', function (e) {
        win.removeEventListener('mousemove', canvasMouseMove, false);
      }.bind(this), false);
    }

    // async the width, height, x and y of image to canvas

  }, {
    key: '_async',
    value: function _async() {
      var coordinate = this.img.getBoundingClientRect();
      this.top = coordinate.top;
      this.left = coordinate.left;

      this.canvas.style.cssText = '\n      position: absolute;\n      left: ' + (this.left + this.body.scrollLeft) + 'px;\n      top: ' + (this.top + this.body.scrollTop) + 'px;\n      use-select: none;\n    ';

      this.width = this.canvas.width = this.img.width;
      this.height = this.canvas.height = this.img.height;
    }

    // initial mouse shape where mouse on canvas

  }, {
    key: '_initMouse',
    value: function _initMouse(type) {
      var _this2 = this;

      var _ref2 = [this.body, this.win],
          body = _ref2[0],
          win = _ref2[1];

      var mouse = document.createElement('div');
      mouse.style.cssText = '\n      display: none;\n      position: absolute;\n      left: 0;\n      top: 0;\n      width: ' + this.radius * 2 + 'px;\n      height: ' + this.radius * 2 + 'px;\n      border: 1px solid red;\n      border-radius: 100%;\n    ';
      this.mouse = mouse;

      body.appendChild(mouse);

      // change mouse style
      win.addEventListener('mousemove', function (e) {
        console.log(e);
        var _ref3 = [e.pageX, e.pageY],
            x = _ref3[0],
            y = _ref3[1];

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
    value: function drawCircle(x, y) {
      var ctx = this.ctx;

      ctx.beginPath();
      ctx.arc(x + 1, y + 1, this.radius, 0, 360);
      ctx.fill();
      ctx.closePath();
    }
  }, {
    key: 'drawByEvent',
    value: function drawByEvent(event) {
      if (!this.ctx) return;

      var _ref4 = [event.pageX, event.pageY, this.ctx],
          x = _ref4[0],
          y = _ref4[1],
          ctx = _ref4[2];

      var isOnCanvas = this.isOnCanvas(x, y);

      var canvasX = x - this.left;
      var canvasY = y - this.top;

      if (isOnCanvas) {
        this.drawCircle(canvasX, canvasY);
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
  }]);

  return PhotoCover;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIuanMiXSwibmFtZXMiOlsiREVGQVVMVF9PUFRJT05TIiwiUkFESVVTIiwiTUFYX1dJRFRIIiwiQ09MT1IiLCJNT1VTRSIsIlBob3RvQ292ZXIiLCJzZWxlY3RvciIsInJhZGl1cyIsIm1heFdpZHRoIiwiY29sb3IiLCJtb3VzZVR5cGUiLCJpbWciLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJ3aW4iLCJ3aW5kb3ciLCJkb2MiLCJib2R5IiwibW91c2UiLCJ3aWR0aCIsImhlaWdodCIsImxlZnQiLCJ0b3AiLCJjYW52YXMiLCJjdHgiLCJfaW5pdCIsIkVycm9yIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJ0YXJnZXQiLCJjcmVhdGVFbGVtZW50IiwiZ2V0Q29udGV4dCIsIl9hc3luYyIsImFwcGVuZENoaWxkIiwiX2luaXRNb3VzZSIsImJpbmQiLCJjYW52YXNNb3VzZU1vdmUiLCJkcmF3QnlFdmVudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjb29yZGluYXRlIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwic3R5bGUiLCJjc3NUZXh0Iiwic2Nyb2xsTGVmdCIsInNjcm9sbFRvcCIsInR5cGUiLCJjb25zb2xlIiwibG9nIiwicGFnZVgiLCJwYWdlWSIsIngiLCJ5IiwiaXNPbkNhbnZhcyIsInRyYW5zZm9ybSIsImRpc3BsYXkiLCJjdXJzb3IiLCJzZXRSYWRpdXMiLCJiZWdpblBhdGgiLCJhcmMiLCJmaWxsIiwiY2xvc2VQYXRoIiwiZXZlbnQiLCJjYW52YXNYIiwiY2FudmFzWSIsImRyYXdDaXJjbGUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQU1BLGtCQUFrQjtBQUN0QkMsVUFBUSxFQURjO0FBRXRCQyxhQUFXLEdBRlc7QUFHdEJDLFNBQU8sT0FIZTtBQUl0QkMsU0FBTztBQUplLENBQXhCOztJQU9NQyxVO0FBQ0osc0JBQVlDLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBS0MsTUFBTCxHQUFjUCxnQkFBZ0JDLE1B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LEtBQVAsRUFBY2EsTUFBTVosS0FBcEIsRUFBMkIsS0FBS3pCLEdBQWhDLENBSEQ7QUFBQSxVQUdaMEIsQ0FIWTtBQUFBLFVBR1RDLENBSFM7QUFBQSxVQUdOM0IsR0FITTs7QUFJakIsVUFBSTRCLGFBQWEsS0FBS0EsVUFBTCxDQUFnQkYsQ0FBaEIsRUFBbUJDLENBQW5CLENBQWpCOztBQUVBLFVBQUlXLFVBQVVaLElBQUksS0FBSzdCLElBQXZCO0FBQ0EsVUFBSTBDLFVBQVVaLElBQUksS0FBSzdCLEdBQXZCOztBQUVBLFVBQUk4QixVQUFKLEVBQWdCO0FBQ2QsYUFBS1ksVUFBTCxDQUFnQkYsT0FBaEIsRUFBeUJDLE9BQXpCO0FBQ0Q7QUFDRjs7OytCQUVVYixDLEVBQUdDLEMsRUFBRzs7QUFFZixVQUFJRCxJQUFJLEtBQUs3QixJQUFULElBQWlCNkIsSUFBSyxLQUFLN0IsSUFBTCxHQUFZLEtBQUtGLEtBQXZDLElBQWlEZ0MsSUFBSSxLQUFLN0IsR0FBMUQsSUFBaUU2QixJQUFLLEtBQUs3QixHQUFMLEdBQVcsS0FBS0YsTUFBMUYsRUFBbUc7QUFDakcsZUFBTyxLQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxJQUFQO0FBQ0Q7QUFDRjs7O2dDQUVXRCxLLEVBQU87QUFDakIsV0FBS1gsUUFBTCxHQUFnQlcsS0FBaEI7QUFDRDs7OzZCQUVRVixLLEVBQU87QUFDZCxXQUFLQSxLQUFMLEdBQWFBLEtBQWI7QUFDRCIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgREVGQVVMVF9PUFRJT05TID0ge1xyXG4gIFJBRElVUzogMjAsXHJcbiAgTUFYX1dJRFRIOiA4MDAsXHJcbiAgQ09MT1I6ICdibGFjaycsXHJcbiAgTU9VU0U6ICdjaXJjbGUnXHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yKSB7XHJcbiAgICB0aGlzLnJhZGl1cyA9IERFRkFVTFRfT1BUSU9OUy5SQURJVVNcclxuICAgIHRoaXMubWF4V2lkdGggPSBERUZBVUxUX09QVElPTlMuTUFYX1dJRFRIXHJcbiAgICB0aGlzLmNvbG9yID0gREVGQVVMVF9PUFRJT05TLkNPTE9SXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IERFRkFVTFRfT1BUSU9OUy5NT1VTRVxyXG5cclxuICAgIHRoaXMuaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcilcclxuXHJcbiAgICB0aGlzLndpbiA9IHdpbmRvd1xyXG4gICAgdGhpcy5kb2MgPSBkb2N1bWVudFxyXG4gICAgdGhpcy5ib2R5ID0gdGhpcy5kb2MuYm9keVxyXG5cclxuICAgIHRoaXMubW91c2VcclxuICAgIHRoaXMud2lkdGhcclxuICAgIHRoaXMuaGVpZ2h0XHJcbiAgICB0aGlzLmxlZnRcclxuICAgIHRoaXMudG9wXHJcbiAgICB0aGlzLmNhbnZhc1xyXG4gICAgdGhpcy5jdHhcclxuXHJcbiAgICB0aGlzLl9pbml0KClcclxuICB9XHJcblxyXG4gIF9pbml0KCkge1xyXG4gICAgaWYgKCF0aGlzLmltZykge1xyXG4gICAgICB0aHJvdyBFcnJvcignTm8gSW1hZ2UgU2VsZWN0ZWQnKVxyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbl0gPSBbdGhpcy5ib2R5LCB0aGlzLndpbl1cclxuXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLmltZy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKChlKSA9PiB7XHJcbiAgICAgIHRoaXMud2lkdGggPSBlLnRhcmdldC53aWR0aFxyXG4gICAgICB0aGlzLmhlaWdodCA9IGUudGFyZ2V0LmhlaWdodFxyXG5cclxuICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuICAgICAgdGhpcy5fYXN5bmMoKVxyXG5cclxuICAgICAgYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcylcclxuXHJcbiAgICAgIHRoaXMuX2luaXRNb3VzZSgpXHJcblxyXG4gICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpXHJcblxyXG4gICAgLy8gYXN5bmMgY2FudmFzIHBvc2l0aW9uIGFuZCBzaXplIGR1cmluZyBicm93c2VyIHJlc2l6ZVxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgoZSkgPT4ge1xyXG4gICAgICB0aGlzLl9hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlTW92ZSA9ICgoZSkgPT4ge1xyXG4gICAgICB0aGlzLmRyYXdCeUV2ZW50KGUpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2FudmFzIGRvd25cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKGUpID0+IHtcclxuICAgICAgdGhpcy5kcmF3QnlFdmVudChlKVxyXG5cclxuICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICB9KS5iaW5kKHRoaXMpLCBmYWxzZSlcclxuXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgoZSkgPT4ge1xyXG4gICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgdGhlIHdpZHRoLCBoZWlnaHQsIHggYW5kIHkgb2YgaW1hZ2UgdG8gY2FudmFzXHJcbiAgX2FzeW5jKCkge1xyXG4gICAgbGV0IGNvb3JkaW5hdGUgPSB0aGlzLmltZy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgdGhpcy50b3AgPSBjb29yZGluYXRlLnRvcFxyXG4gICAgdGhpcy5sZWZ0ID0gY29vcmRpbmF0ZS5sZWZ0XHJcblxyXG4gICAgdGhpcy5jYW52YXMuc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICBsZWZ0OiAke3RoaXMubGVmdCArIHRoaXMuYm9keS5zY3JvbGxMZWZ0fXB4O1xyXG4gICAgICB0b3A6ICR7dGhpcy50b3AgKyB0aGlzLmJvZHkuc2Nyb2xsVG9wfXB4O1xyXG4gICAgICB1c2Utc2VsZWN0OiBub25lO1xyXG4gICAgYFxyXG5cclxuICAgIHRoaXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuaW1nLndpZHRoXHJcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuaW1nLmhlaWdodFxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBfaW5pdE1vdXNlKHR5cGUpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB3aWR0aDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGhlaWdodDogJHt0aGlzLnJhZGl1cyAqIDJ9cHg7XHJcbiAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcclxuICAgICAgYm9yZGVyLXJhZGl1czogMTAwJTtcclxuICAgIGBcclxuICAgIHRoaXMubW91c2UgPSBtb3VzZVxyXG5cclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQobW91c2UpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKChlKSA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgIGxldCBbeCwgeV0gPSBbZS5wYWdlWCwgZS5wYWdlWV1cclxuICAgICAgbGV0IGlzT25DYW52YXMgPSB0aGlzLmlzT25DYW52YXMoeCwgeSlcclxuXHJcbiAgICAgIG1vdXNlLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoJHt4IC0gdGhpcy5yYWRpdXN9cHgsICR7eSAtIHRoaXMucmFkaXVzfXB4KWBcclxuXHJcbiAgICAgIGlmICghaXNPbkNhbnZhcykge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSdcclxuICAgICAgfVxyXG5cclxuICAgIH0pLmJpbmQodGhpcyksIGZhbHNlKVxyXG5cclxuICB9XHJcblxyXG4gIHNldFJhZGl1cyhyYWRpdXMpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgIG1vdXNlLnN0eWxlLmhlaWdodCA9IHJhZGl1cyAqIDIgKyAncHgnXHJcbiAgfVxyXG5cclxuICB6b29tSW4ocmFkaXVzID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1cyA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcbiAgZHJhd0NpcmNsZSh4LCB5KSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuXHJcbiAgICBjdHguYmVnaW5QYXRoKClcclxuICAgIGN0eC5hcmMoeCArIDEsIHkgKyAxLCB0aGlzLnJhZGl1cywgMCwgMzYwKVxyXG4gICAgY3R4LmZpbGwoKVxyXG4gICAgY3R4LmNsb3NlUGF0aCgpXHJcbiAgfVxyXG5cclxuXHJcbiAgZHJhd0J5RXZlbnQoZXZlbnQpIHtcclxuICAgIGlmICghdGhpcy5jdHgpIHJldHVyblxyXG5cclxuICAgIGxldCBbeCwgeSwgY3R4XSA9IFtldmVudC5wYWdlWCwgZXZlbnQucGFnZVksIHRoaXMuY3R4XVxyXG4gICAgbGV0IGlzT25DYW52YXMgPSB0aGlzLmlzT25DYW52YXMoeCwgeSlcclxuXHJcbiAgICBsZXQgY2FudmFzWCA9IHggLSB0aGlzLmxlZnRcclxuICAgIGxldCBjYW52YXNZID0geSAtIHRoaXMudG9wXHJcblxyXG4gICAgaWYgKGlzT25DYW52YXMpIHtcclxuICAgICAgdGhpcy5kcmF3Q2lyY2xlKGNhbnZhc1gsIGNhbnZhc1kpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHgsIHkpIHtcclxuXHJcbiAgICBpZiAoeCA8IHRoaXMubGVmdCB8fCB4ID4gKHRoaXMubGVmdCArIHRoaXMud2lkdGgpIHx8IHkgPCB0aGlzLnRvcCB8fCB5ID4gKHRoaXMudG9wICsgdGhpcy5oZWlnaHQpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRydWVcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldE1heFdpZHRoKHdpZHRoKSB7XHJcbiAgICB0aGlzLm1heFdpZHRoID0gd2lkdGhcclxuICB9XHJcblxyXG4gIHNldENvbG9yKGNvbG9yKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcbn1cclxuIl19
