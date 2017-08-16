var MouseType;
(function (MouseType) {
    MouseType[MouseType["PEN"] = 0] = "PEN";
    MouseType[MouseType["ERASER"] = 1] = "ERASER";
    MouseType[MouseType["MOSAIC"] = 2] = "MOSAIC";
})(MouseType || (MouseType = {}));
var PhotoCover = (function () {
    function PhotoCover(selector) {
        this.isMobile = navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1;
        // cache window, document and body for speed up performance
        this.win = window;
        this.doc = document;
        this.body = document.body;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        // init value
        this.mouseType = MouseType.PEN; // default mouse pointer
        this.radius = PhotoCover.DEFAULT_RADIUS; // default radius of pen
        this.maxWidth = PhotoCover.DEFAULT_MAX_WIDTH; // default max width of image
        this.color = PhotoCover.DEFAULT_COLOR; // default color of canvas
        this.lineCap = PhotoCover.DEFAULT_LINECAP; // default linecap of line on canvas
        this.lineJoin = PhotoCover.DEFAULT_LINEJOIN; // default lineJoin of line on canvas
        this.histories = []; // operate history
        this.bindedEvents = []; // registered events [node, type, function]
        this.historyChange = new CustomEvent('historyChange', { detail: this.histories });
        if (typeof selector === 'object') {
            this.img = selector;
        }
        else if (typeof selector === 'string') {
            this.img = document.querySelector(selector);
        }
        // initial canvas and its size and position
        this.canvas.width = this.img.width;
        this.canvas.height = this.img.height;
        this.init();
    }
    PhotoCover.prototype.init = function () {
        var _this = this;
        var _a = [this.body, this.win, this.doc], body = _a[0], win = _a[1], doc = _a[2];
        this.async();
        body.appendChild(this.canvas);
        if (!this.isMobile) {
            this.initMouse();
        }
        // async canvas position and size during browser resize
        var resize = (function () {
            _this.async();
        }).bind(this);
        win.addEventListener('resize', resize, false);
        this.bindedEvents.push([win, 'resize', resize]);
        // this.img.style.cssText = `opacity: 0.4`
        // this.img.style.opacity = '0'
        this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
        var currentOperate = [];
        var mouseDownOnCanvas = false;
        var mosaicSelection;
        var startX;
        var startY;
        var canvasMouseDown = (function (e) {
            e.preventDefault();
            startX = e.pageX;
            startY = e.pageY;
            var _a = _this.getCoordinateByEvent(e), x = _a[0], y = _a[1];
            currentOperate = [];
            if (_this.isOnCanvas(e.pageX, e.pageY)) {
                mouseDownOnCanvas = true;
                if (_this.mouseType === MouseType.PEN || _this.mouseType === MouseType.ERASER) {
                    _this.ctx.beginPath();
                    currentOperate.push(['MOVE_TO', x, y]);
                    currentOperate.push(_this.drawByEvent(e));
                    _this.ctx.beginPath();
                    currentOperate.push(['MOVE_TO', x, y]);
                }
                else if (_this.mouseType === MouseType.MOSAIC) {
                    mosaicSelection = doc.createElement('div');
                    mosaicSelection.style.cssText = "\n            position: absolute;\n            left: " + startX + "px;\n            top: " + startY + "px;\n            width: 0;\n            height: 0;\n            border: 1px dashed #ddd;\n            background-color: rgba(125, 125, 125, 0.5)\n\n          ";
                    body.appendChild(mosaicSelection);
                }
                win.addEventListener(_this.isMobile ? 'touchmove' : 'mousemove', canvasMouseMove, false);
            }
        }).bind(this);
        var canvasMouseMove = (function (e) {
            e.preventDefault();
            if (_this.mouseType === MouseType.PEN || _this.mouseType === MouseType.ERASER) {
                currentOperate.push(_this.drawByEvent(e));
            }
            else if (_this.mouseType === MouseType.MOSAIC) {
                var rect = _this.limitRect(_this.caculateRect(startX, startY, e.pageX, e.pageY));
                mosaicSelection.style.left = rect.left - 1 + 'px';
                mosaicSelection.style.top = rect.top - 1 + 'px';
                mosaicSelection.style.width = rect.width + 'px';
                mosaicSelection.style.height = rect.height + 'px';
            }
        }).bind(this);
        var canvasMouseUp = (function (e) {
            e.preventDefault();
            win.removeEventListener(_this.isMobile ? 'touchmove' : 'mousemove', canvasMouseMove, false);
            if (mouseDownOnCanvas) {
                mouseDownOnCanvas = false;
                if (_this.mouseType === MouseType.PEN || _this.mouseType === MouseType.ERASER) {
                    _this.histories.push(currentOperate);
                    _this.img.dispatchEvent(_this.historyChange);
                    currentOperate = [];
                }
                else if (_this.mouseType === MouseType.MOSAIC) {
                    var rect = _this.limitRect(_this.caculateRect(startX, startY, e.pageX, e.pageY));
                    var _a = [rect.left - _this.canvas.offsetLeft, rect.top - _this.canvas.offsetTop], x = _a[0], y = _a[1]; // coodinate relative canvas
                    if (rect.width > 0 && rect.height > 0) {
                        var imageData = _this.ctx.getImageData(x, y, rect.width, rect.height);
                        _this.ctx.putImageData(_this.mosaic(imageData), x, y, 0, 0, rect.width, rect.height);
                        _this.histories.push([[MouseType.MOSAIC, x, y, rect.width, rect.height]]);
                        _this.img.dispatchEvent(_this.historyChange);
                    }
                    body.removeChild(mosaicSelection);
                }
                if (_this.mouseType === MouseType.ERASER) {
                    _this.combineWithBackground();
                }
            }
        }).bind(this);
        // canvas down
        win.addEventListener(this.isMobile ? 'touchstart' : 'mousedown', canvasMouseDown, false);
        this.bindedEvents.push([win, this.isMobile ? 'touchstart' : 'mousedown', canvasMouseDown]);
        win.addEventListener(this.isMobile ? 'touchend' : 'mouseup', canvasMouseUp, false);
        this.bindedEvents.push([win, this.isMobile ? 'touchend' : 'mouseup', canvasMouseUp]);
    };
    // async x and y from image to canvas
    PhotoCover.prototype.async = function () {
        this.canvas.style.cssText = "\n      position: absolute;\n      left: " + this.img.offsetLeft + "px;\n      top: " + this.img.offsetTop + "px;\n      use-select: none;\n    ";
    };
    // initial mouse shape where mouse on canvas
    PhotoCover.prototype.initMouse = function () {
        var _this = this;
        var _a = [this.body, this.win], body = _a[0], win = _a[1];
        var mouse = document.createElement('div');
        mouse.style.cssText = "\n      display: none;\n      position: absolute;\n      left: 0;\n      top: 0;\n      z-index: 10001;\n      width: " + this.radius * 2 + "px;\n      height: " + this.radius * 2 + "px;\n      border: 1px solid red;\n      border-radius: 100%;\n    ";
        this.mouse = mouse;
        body.appendChild(mouse);
        var mouseMove = (function (e) {
            var _a = [e.pageX, e.pageY], x = _a[0], y = _a[1];
            var isOnCanvas = _this.isOnCanvas(x, y);
            mouse.style.transform = "translate(" + (x - _this.radius - 1) + "px, " + (y - _this.radius - 1) + "px)"; // minus border width of mouse type
            if (!isOnCanvas) {
                mouse.style.display = 'none';
                body.style.cursor = 'default';
            }
            else {
                if (_this.mouseType === MouseType.MOSAIC) {
                    mouse.style.display = 'none';
                    body.style.cursor = 'crosshair';
                }
                else {
                    mouse.style.display = 'block';
                    body.style.cursor = 'none';
                }
            }
        }).bind(this);
        // change mouse style
        win.addEventListener(this.isMobile ? 'touchmove' : 'mousemove', mouseMove, false);
        this.bindedEvents.push([win, this.isMobile ? 'touchmove' : 'mousemove', mouseMove]);
    };
    PhotoCover.prototype.setRadius = function (radius) {
        if (radius < 2 || radius > 100) {
            return;
        }
        this.radius = radius;
        var mouse = this.mouse;
        if (mouse) {
            mouse.style.width = radius * 2 + 'px';
            mouse.style.height = radius * 2 + 'px';
        }
    };
    PhotoCover.prototype.zoomIn = function (radius) {
        if (radius === void 0) { radius = 2; }
        this.setRadius(this.radius + radius);
    };
    PhotoCover.prototype.zoomOut = function (radius) {
        if (radius === void 0) { radius = 2; }
        this.setRadius(this.radius - radius);
    };
    PhotoCover.prototype.lineTo = function (x, y) {
        var ctx = this.ctx;
        ctx.lineCap = this.lineCap;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 2;
        ctx.lineTo(x, y);
        ctx.stroke();
    };
    PhotoCover.prototype.drawLine = function (x, y) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.lineCap = 'round';
        this.lineJoin = 'round';
        this.lineTo(x, y);
        return [MouseType.PEN, this.color, x, y, this.radius];
    };
    PhotoCover.prototype.erase = function (x, y) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.lineCap = 'round';
        this.lineJoin = 'round';
        this.lineTo(x, y);
        this.ctx.globalCompositeOperation = 'source-over';
        return [MouseType.ERASER, x, y, this.radius];
    };
    PhotoCover.prototype.mosaic = function (imageData) {
        var doc = [this.doc][0];
        var options = {
            resolution: 8
        };
        var canvas = doc.createElement('canvas');
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return new ImageData(0, 0);
        }
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        var rows = canvas.height / options.resolution;
        var cols = canvas.width / options.resolution;
        var r, g, b, a;
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                // let tempData = ctx.getImageData(col * options.resolution, row * options.resolution, 1, 1).data
                // r = tempData[0]
                // g = tempData[1]
                // g = tempData[2]
                // a = tempdata[3] / 255
                r = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 0];
                g = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 1];
                b = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 2];
                a = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 3];
                ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
                ctx.fillRect(col * options.resolution, row * options.resolution, options.resolution, options.resolution);
            }
        }
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    PhotoCover.prototype.drawByEvent = function (event) {
        var _a = this.getCoordinateByEvent(event), x = _a[0], y = _a[1];
        if (this.mouseType === MouseType.PEN) {
            return this.drawLine(x, y);
        }
        else if (this.mouseType === MouseType.ERASER) {
            return this.erase(x, y);
        }
        else {
            return [];
        }
    };
    PhotoCover.prototype.getCoordinateByEvent = function (event) {
        var x, y;
        if (this.isMobile) {
            event = event.changedTouches[0];
        }
        x = event.pageX - this.canvas.offsetLeft;
        y = event.pageY - this.canvas.offsetTop;
        return [x, y];
    };
    PhotoCover.prototype.limitRect = function (rect) {
        var newRect = JSON.parse(JSON.stringify(rect));
        if (rect.left < this.canvas.offsetLeft) {
            newRect.width = rect.left + rect.width - this.canvas.offsetLeft;
            newRect.left = this.canvas.offsetLeft;
        }
        if (rect.top < this.canvas.offsetTop) {
            newRect.height = rect.top + rect.height - this.canvas.offsetTop;
            newRect.top = this.canvas.offsetTop;
        }
        if (rect.left + rect.width > this.canvas.offsetLeft + this.canvas.clientWidth) {
            newRect.width = this.canvas.offsetLeft + this.canvas.clientWidth - rect.left;
        }
        if (rect.top + rect.height > this.canvas.offsetTop + this.canvas.clientHeight) {
            newRect.height = this.canvas.offsetTop + this.canvas.clientHeight - rect.top;
        }
        return newRect;
    };
    PhotoCover.prototype.caculateRect = function (startX, startY, endX, endY) {
        var _a = [endX - startX, endY - startY], w = _a[0], h = _a[1];
        var left = w < 0 ? startX - Math.abs(w) : startX;
        var top = h < 0 ? startY - Math.abs(h) : startY;
        return {
            left: left,
            top: top,
            width: Math.abs(w),
            height: Math.abs(h)
        };
    };
    PhotoCover.prototype.isOnCanvas = function (pageX, pageY) {
        if (pageX < this.img.offsetLeft ||
            pageX > (this.img.offsetLeft + this.img.width) ||
            pageY < this.img.offsetTop ||
            pageY > (this.img.offsetTop + this.img.height)) {
            return false;
        }
        return true;
    };
    PhotoCover.prototype.setMaxWidth = function (width) {
        this.maxWidth = width;
    };
    PhotoCover.prototype.setColor = function (color) {
        this.color = color;
    };
    /**
     * set tool as mouse type
     * @param tool MouseType
     */
    PhotoCover.prototype.setTool = function (tool) {
        this.mouseType = tool;
        if (tool === MouseType.PEN) {
            this.setPen();
        }
        else if (tool === MouseType.ERASER) {
            this.setEraser();
        }
        else if (tool = MouseType.MOSAIC) {
        }
    };
    PhotoCover.prototype.setPen = function () {
        if (this.mouse) {
            Object.assign(this.mouse.style, {
                borderRadius: '100%',
                border: "1px solid " + PhotoCover.DEFAULT_PEN_BORDER_COLOR
            });
        }
        this.mouseType = MouseType.PEN;
    };
    PhotoCover.prototype.setEraser = function () {
        if (this.mouse) {
            Object.assign(this.mouse.style, {
                borderRadius: '100%',
                border: "1px dashed " + PhotoCover.DEFAULT_ERASER_BORDER_COLOR
            });
        }
        this.mouseType = MouseType.ERASER;
    };
    PhotoCover.prototype.setMosaic = function () {
        this.mouseType = MouseType.MOSAIC;
    };
    PhotoCover.prototype.undo = function () {
        var _this = this;
        var ctx = this.ctx;
        var color = this.color;
        ctx.save();
        // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
        this.histories.pop();
        this.img.dispatchEvent(this.historyChange);
        this.histories.map(function (steps) {
            steps.map(function (step) {
                if (step[0] === MouseType.PEN) {
                    _this.color = step[1];
                    _this.setRadius(step[4]);
                    _this.drawLine(step[2], step[3]);
                }
                else if (step[0] === MouseType.ERASER) {
                    _this.setRadius(step[3]);
                    _this.erase(step[1], step[2]);
                    _this.combineWithBackground();
                }
                else if (step[0] === 'MOVE_TO') {
                    ctx.beginPath();
                    ctx.moveTo.apply(ctx, step.slice(1));
                }
                else if (step[0] === MouseType.MOSAIC) {
                    var imageData = _this.ctx.getImageData(step[1], step[2], step[3], step[4]);
                    _this.ctx.putImageData(_this.mosaic(imageData), step[1], step[2], 0, 0, step[3], step[4]);
                }
            });
        });
        this.color = color;
        ctx.restore();
    };
    /**
     * get image origin size
     * @param  {String}   src      iamge source url
     * @param  {Function} callback callback function, width as first parameter and height as second
     * @return {undefined}
     */
    PhotoCover.prototype.getImageOriginSize = function (src, callback) {
        var img = new Image();
        img.onload = function () {
            var width = img.width;
            var height = img.height;
            callback && callback(width, height);
        };
        img.src = src;
    };
    PhotoCover.prototype.getDataURL = function (type, quality, callback) {
        if (type === void 0) { type = 'image/jpeg'; }
        if (quality === void 0) { quality = 0.8; }
        this.combineWithBackground(function (canvas) {
            callback && callback(canvas.toDataURL(type, quality));
        });
        // let src = this.img.src
        // this.getImageOriginSize(src, (width: number, height: number) => {
        //   let tempCanvas = document.createElement('canvas')
        //   tempCanvas.width = width
        //   tempCanvas.height = height
        //   let tempCtx = tempCanvas.getContext('2d')
        //   if (tempCtx) {
        //     tempCtx.drawImage(this.img, 0, 0, width, height)
        //     tempCtx.drawImage(this.canvas, 0, 0, width, height)
        //     callback && callback(tempCanvas.toDataURL(type, quality))
        //   }
        // })
    };
    PhotoCover.prototype.combineWithBackground = function (callback) {
        var doc = this.doc;
        var canvas = doc.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.canvas, 0, 0, canvas.width, canvas.height);
        this.ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
        callback && callback(canvas, ctx);
    };
    /**
     * remove dom that added into body,
     * remove all events that registered
     */
    PhotoCover.prototype.destroy = function () {
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        this.mouse.parentNode && this.mouse.parentNode.removeChild(this.mouse);
        this.img.src = '';
        this.bindedEvents.forEach(function (v) {
            v[0].removeEventListener(v[1], v[2], false);
        });
        // delete this
    };
    PhotoCover.DEFAULT_RADIUS = 20;
    PhotoCover.DEFAULT_MAX_WIDTH = 800;
    PhotoCover.DEFAULT_COLOR = 'black';
    PhotoCover.DEFAULT_PEN_BORDER_COLOR = 'red';
    PhotoCover.DEFAULT_ERASER_BORDER_COLOR = '#666';
    PhotoCover.DEFAULT_LINECAP = 'round';
    PhotoCover.DEFAULT_LINEJOIN = 'round';
    return PhotoCover;
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,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S0FBSyxTQUFTLENBQUMsR0FBRyxJQUFJLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQzVFLEtBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO29CQUNuQyxLQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7b0JBQzFDLGNBQWMsR0FBRyxFQUFFLENBQUE7Z0JBQ3JCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQy9DLElBQUksSUFBSSxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUMsS0FBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7b0JBQzFFLElBQUEsNkVBQStFLEVBQTlFLFNBQUMsRUFBRSxTQUFDLENBQTBFLENBQUMsNEJBQTRCO29CQUVoSCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3RDLElBQUksU0FBUyxHQUFHLEtBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7d0JBQ3BFLEtBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO3dCQUVsRixLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FB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SUExaEJNLHlCQUFjLEdBQVUsRUFBRSxDQUFBO0lBQzFCLDRCQUFpQixHQUFVLEdBQUcsQ0FBQTtJQUM5Qix3QkFBYSxHQUFXLE9BQU8sQ0FBQTtJQUMvQixtQ0FBd0IsR0FBVyxLQUFLLENBQUE7SUFDeEMsc0NBQTJCLEdBQVUsTUFBTSxDQUFBO0lBQzNDLDBCQUFlLEdBQVcsT0FBTyxDQUFBO0lBQ2pDLDJCQUFnQixHQUFXLE9BQU8sQ0FBQTtJQXFoQjNDLGlCQUFDO0NBNWhCRCxBQTRoQkMsSUFBQSIsImZpbGUiOiJwaG90b2NvdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZW51bSBNb3VzZVR5cGUgeyBQRU4sIEVSQVNFUiwgTU9TQUlDIH1cclxuXHJcbmludGVyZmFjZSBSZWN0IHtcclxuICBsZWZ0OiBudW1iZXI7XHJcbiAgdG9wOiBudW1iZXI7XHJcbiAgd2lkdGg6IG51bWJlcjtcclxuICBoZWlnaHQ6IG51bWJlcjtcclxufVxyXG5cclxuY2xhc3MgUGhvdG9Db3ZlciB7XHJcbiAgc3RhdGljIERFRkFVTFRfUkFESVVTOm51bWJlciA9IDIwXHJcbiAgc3RhdGljIERFRkFVTFRfTUFYX1dJRFRIOm51bWJlciA9IDgwMFxyXG4gIHN0YXRpYyBERUZBVUxUX0NPTE9SOiBzdHJpbmcgPSAnYmxhY2snXHJcbiAgc3RhdGljIERFRkFVTFRfUEVOX0JPUkRFUl9DT0xPUjogc3RyaW5nID0gJ3JlZCdcclxuICBzdGF0aWMgREVGQVVMVF9FUkFTRVJfQk9SREVSX0NPTE9SOnN0cmluZyA9ICcjNjY2J1xyXG4gIHN0YXRpYyBERUZBVUxUX0xJTkVDQVA6IHN0cmluZyA9ICdyb3VuZCdcclxuICBzdGF0aWMgREVGQVVMVF9MSU5FSk9JTjogc3RyaW5nID0gJ3JvdW5kJ1xyXG5cclxuICByZWFkb25seSBpc01vYmlsZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignaVBob25lJykgPiAtMSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSA+IC0xXHJcblxyXG4gIC8vIGNhY2hlIHdpbmRvdywgZG9jdW1lbnQgYW5kIGJvZHkgZm9yIHNwZWVkIHVwIHBlcmZvcm1hbmNlXHJcbiAgd2luOiBXaW5kb3cgPSB3aW5kb3dcclxuICBkb2M6IEhUTUxEb2N1bWVudCA9IGRvY3VtZW50XHJcbiAgYm9keTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5XHJcblxyXG4gIG1vdXNlOiBIVE1MRGl2RWxlbWVudCAgIC8vIG1vdXNlIHBvaW50ZXIgb24gY2FudmFzXHJcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgaW1nOiBIVE1MSW1hZ2VFbGVtZW50ICAvLyBpbWFnZSB0aGF0IHlvdSB3YW50IHRvIGNoYW5nZSBcclxuXHJcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxyXG5cclxuICAvLyBpbml0IHZhbHVlXHJcbiAgbW91c2VUeXBlOiBNb3VzZVR5cGUgPSBNb3VzZVR5cGUuUEVOICAgIC8vIGRlZmF1bHQgbW91c2UgcG9pbnRlclxyXG4gIHJhZGl1cyA9ICBQaG90b0NvdmVyLkRFRkFVTFRfUkFESVVTICAgIC8vIGRlZmF1bHQgcmFkaXVzIG9mIHBlblxyXG4gIG1heFdpZHRoID0gUGhvdG9Db3Zlci5ERUZBVUxUX01BWF9XSURUSCAgICAgLy8gZGVmYXVsdCBtYXggd2lkdGggb2YgaW1hZ2VcclxuICBjb2xvciA9IFBob3RvQ292ZXIuREVGQVVMVF9DT0xPUiAgICAvLyBkZWZhdWx0IGNvbG9yIG9mIGNhbnZhc1xyXG4gIGxpbmVDYXAgPSBQaG90b0NvdmVyLkRFRkFVTFRfTElORUNBUCAgICAvLyBkZWZhdWx0IGxpbmVjYXAgb2YgbGluZSBvbiBjYW52YXNcclxuICBsaW5lSm9pbiA9IFBob3RvQ292ZXIuREVGQVVMVF9MSU5FSk9JTiAvLyBkZWZhdWx0IGxpbmVKb2luIG9mIGxpbmUgb24gY2FudmFzXHJcblxyXG4gIGhpc3RvcmllczogYW55W11bXSA9IFtdICAgIC8vIG9wZXJhdGUgaGlzdG9yeVxyXG4gIGJpbmRlZEV2ZW50czogYW55W11bXSA9IFtdICAgIC8vIHJlZ2lzdGVyZWQgZXZlbnRzIFtub2RlLCB0eXBlLCBmdW5jdGlvbl1cclxuICBoaXN0b3J5Q2hhbmdlOiBFdmVudCA9IG5ldyBDdXN0b21FdmVudCgnaGlzdG9yeUNoYW5nZScsIHsgZGV0YWlsOiB0aGlzLmhpc3RvcmllcyB9KVxyXG5cclxuICBjb25zdHJ1Y3RvcihzZWxlY3RvcjogSFRNTEltYWdlRWxlbWVudCB8IHN0cmluZykge1xyXG5cclxuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnKSB7IHRoaXMuaW1nID0gc2VsZWN0b3IgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykgeyB0aGlzLmltZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIGFzIEhUTUxJbWFnZUVsZW1lbnQgfVxyXG4gICAgXHJcbiAgICAvLyBpbml0aWFsIGNhbnZhcyBhbmQgaXRzIHNpemUgYW5kIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuaW1nLndpZHRoXHJcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmltZy5oZWlnaHRcclxuXHJcbiAgICB0aGlzLmluaXQoKVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBpbml0KCk6IHZvaWQge1xyXG5cclxuICAgIGxldCBbYm9keSwgd2luLCBkb2NdID0gW3RoaXMuYm9keSwgdGhpcy53aW4sIHRoaXMuZG9jXVxyXG5cclxuICAgIHRoaXMuYXN5bmMoKVxyXG4gICAgYm9keS5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcylcclxuXHJcbiAgICBpZiAoIXRoaXMuaXNNb2JpbGUpIHsgdGhpcy5pbml0TW91c2UoKSB9XHJcblxyXG4gICAgLy8gYXN5bmMgY2FudmFzIHBvc2l0aW9uIGFuZCBzaXplIGR1cmluZyBicm93c2VyIHJlc2l6ZVxyXG4gICAgbGV0IHJlc2l6ZSA9ICgoKSA9PiB7XHJcbiAgICAgIHRoaXMuYXN5bmMoKVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSwgZmFsc2UpXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5wdXNoKFt3aW4sICdyZXNpemUnLCByZXNpemVdKVxyXG5cclxuXHJcbiAgICAvLyB0aGlzLmltZy5zdHlsZS5jc3NUZXh0ID0gYG9wYWNpdHk6IDAuNGBcclxuICAgIC8vIHRoaXMuaW1nLnN0eWxlLm9wYWNpdHkgPSAnMCdcclxuICAgIHRoaXMuY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodClcclxuXHJcbiAgICBsZXQgY3VycmVudE9wZXJhdGU6IGFueVtdW10gPSBbXVxyXG5cclxuICAgIGxldCBtb3VzZURvd25PbkNhbnZhczogYm9vbGVhbiA9IGZhbHNlXHJcbiAgICBsZXQgbW9zYWljU2VsZWN0aW9uOiBIVE1MRGl2RWxlbWVudFxyXG4gICAgbGV0IHN0YXJ0WDogbnVtYmVyXHJcbiAgICBsZXQgc3RhcnRZOiBudW1iZXJcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VEb3duID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcblxyXG4gICAgICBzdGFydFggPSBlLnBhZ2VYXHJcbiAgICAgIHN0YXJ0WSA9IGUucGFnZVlcclxuICAgICAgY29uc3QgW3gsIHldID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChlKVxyXG5cclxuICAgICAgY3VycmVudE9wZXJhdGUgPSBbXVxyXG5cclxuICAgICAgaWYgKHRoaXMuaXNPbkNhbnZhcyhlLnBhZ2VYLCBlLnBhZ2VZKSkge1xyXG4gICAgICAgIG1vdXNlRG93bk9uQ2FudmFzID0gdHJ1ZVxyXG5cclxuICAgICAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5QRU4gfHwgdGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpXHJcbiAgICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKFsnTU9WRV9UTycsIHgsIHldKVxyXG4gICAgICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG5cclxuICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpXHJcbiAgICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKFsnTU9WRV9UTycsIHgsIHldKVxyXG5cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgICAgICAgbW9zYWljU2VsZWN0aW9uID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICAgICAgICBtb3NhaWNTZWxlY3Rpb24uc3R5bGUuY3NzVGV4dCA9IGBcclxuICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICBsZWZ0OiAke3N0YXJ0WH1weDtcclxuICAgICAgICAgICAgdG9wOiAke3N0YXJ0WX1weDtcclxuICAgICAgICAgICAgd2lkdGg6IDA7XHJcbiAgICAgICAgICAgIGhlaWdodDogMDtcclxuICAgICAgICAgICAgYm9yZGVyOiAxcHggZGFzaGVkICNkZGQ7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMTI1LCAxMjUsIDEyNSwgMC41KVxyXG5cclxuICAgICAgICAgIGBcclxuICAgICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQobW9zYWljU2VsZWN0aW9uKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2luLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pc01vYmlsZSA/ICd0b3VjaG1vdmUnIDogJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlTW92ZSA9ICgoZTogYW55KSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5QRU4gfHwgdGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5NT1NBSUMpIHtcclxuICAgICAgICBsZXQgcmVjdCA9IHRoaXMubGltaXRSZWN0KHRoaXMuY2FjdWxhdGVSZWN0KHN0YXJ0WCwgc3RhcnRZLCBlLnBhZ2VYLCBlLnBhZ2VZKSlcclxuXHJcbiAgICAgICAgbW9zYWljU2VsZWN0aW9uLnN0eWxlLmxlZnQgPSByZWN0LmxlZnQgLSAxICsgJ3B4J1xyXG4gICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS50b3AgPSByZWN0LnRvcCAtIDEgKyAncHgnXHJcbiAgICAgICAgbW9zYWljU2VsZWN0aW9uLnN0eWxlLndpZHRoID0gcmVjdC53aWR0aCArICdweCdcclxuICAgICAgICBtb3NhaWNTZWxlY3Rpb24uc3R5bGUuaGVpZ2h0ID0gcmVjdC5oZWlnaHQgKyAncHgnXHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VVcCA9ICgoZTogYW55KSA9PiB7XHJcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZSc6ICdtb3VzZW1vdmUnLCBjYW52YXNNb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgICBcclxuICAgICAgaWYgKG1vdXNlRG93bk9uQ2FudmFzKSB7XHJcbiAgICAgICAgbW91c2VEb3duT25DYW52YXMgID0gZmFsc2VcclxuICAgICAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5QRU4gfHwgdGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICAgIHRoaXMuaGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgICB0aGlzLmltZy5kaXNwYXRjaEV2ZW50KHRoaXMuaGlzdG9yeUNoYW5nZSlcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBsZXQgcmVjdCA9IHRoaXMubGltaXRSZWN0KHRoaXMuY2FjdWxhdGVSZWN0KHN0YXJ0WCwgc3RhcnRZLCBlLnBhZ2VYLCBlLnBhZ2VZKSlcclxuICAgICAgICAgIGxldCBbeCwgeV0gPSBbcmVjdC5sZWZ0IC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCwgcmVjdC50b3AgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BdIC8vIGNvb2RpbmF0ZSByZWxhdGl2ZSBjYW52YXNcclxuXHJcbiAgICAgICAgICBpZiAocmVjdC53aWR0aCA+IDAgJiYgcmVjdC5oZWlnaHQgPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZURhdGEgPSB0aGlzLmN0eC5nZXRJbWFnZURhdGEoeCwgeSwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQpXHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YSh0aGlzLm1vc2FpYyhpbWFnZURhdGEpLCB4LCB5LCAwLCAwLCByZWN0LndpZHRoLCByZWN0LmhlaWdodClcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yaWVzLnB1c2goW1tNb3VzZVR5cGUuTU9TQUlDLCB4LCB5LCByZWN0LndpZHRoLCByZWN0LmhlaWdodF1dKVxyXG4gICAgICAgICAgICB0aGlzLmltZy5kaXNwYXRjaEV2ZW50KHRoaXMuaGlzdG9yeUNoYW5nZSlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBib2R5LnJlbW92ZUNoaWxkKG1vc2FpY1NlbGVjdGlvbilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgICAgdGhpcy5jb21iaW5lV2l0aEJhY2tncm91bmQoKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIC8vIGNhbnZhcyBkb3duXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNoc3RhcnQnOiAnbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duLCBmYWxzZSlcclxuICAgIHRoaXMuYmluZGVkRXZlbnRzLnB1c2goW3dpbiwgdGhpcy5pc01vYmlsZSA/ICd0b3VjaHN0YXJ0JzogJ21vdXNlZG93bicsIGNhbnZhc01vdXNlRG93bl0pXHJcblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pc01vYmlsZSA/ICd0b3VjaGVuZCc6ICdtb3VzZXVwJywgY2FudmFzTW91c2VVcCwgZmFsc2UpXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5wdXNoKFt3aW4sIHRoaXMuaXNNb2JpbGUgPyAndG91Y2hlbmQnOiAnbW91c2V1cCcsIGNhbnZhc01vdXNlVXBdKVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgeCBhbmQgeSBmcm9tIGltYWdlIHRvIGNhbnZhc1xyXG4gIHByaXZhdGUgYXN5bmMoKSB7XHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5pbWcub2Zmc2V0TGVmdH1weDtcclxuICAgICAgdG9wOiAke3RoaXMuaW1nLm9mZnNldFRvcH1weDtcclxuICAgICAgdXNlLXNlbGVjdDogbm9uZTtcclxuICAgIGBcclxuICB9XHJcblxyXG4gIC8vIGluaXRpYWwgbW91c2Ugc2hhcGUgd2hlcmUgbW91c2Ugb24gY2FudmFzXHJcbiAgcHJpdmF0ZSBpbml0TW91c2UoKSB7XHJcbiAgICBsZXQgW2JvZHksIHdpbl0gPSBbdGhpcy5ib2R5LCB0aGlzLndpbl1cclxuICAgIGxldCBtb3VzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICBtb3VzZS5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBkaXNwbGF5OiBub25lO1xyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6IDA7XHJcbiAgICAgIHRvcDogMDtcclxuICAgICAgei1pbmRleDogMTAwMDE7XHJcbiAgICAgIHdpZHRoOiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgaGVpZ2h0OiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xyXG4gICAgICBib3JkZXItcmFkaXVzOiAxMDAlO1xyXG4gICAgYFxyXG4gICAgdGhpcy5tb3VzZSA9IG1vdXNlXHJcblxyXG4gICAgYm9keS5hcHBlbmRDaGlsZChtb3VzZSlcclxuXHJcbiAgICBsZXQgbW91c2VNb3ZlID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1cyAtIDF9cHgsICR7eSAtIHRoaXMucmFkaXVzIC0gMX1weClgIC8vIG1pbnVzIGJvcmRlciB3aWR0aCBvZiBtb3VzZSB0eXBlXHJcblxyXG4gICAgICBpZiAoIWlzT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5NT1NBSUMpIHtcclxuICAgICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcidcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ25vbmUnXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZSc6ICdtb3VzZW1vdmUnLCBtb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgdGhpcy5iaW5kZWRFdmVudHMucHVzaChbd2luLCB0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZSc6ICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVdKVxyXG4gIH1cclxuXHJcbiAgc2V0UmFkaXVzKHJhZGl1czogbnVtYmVyKSB7XHJcbiAgICBpZiAocmFkaXVzIDwgMiB8fCByYWRpdXMgPiAxMDApIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXNcclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcblxyXG4gICAgaWYgKG1vdXNlKSB7XHJcbiAgICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgICAgbW91c2Uuc3R5bGUuaGVpZ2h0ID0gcmFkaXVzICogMiArICdweCdcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHpvb21JbihyYWRpdXM6bnVtYmVyID0gMikge1xyXG4gICAgdGhpcy5zZXRSYWRpdXModGhpcy5yYWRpdXMgKyByYWRpdXMpXHJcbiAgfVxyXG5cclxuICB6b29tT3V0KHJhZGl1czpudW1iZXIgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyAtIHJhZGl1cylcclxuICB9XHJcblxyXG5cclxuICBsaW5lVG8oeDogbnVtYmVyLCB5OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGNvbnN0IGN0eCA9IHRoaXMuY3R4XHJcbiAgICBjdHgubGluZUNhcCA9IHRoaXMubGluZUNhcFxyXG4gICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJ1xyXG4gICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvclxyXG4gICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMucmFkaXVzICogMlxyXG4gICAgY3R4LmxpbmVUbyh4LCB5KVxyXG4gICAgY3R4LnN0cm9rZSgpXHJcbiAgfVxyXG5cclxuICBkcmF3TGluZSh4OiBudW1iZXIsIHk6IG51bWJlcik6IGFueVtdIHtcclxuICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3ZlcidcclxuICAgIHRoaXMubGluZUNhcCA9ICdyb3VuZCdcclxuICAgIHRoaXMubGluZUpvaW4gPSAncm91bmQnXHJcbiAgICB0aGlzLmxpbmVUbyh4LCB5KVxyXG4gICAgcmV0dXJuIFtNb3VzZVR5cGUuUEVOLCB0aGlzLmNvbG9yLCB4LCB5LCB0aGlzLnJhZGl1c11cclxuICB9XHJcblxyXG4gIGVyYXNlKHg6IG51bWJlciwgeTogbnVtYmVyKTogYW55W10ge1xyXG4gICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ2Rlc3RpbmF0aW9uLW91dCdcclxuICAgIHRoaXMubGluZUNhcCA9ICdyb3VuZCdcclxuICAgIHRoaXMubGluZUpvaW4gPSAncm91bmQnXHJcbiAgICB0aGlzLmxpbmVUbyh4LCB5KVxyXG4gICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJ1xyXG4gICAgcmV0dXJuIFtNb3VzZVR5cGUuRVJBU0VSLCB4LCB5LCB0aGlzLnJhZGl1c11cclxuICB9XHJcblxyXG4gIG1vc2FpYyhpbWFnZURhdGE6IEltYWdlRGF0YSk6IEltYWdlRGF0YSB7XHJcbiAgICBjb25zdCBbZG9jXSA9IFt0aGlzLmRvY11cclxuXHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICByZXNvbHV0aW9uOiA4IFxyXG4gICAgfVxyXG5cclxuICAgIGxldCBjYW52YXMgPSBkb2MuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgIGxldCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG5cclxuICAgIGlmICghY3R4KSB7IHJldHVybiBuZXcgSW1hZ2VEYXRhKDAsIDApfVxyXG5cclxuICAgIGNhbnZhcy53aWR0aCA9IGltYWdlRGF0YS53aWR0aFxyXG4gICAgY2FudmFzLmhlaWdodCA9IGltYWdlRGF0YS5oZWlnaHRcclxuICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKVxyXG5cclxuICAgIGxldCByb3dzID0gY2FudmFzLmhlaWdodCAvIG9wdGlvbnMucmVzb2x1dGlvblxyXG4gICAgbGV0IGNvbHMgPSBjYW52YXMud2lkdGggLyBvcHRpb25zLnJlc29sdXRpb25cclxuICAgIGxldCByLCBnLCBiLCBhXHJcblxyXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgcm93czsgcm93KyspIHtcclxuICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgY29sczsgY29sKyspIHtcclxuXHJcbiAgICAgICAgLy8gbGV0IHRlbXBEYXRhID0gY3R4LmdldEltYWdlRGF0YShjb2wgKiBvcHRpb25zLnJlc29sdXRpb24sIHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiwgMSwgMSkuZGF0YVxyXG4gICAgICAgIC8vIHIgPSB0ZW1wRGF0YVswXVxyXG4gICAgICAgIC8vIGcgPSB0ZW1wRGF0YVsxXVxyXG4gICAgICAgIC8vIGcgPSB0ZW1wRGF0YVsyXVxyXG4gICAgICAgIC8vIGEgPSB0ZW1wZGF0YVszXSAvIDI1NVxyXG5cclxuICAgICAgICByID0gaW1hZ2VEYXRhLmRhdGFbKHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiAqIGNhbnZhcy53aWR0aCArIGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbikgKiA0ICsgMF1cclxuICAgICAgICBnID0gaW1hZ2VEYXRhLmRhdGFbKHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiAqIGNhbnZhcy53aWR0aCArIGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbikgKiA0ICsgMV1cclxuICAgICAgICBiID0gaW1hZ2VEYXRhLmRhdGFbKHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiAqIGNhbnZhcy53aWR0aCArIGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbikgKiA0ICsgMl1cclxuICAgICAgICBhID0gaW1hZ2VEYXRhLmRhdGFbKHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiAqIGNhbnZhcy53aWR0aCArIGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbikgKiA0ICsgM11cclxuXHJcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IGByZ2JhKCR7cn0sICR7Z30sICR7Yn0sICR7YX0pYFxyXG4gICAgICAgIGN0eC5maWxsUmVjdChjb2wgKiBvcHRpb25zLnJlc29sdXRpb24sIHJvdyAqIG9wdGlvbnMucmVzb2x1dGlvbiwgb3B0aW9ucy5yZXNvbHV0aW9uLCBvcHRpb25zLnJlc29sdXRpb24pXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpXHJcbiAgfVxyXG5cclxuICBkcmF3QnlFdmVudChldmVudDogYW55KTogYW55W10ge1xyXG4gICAgbGV0IFt4LCB5XSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQpXHJcblxyXG4gICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuUEVOKSB7IHJldHVybiB0aGlzLmRyYXdMaW5lKHgsIHkpIH1cclxuICAgIGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuRVJBU0VSKSB7IHJldHVybiB0aGlzLmVyYXNlKHgsIHkpIH1cclxuICAgIGVsc2UgeyByZXR1cm4gW10gfVxyXG4gIH1cclxuXHJcbiAgZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZXZlbnQ6IGFueSkge1xyXG4gICAgbGV0IHgsIHlcclxuICAgIGlmICh0aGlzLmlzTW9iaWxlKSB7IGV2ZW50ID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0gfVxyXG5cclxuICAgIHggPSBldmVudC5wYWdlWCAtIHRoaXMuY2FudmFzLm9mZnNldExlZnRcclxuICAgIHkgPSBldmVudC5wYWdlWSAtIHRoaXMuY2FudmFzLm9mZnNldFRvcFxyXG5cclxuICAgIHJldHVybiBbeCwgeV1cclxuICB9XHJcblxyXG4gIGxpbWl0UmVjdChyZWN0OiBSZWN0KTogUmVjdCB7XHJcbiAgICBsZXQgbmV3UmVjdCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocmVjdCkpXHJcblxyXG4gICAgaWYgKHJlY3QubGVmdCA8IHRoaXMuY2FudmFzLm9mZnNldExlZnQpIHtcclxuICAgICAgbmV3UmVjdC53aWR0aCA9IHJlY3QubGVmdCArIHJlY3Qud2lkdGggLSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICAgIG5ld1JlY3QubGVmdCA9IHRoaXMuY2FudmFzLm9mZnNldExlZnRcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVjdC50b3AgPCB0aGlzLmNhbnZhcy5vZmZzZXRUb3ApIHtcclxuICAgICAgbmV3UmVjdC5oZWlnaHQgPSByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IC0gdGhpcy5jYW52YXMub2Zmc2V0VG9wXHJcbiAgICAgIG5ld1JlY3QudG9wID0gdGhpcy5jYW52YXMub2Zmc2V0VG9wXHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlY3QubGVmdCArIHJlY3Qud2lkdGggPiB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0ICsgdGhpcy5jYW52YXMuY2xpZW50V2lkdGgpIHtcclxuICAgICAgbmV3UmVjdC53aWR0aCA9IHRoaXMuY2FudmFzLm9mZnNldExlZnQgKyB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aCAtIHJlY3QubGVmdFxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gdGhpcy5jYW52YXMub2Zmc2V0VG9wICsgdGhpcy5jYW52YXMuY2xpZW50SGVpZ2h0KSB7XHJcbiAgICAgIG5ld1JlY3QuaGVpZ2h0ID0gdGhpcy5jYW52YXMub2Zmc2V0VG9wICsgdGhpcy5jYW52YXMuY2xpZW50SGVpZ2h0IC0gcmVjdC50b3BcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3UmVjdFxyXG4gIH1cclxuXHJcbiAgY2FjdWxhdGVSZWN0KHN0YXJ0WDogbnVtYmVyLCBzdGFydFk6IG51bWJlciwgZW5kWDogbnVtYmVyLCBlbmRZOiBudW1iZXIpOiBSZWN0IHtcclxuICAgIGxldCBbdywgaF0gPSBbZW5kWCAtIHN0YXJ0WCwgZW5kWSAtIHN0YXJ0WV1cclxuXHJcbiAgICBsZXQgbGVmdCA9IHcgPCAwID8gc3RhcnRYIC0gTWF0aC5hYnModyk6ICBzdGFydFhcclxuICAgIGxldCB0b3AgPSBoIDwgMCA/IHN0YXJ0WSAtIE1hdGguYWJzKGgpOiBzdGFydFlcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBsZWZ0OiBsZWZ0LFxyXG4gICAgICB0b3A6IHRvcCxcclxuICAgICAgd2lkdGg6IE1hdGguYWJzKHcpLFxyXG4gICAgICBoZWlnaHQ6IE1hdGguYWJzKGgpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc09uQ2FudmFzKHBhZ2VYOiBudW1iZXIsIHBhZ2VZOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIGlmIChcclxuICAgICAgcGFnZVggPCB0aGlzLmltZy5vZmZzZXRMZWZ0IHx8XHJcbiAgICAgIHBhZ2VYID4gKHRoaXMuaW1nLm9mZnNldExlZnQgKyB0aGlzLmltZy53aWR0aCkgfHxcclxuICAgICAgcGFnZVkgPCB0aGlzLmltZy5vZmZzZXRUb3AgfHxcclxuICAgICAgcGFnZVkgPiAodGhpcy5pbWcub2Zmc2V0VG9wICsgdGhpcy5pbWcuaGVpZ2h0KVxyXG4gICAgKSB7IHJldHVybiBmYWxzZX1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgc2V0TWF4V2lkdGgod2lkdGg6IG51bWJlcikge1xyXG4gICAgdGhpcy5tYXhXaWR0aCA9IHdpZHRoXHJcbiAgfVxyXG5cclxuICBzZXRDb2xvcihjb2xvcjogc3RyaW5nKSB7XHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIHNldCB0b29sIGFzIG1vdXNlIHR5cGVcclxuICAgKiBAcGFyYW0gdG9vbCBNb3VzZVR5cGVcclxuICAgKi9cclxuICBzZXRUb29sKHRvb2w6IE1vdXNlVHlwZSkge1xyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSB0b29sXHJcblxyXG4gICAgaWYgKHRvb2wgPT09IE1vdXNlVHlwZS5QRU4pIHtcclxuICAgICAgdGhpcy5zZXRQZW4oKVxyXG4gICAgfSBlbHNlIGlmICh0b29sID09PSBNb3VzZVR5cGUuRVJBU0VSKSB7XHJcbiAgICAgIHRoaXMuc2V0RXJhc2VyKClcclxuICAgIH0gZWxzZSBpZiAodG9vbCA9IE1vdXNlVHlwZS5NT1NBSUMpIHtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldFBlbigpIHtcclxuICAgIGlmICh0aGlzLm1vdXNlKSB7XHJcbiAgICAgIChPYmplY3QgYXMgYW55KS5hc3NpZ24odGhpcy5tb3VzZS5zdHlsZSwge1xyXG4gICAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxyXG4gICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke1Bob3RvQ292ZXIuREVGQVVMVF9QRU5fQk9SREVSX0NPTE9SfWBcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IE1vdXNlVHlwZS5QRU5cclxuICB9XHJcblxyXG4gIHNldEVyYXNlcigpIHtcclxuICAgIGlmICh0aGlzLm1vdXNlKSB7XHJcbiAgICAgIChPYmplY3QgYXMgYW55KS5hc3NpZ24odGhpcy5tb3VzZS5zdHlsZSwge1xyXG4gICAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxyXG4gICAgICAgIGJvcmRlcjogYDFweCBkYXNoZWQgJHtQaG90b0NvdmVyLkRFRkFVTFRfRVJBU0VSX0JPUkRFUl9DT0xPUn1gXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5tb3VzZVR5cGUgPSBNb3VzZVR5cGUuRVJBU0VSXHJcbiAgfVxyXG5cclxuICBzZXRNb3NhaWMoKSB7XHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IE1vdXNlVHlwZS5NT1NBSUNcclxuICB9XHJcblxyXG4gIHVuZG8oKSB7XHJcbiAgICBsZXQgY3R4ID0gdGhpcy5jdHhcclxuICAgIGxldCBjb2xvciA9IHRoaXMuY29sb3JcclxuXHJcbiAgICBjdHguc2F2ZSgpXHJcblxyXG4gICAgLy8gY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG4gICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodClcclxuICAgIHRoaXMuaGlzdG9yaWVzLnBvcCgpXHJcbiAgICB0aGlzLmltZy5kaXNwYXRjaEV2ZW50KHRoaXMuaGlzdG9yeUNoYW5nZSlcclxuXHJcbiAgICB0aGlzLmhpc3Rvcmllcy5tYXAoKHN0ZXBzOiBBcnJheTxhbnk+KSA9PiB7XHJcbiAgICAgIHN0ZXBzLm1hcCgoc3RlcDogQXJyYXk8YW55PikgPT4ge1xyXG4gICAgICAgIGlmIChzdGVwWzBdID09PSBNb3VzZVR5cGUuUEVOKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbG9yID0gc3RlcFsxXVxyXG4gICAgICAgICAgdGhpcy5zZXRSYWRpdXMoc3RlcFs0XSlcclxuICAgICAgICAgIHRoaXMuZHJhd0xpbmUoc3RlcFsyXSwgc3RlcFszXSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICAgIHRoaXMuc2V0UmFkaXVzKHN0ZXBbM10pXHJcbiAgICAgICAgICB0aGlzLmVyYXNlKHN0ZXBbMV0sIHN0ZXBbMl0pXHJcbiAgICAgICAgICB0aGlzLmNvbWJpbmVXaXRoQmFja2dyb3VuZCgpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSAnTU9WRV9UTycpIHtcclxuICAgICAgICAgIGN0eC5iZWdpblBhdGgoKVxyXG4gICAgICAgICAgY3R4Lm1vdmVUby5hcHBseShjdHgsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBsZXQgaW1hZ2VEYXRhID0gdGhpcy5jdHguZ2V0SW1hZ2VEYXRhKHN0ZXBbMV0sIHN0ZXBbMl0sIHN0ZXBbM10sIHN0ZXBbNF0pXHJcbiAgICAgICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEodGhpcy5tb3NhaWMoaW1hZ2VEYXRhKSwgc3RlcFsxXSwgc3RlcFsyXSwgMCwgMCwgc3RlcFszXSwgc3RlcFs0XSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gICAgY3R4LnJlc3RvcmUoKVxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCBpbWFnZSBvcmlnaW4gc2l6ZVxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICBzcmMgICAgICBpYW1nZSBzb3VyY2UgdXJsXHJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrIGZ1bmN0aW9uLCB3aWR0aCBhcyBmaXJzdCBwYXJhbWV0ZXIgYW5kIGhlaWdodCBhcyBzZWNvbmRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYzogc3RyaW5nLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKClcclxuXHJcbiAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBsZXQgd2lkdGggPSBpbWcud2lkdGhcclxuICAgICAgbGV0IGhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB9XHJcblxyXG4gICAgaW1nLnNyYyA9IHNyY1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YVVSTCh0eXBlID0gJ2ltYWdlL2pwZWcnLCBxdWFsaXR5ID0gMC44LCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICB0aGlzLmNvbWJpbmVXaXRoQmFja2dyb3VuZCgoY2FudmFzOiBhbnkpID0+IHtcclxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soY2FudmFzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSlcclxuICAgIH0pXHJcblxyXG4gICAgLy8gbGV0IHNyYyA9IHRoaXMuaW1nLnNyY1xyXG5cclxuICAgIC8vIHRoaXMuZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiB7XHJcbiAgICAvLyAgIGxldCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgIC8vICAgdGVtcENhbnZhcy53aWR0aCA9IHdpZHRoXHJcbiAgICAvLyAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICAvLyAgIGxldCB0ZW1wQ3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAvLyAgIGlmICh0ZW1wQ3R4KSB7XHJcbiAgICAvLyAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAvLyAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgLy8gICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHRlbXBDYW52YXMudG9EYXRhVVJMKHR5cGUsIHF1YWxpdHkpKVxyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9KVxyXG4gIH1cclxuXHJcblxyXG4gIGNvbWJpbmVXaXRoQmFja2dyb3VuZChjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICBjb25zdCBkb2MgPSB0aGlzLmRvY1xyXG4gICAgbGV0IGNhbnZhcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGhcclxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHRcclxuXHJcbiAgICBsZXQgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuXHJcbiAgICBpZiAoIWN0eCkgeyByZXR1cm4gfVxyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuXHJcbiAgICB0aGlzLmN0eC5kcmF3SW1hZ2UoY2FudmFzLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soY2FudmFzLCBjdHgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZW1vdmUgZG9tIHRoYXQgYWRkZWQgaW50byBib2R5LFxyXG4gICAqIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgcmVnaXN0ZXJlZFxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICYmIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpXHJcbiAgICB0aGlzLm1vdXNlLnBhcmVudE5vZGUgJiYgdGhpcy5tb3VzZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubW91c2UpXHJcblxyXG4gICAgdGhpcy5pbWcuc3JjID0gJydcclxuXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICB2WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIodlsxXSwgdlsyXSwgZmFsc2UpXHJcbiAgICB9KVxyXG4gICAgLy8gZGVsZXRlIHRoaXNcclxuICB9XHJcbn1cclxuIl19
