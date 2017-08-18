var MouseType;
(function (MouseType) {
    MouseType[MouseType["GRAFFITI"] = 0] = "GRAFFITI";
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
        this.mouseType = MouseType.GRAFFITI; // default mouse pointer
        this.radius = PhotoCover.DEFAULT_RADIUS; // default radius of graffiti
        this.resolution = PhotoCover.DEFAULT_RESOLUTION; // default resolution of mosaic
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
            // e.preventDefault()    // preventDefault would avoid input range click
            startX = e.pageX;
            startY = e.pageY;
            var _a = _this.getCoordinateByEvent(e), x = _a[0], y = _a[1];
            currentOperate = [];
            if (_this.isOnCanvas(e.pageX, e.pageY)) {
                mouseDownOnCanvas = true;
                if (_this.mouseType === MouseType.GRAFFITI || _this.mouseType === MouseType.ERASER) {
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
            if (_this.mouseType === MouseType.GRAFFITI || _this.mouseType === MouseType.ERASER) {
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
                if (_this.mouseType === MouseType.GRAFFITI || _this.mouseType === MouseType.ERASER) {
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
        if (radius < 1 || radius > 100) {
            return;
        }
        this.radius = radius;
        var mouse = this.mouse;
        if (mouse) {
            mouse.style.width = radius * 2 + 'px';
            mouse.style.height = radius * 2 + 'px';
        }
    };
    PhotoCover.prototype.setResolution = function (resolution) {
        if (resolution < 2 || resolution > 100) {
            return;
        }
        this.resolution = resolution;
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
        return [MouseType.GRAFFITI, this.color, x, y, this.radius];
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
            resolution: this.resolution
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
        if (this.mouseType === MouseType.GRAFFITI) {
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
        if (tool === MouseType.GRAFFITI) {
            this.setGraffiti();
        }
        else if (tool === MouseType.ERASER) {
            this.setEraser();
        }
        else if (tool = MouseType.MOSAIC) {
        }
    };
    PhotoCover.prototype.setGraffiti = function () {
        if (this.mouse) {
            Object.assign(this.mouse.style, {
                borderRadius: '100%',
                border: "1px solid " + PhotoCover.DEFAULT_GRAFFITI_BORDER_COLOR
            });
        }
        this.mouseType = MouseType.GRAFFITI;
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
                if (step[0] === MouseType.GRAFFITI) {
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
    PhotoCover.DEFAULT_RESOLUTION = 8;
    PhotoCover.DEFAULT_MAX_WIDTH = 800;
    PhotoCover.DEFAULT_COLOR = 'black';
    PhotoCover.DEFAULT_GRAFFITI_BORDER_COLOR = 'red';
    PhotoCover.DEFAULT_ERASER_BORDER_COLOR = '#666';
    PhotoCover.DEFAULT_LINECAP = 'round';
    PhotoCover.DEFAULT_LINEJOIN = 'round';
    return PhotoCover;
}());

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Q0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUE7UUFDaEMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtRQUVsQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQTtRQUFDLENBQUM7UUFFcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFN0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RSxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsNEJBQU8sR0FBUDtRQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDekUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV0RSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUE7UUFFakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsY0FBYztJQUNoQixDQUFDO0lBcGlCTSx5QkFBYyxHQUFVLEVBQUUsQ0FBQTtJQUMxQiw2QkFBa0IsR0FBVSxDQUFDLENBQUE7SUFDN0IsNEJBQWlCLEdBQVUsR0FBRyxDQUFBO0lBQzlCLHdCQUFhLEdBQVcsT0FBTyxDQUFBO0lBQy9CLHdDQUE2QixHQUFXLEtBQUssQ0FBQTtJQUM3QyxzQ0FBMkIsR0FBVSxNQUFNLENBQUE7SUFDM0MsMEJBQWUsR0FBVyxPQUFPLENBQUE7SUFDakMsMkJBQWdCLEdBQVcsT0FBTyxDQUFBO0lBOGhCM0MsaUJBQUM7Q0F0aUJELEFBc2lCQyxJQUFBIiwiZmlsZSI6InBob3RvY292ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJlbnVtIE1vdXNlVHlwZSB7IEdSQUZGSVRJLCBFUkFTRVIsIE1PU0FJQyB9XHJcblxyXG5pbnRlcmZhY2UgUmVjdCB7XHJcbiAgbGVmdDogbnVtYmVyO1xyXG4gIHRvcDogbnVtYmVyO1xyXG4gIHdpZHRoOiBudW1iZXI7XHJcbiAgaGVpZ2h0OiBudW1iZXI7XHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIHN0YXRpYyBERUZBVUxUX1JBRElVUzpudW1iZXIgPSAyMFxyXG4gIHN0YXRpYyBERUZBVUxUX1JFU09MVVRJT046bnVtYmVyID0gOFxyXG4gIHN0YXRpYyBERUZBVUxUX01BWF9XSURUSDpudW1iZXIgPSA4MDBcclxuICBzdGF0aWMgREVGQVVMVF9DT0xPUjogc3RyaW5nID0gJ2JsYWNrJ1xyXG4gIHN0YXRpYyBERUZBVUxUX0dSQUZGSVRJX0JPUkRFUl9DT0xPUjogc3RyaW5nID0gJ3JlZCdcclxuICBzdGF0aWMgREVGQVVMVF9FUkFTRVJfQk9SREVSX0NPTE9SOnN0cmluZyA9ICcjNjY2J1xyXG4gIHN0YXRpYyBERUZBVUxUX0xJTkVDQVA6IHN0cmluZyA9ICdyb3VuZCdcclxuICBzdGF0aWMgREVGQVVMVF9MSU5FSk9JTjogc3RyaW5nID0gJ3JvdW5kJ1xyXG5cclxuICByZWFkb25seSBpc01vYmlsZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignaVBob25lJykgPiAtMSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSA+IC0xXHJcblxyXG4gIC8vIGNhY2hlIHdpbmRvdywgZG9jdW1lbnQgYW5kIGJvZHkgZm9yIHNwZWVkIHVwIHBlcmZvcm1hbmNlXHJcbiAgd2luOiBXaW5kb3cgPSB3aW5kb3dcclxuICBkb2M6IEhUTUxEb2N1bWVudCA9IGRvY3VtZW50XHJcbiAgYm9keTogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5ib2R5XHJcblxyXG4gIG1vdXNlOiBIVE1MRGl2RWxlbWVudCAgIC8vIG1vdXNlIHBvaW50ZXIgb24gY2FudmFzXHJcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgaW1nOiBIVE1MSW1hZ2VFbGVtZW50ICAvLyBpbWFnZSB0aGF0IHlvdSB3YW50IHRvIGNoYW5nZSBcclxuXHJcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpIGFzIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxyXG5cclxuICAvLyBpbml0IHZhbHVlXHJcbiAgbW91c2VUeXBlOiBNb3VzZVR5cGUgPSBNb3VzZVR5cGUuR1JBRkZJVEkvLyBkZWZhdWx0IG1vdXNlIHBvaW50ZXJcclxuICByYWRpdXMgPSAgUGhvdG9Db3Zlci5ERUZBVUxUX1JBRElVUyAgICAvLyBkZWZhdWx0IHJhZGl1cyBvZiBncmFmZml0aVxyXG4gIHJlc29sdXRpb24gPSBQaG90b0NvdmVyLkRFRkFVTFRfUkVTT0xVVElPTiAgIC8vIGRlZmF1bHQgcmVzb2x1dGlvbiBvZiBtb3NhaWNcclxuICBtYXhXaWR0aCA9IFBob3RvQ292ZXIuREVGQVVMVF9NQVhfV0lEVEggICAgIC8vIGRlZmF1bHQgbWF4IHdpZHRoIG9mIGltYWdlXHJcbiAgY29sb3IgPSBQaG90b0NvdmVyLkRFRkFVTFRfQ09MT1IgICAgLy8gZGVmYXVsdCBjb2xvciBvZiBjYW52YXNcclxuICBsaW5lQ2FwID0gUGhvdG9Db3Zlci5ERUZBVUxUX0xJTkVDQVAgICAgLy8gZGVmYXVsdCBsaW5lY2FwIG9mIGxpbmUgb24gY2FudmFzXHJcbiAgbGluZUpvaW4gPSBQaG90b0NvdmVyLkRFRkFVTFRfTElORUpPSU4gLy8gZGVmYXVsdCBsaW5lSm9pbiBvZiBsaW5lIG9uIGNhbnZhc1xyXG5cclxuICBoaXN0b3JpZXM6IGFueVtdW10gPSBbXSAgICAvLyBvcGVyYXRlIGhpc3RvcnlcclxuICBiaW5kZWRFdmVudHM6IGFueVtdW10gPSBbXSAgICAvLyByZWdpc3RlcmVkIGV2ZW50cyBbbm9kZSwgdHlwZSwgZnVuY3Rpb25dXHJcbiAgaGlzdG9yeUNoYW5nZTogRXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ2hpc3RvcnlDaGFuZ2UnLCB7IGRldGFpbDogdGhpcy5oaXN0b3JpZXMgfSlcclxuXHJcbiAgY29uc3RydWN0b3Ioc2VsZWN0b3I6IEhUTUxJbWFnZUVsZW1lbnQgfCBzdHJpbmcpIHtcclxuXHJcbiAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0JykgeyB0aGlzLmltZyA9IHNlbGVjdG9yIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHsgdGhpcy5pbWcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSBhcyBIVE1MSW1hZ2VFbGVtZW50IH1cclxuICAgIFxyXG4gICAgLy8gaW5pdGlhbCBjYW52YXMgYW5kIGl0cyBzaXplIGFuZCBwb3NpdGlvblxyXG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmltZy53aWR0aFxyXG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5pbWcuaGVpZ2h0XHJcblxyXG4gICAgdGhpcy5pbml0KClcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcclxuXHJcbiAgICBsZXQgW2JvZHksIHdpbiwgZG9jXSA9IFt0aGlzLmJvZHksIHRoaXMud2luLCB0aGlzLmRvY11cclxuXHJcbiAgICB0aGlzLmFzeW5jKClcclxuICAgIGJvZHkuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpXHJcblxyXG4gICAgaWYgKCF0aGlzLmlzTW9iaWxlKSB7IHRoaXMuaW5pdE1vdXNlKCkgfVxyXG5cclxuICAgIC8vIGFzeW5jIGNhbnZhcyBwb3NpdGlvbiBhbmQgc2l6ZSBkdXJpbmcgYnJvd3NlciByZXNpemVcclxuICAgIGxldCByZXNpemUgPSAoKCkgPT4ge1xyXG4gICAgICB0aGlzLmFzeW5jKClcclxuICAgIH0pLmJpbmQodGhpcylcclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUsIGZhbHNlKVxyXG4gICAgdGhpcy5iaW5kZWRFdmVudHMucHVzaChbd2luLCAncmVzaXplJywgcmVzaXplXSlcclxuXHJcblxyXG4gICAgLy8gdGhpcy5pbWcuc3R5bGUuY3NzVGV4dCA9IGBvcGFjaXR5OiAwLjRgXHJcbiAgICAvLyB0aGlzLmltZy5zdHlsZS5vcGFjaXR5ID0gJzAnXHJcbiAgICB0aGlzLmN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpXHJcblxyXG4gICAgbGV0IGN1cnJlbnRPcGVyYXRlOiBhbnlbXVtdID0gW11cclxuXHJcbiAgICBsZXQgbW91c2VEb3duT25DYW52YXM6IGJvb2xlYW4gPSBmYWxzZVxyXG4gICAgbGV0IG1vc2FpY1NlbGVjdGlvbjogSFRNTERpdkVsZW1lbnRcclxuICAgIGxldCBzdGFydFg6IG51bWJlclxyXG4gICAgbGV0IHN0YXJ0WTogbnVtYmVyXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlRG93biA9ICgoZTogYW55KSA9PiB7XHJcbiAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKSAgICAvLyBwcmV2ZW50RGVmYXVsdCB3b3VsZCBhdm9pZCBpbnB1dCByYW5nZSBjbGlja1xyXG5cclxuICAgICAgc3RhcnRYID0gZS5wYWdlWFxyXG4gICAgICBzdGFydFkgPSBlLnBhZ2VZXHJcbiAgICAgIGNvbnN0IFt4LCB5XSA9IHRoaXMuZ2V0Q29vcmRpbmF0ZUJ5RXZlbnQoZSlcclxuXHJcbiAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuXHJcbiAgICAgIGlmICh0aGlzLmlzT25DYW52YXMoZS5wYWdlWCwgZS5wYWdlWSkpIHtcclxuICAgICAgICBtb3VzZURvd25PbkNhbnZhcyA9IHRydWVcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuR1JBRkZJVEl8fCB0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKClcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2goWydNT1ZFX1RPJywgeCwgeV0pXHJcbiAgICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKClcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2goWydNT1ZFX1RPJywgeCwgeV0pXHJcblxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBtb3NhaWNTZWxlY3Rpb24gPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgIGxlZnQ6ICR7c3RhcnRYfXB4O1xyXG4gICAgICAgICAgICB0b3A6ICR7c3RhcnRZfXB4O1xyXG4gICAgICAgICAgICB3aWR0aDogMDtcclxuICAgICAgICAgICAgaGVpZ2h0OiAwO1xyXG4gICAgICAgICAgICBib3JkZXI6IDFweCBkYXNoZWQgI2RkZDtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMjUsIDEyNSwgMTI1LCAwLjUpXHJcblxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtb3NhaWNTZWxlY3Rpb24pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkdSQUZGSVRJIHx8IHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuRVJBU0VSKSB7XHJcbiAgICAgICAgY3VycmVudE9wZXJhdGUucHVzaCh0aGlzLmRyYXdCeUV2ZW50KGUpKVxyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgbGV0IHJlY3QgPSB0aGlzLmxpbWl0UmVjdCh0aGlzLmNhY3VsYXRlUmVjdChzdGFydFgsIHN0YXJ0WSwgZS5wYWdlWCwgZS5wYWdlWSkpXHJcblxyXG4gICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS5sZWZ0ID0gcmVjdC5sZWZ0IC0gMSArICdweCdcclxuICAgICAgICBtb3NhaWNTZWxlY3Rpb24uc3R5bGUudG9wID0gcmVjdC50b3AgLSAxICsgJ3B4J1xyXG4gICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS53aWR0aCA9IHJlY3Qud2lkdGggKyAncHgnXHJcbiAgICAgICAgbW9zYWljU2VsZWN0aW9uLnN0eWxlLmhlaWdodCA9IHJlY3QuaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgbGV0IGNhbnZhc01vdXNlVXAgPSAoKGU6IGFueSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5pc01vYmlsZSA/ICd0b3VjaG1vdmUnOiAnbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgXHJcbiAgICAgIGlmIChtb3VzZURvd25PbkNhbnZhcykge1xyXG4gICAgICAgIG1vdXNlRG93bk9uQ2FudmFzICA9IGZhbHNlXHJcbiAgICAgICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuR1JBRkZJVEkgfHwgdGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICAgIHRoaXMuaGlzdG9yaWVzLnB1c2goY3VycmVudE9wZXJhdGUpXHJcbiAgICAgICAgICB0aGlzLmltZy5kaXNwYXRjaEV2ZW50KHRoaXMuaGlzdG9yeUNoYW5nZSlcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBsZXQgcmVjdCA9IHRoaXMubGltaXRSZWN0KHRoaXMuY2FjdWxhdGVSZWN0KHN0YXJ0WCwgc3RhcnRZLCBlLnBhZ2VYLCBlLnBhZ2VZKSlcclxuICAgICAgICAgIGxldCBbeCwgeV0gPSBbcmVjdC5sZWZ0IC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCwgcmVjdC50b3AgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BdIC8vIGNvb2RpbmF0ZSByZWxhdGl2ZSBjYW52YXNcclxuXHJcbiAgICAgICAgICBpZiAocmVjdC53aWR0aCA+IDAgJiYgcmVjdC5oZWlnaHQgPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZURhdGEgPSB0aGlzLmN0eC5nZXRJbWFnZURhdGEoeCwgeSwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQpXHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YSh0aGlzLm1vc2FpYyhpbWFnZURhdGEpLCB4LCB5LCAwLCAwLCByZWN0LndpZHRoLCByZWN0LmhlaWdodClcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yaWVzLnB1c2goW1tNb3VzZVR5cGUuTU9TQUlDLCB4LCB5LCByZWN0LndpZHRoLCByZWN0LmhlaWdodF1dKVxyXG4gICAgICAgICAgICB0aGlzLmltZy5kaXNwYXRjaEV2ZW50KHRoaXMuaGlzdG9yeUNoYW5nZSlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBib2R5LnJlbW92ZUNoaWxkKG1vc2FpY1NlbGVjdGlvbilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgICAgdGhpcy5jb21iaW5lV2l0aEJhY2tncm91bmQoKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIC8vIGNhbnZhcyBkb3duXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNoc3RhcnQnOiAnbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duLCBmYWxzZSlcclxuICAgIHRoaXMuYmluZGVkRXZlbnRzLnB1c2goW3dpbiwgdGhpcy5pc01vYmlsZSA/ICd0b3VjaHN0YXJ0JzogJ21vdXNlZG93bicsIGNhbnZhc01vdXNlRG93bl0pXHJcblxyXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5pc01vYmlsZSA/ICd0b3VjaGVuZCc6ICdtb3VzZXVwJywgY2FudmFzTW91c2VVcCwgZmFsc2UpXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5wdXNoKFt3aW4sIHRoaXMuaXNNb2JpbGUgPyAndG91Y2hlbmQnOiAnbW91c2V1cCcsIGNhbnZhc01vdXNlVXBdKVxyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgeCBhbmQgeSBmcm9tIGltYWdlIHRvIGNhbnZhc1xyXG4gIHByaXZhdGUgYXN5bmMoKSB7XHJcbiAgICB0aGlzLmNhbnZhcy5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6ICR7dGhpcy5pbWcub2Zmc2V0TGVmdH1weDtcclxuICAgICAgdG9wOiAke3RoaXMuaW1nLm9mZnNldFRvcH1weDtcclxuICAgICAgdXNlLXNlbGVjdDogbm9uZTtcclxuICAgIGBcclxuICB9XHJcblxyXG4gIC8vIGluaXRpYWwgbW91c2Ugc2hhcGUgd2hlcmUgbW91c2Ugb24gY2FudmFzXHJcbiAgcHJpdmF0ZSBpbml0TW91c2UoKSB7XHJcbiAgICBsZXQgW2JvZHksIHdpbl0gPSBbdGhpcy5ib2R5LCB0aGlzLndpbl1cclxuICAgIGxldCBtb3VzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXHJcbiAgICBtb3VzZS5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICBkaXNwbGF5OiBub25lO1xyXG4gICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgIGxlZnQ6IDA7XHJcbiAgICAgIHRvcDogMDtcclxuICAgICAgei1pbmRleDogMTAwMDE7XHJcbiAgICAgIHdpZHRoOiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgaGVpZ2h0OiAke3RoaXMucmFkaXVzICogMn1weDtcclxuICAgICAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xyXG4gICAgICBib3JkZXItcmFkaXVzOiAxMDAlO1xyXG4gICAgYFxyXG4gICAgdGhpcy5tb3VzZSA9IG1vdXNlXHJcblxyXG4gICAgYm9keS5hcHBlbmRDaGlsZChtb3VzZSlcclxuXHJcbiAgICBsZXQgbW91c2VNb3ZlID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgbGV0IFt4LCB5XSA9IFtlLnBhZ2VYLCBlLnBhZ2VZXVxyXG4gICAgICBsZXQgaXNPbkNhbnZhcyA9IHRoaXMuaXNPbkNhbnZhcyh4LCB5KVxyXG5cclxuICAgICAgbW91c2Uuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3ggLSB0aGlzLnJhZGl1cyAtIDF9cHgsICR7eSAtIHRoaXMucmFkaXVzIC0gMX1weClgIC8vIG1pbnVzIGJvcmRlciB3aWR0aCBvZiBtb3VzZSB0eXBlXHJcblxyXG4gICAgICBpZiAoIWlzT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCdcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5NT1NBSUMpIHtcclxuICAgICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcidcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgIGJvZHkuc3R5bGUuY3Vyc29yID0gJ25vbmUnXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2hhbmdlIG1vdXNlIHN0eWxlXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZSc6ICdtb3VzZW1vdmUnLCBtb3VzZU1vdmUsIGZhbHNlKVxyXG4gICAgdGhpcy5iaW5kZWRFdmVudHMucHVzaChbd2luLCB0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZSc6ICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVdKVxyXG4gIH1cclxuXHJcbiAgc2V0UmFkaXVzKHJhZGl1czogbnVtYmVyKSB7XHJcbiAgICBpZiAocmFkaXVzIDwgMSB8fCByYWRpdXMgPiAxMDApIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXNcclxuXHJcbiAgICBsZXQgbW91c2UgPSB0aGlzLm1vdXNlXHJcblxyXG4gICAgaWYgKG1vdXNlKSB7XHJcbiAgICAgIG1vdXNlLnN0eWxlLndpZHRoID0gcmFkaXVzICogMiArICdweCdcclxuICAgICAgbW91c2Uuc3R5bGUuaGVpZ2h0ID0gcmFkaXVzICogMiArICdweCdcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNldFJlc29sdXRpb24ocmVzb2x1dGlvbjogbnVtYmVyKSB7XHJcbiAgICBpZiAocmVzb2x1dGlvbiA8IDIgfHwgcmVzb2x1dGlvbiA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJlc29sdXRpb24gPSByZXNvbHV0aW9uIFxyXG4gIH1cclxuXHJcbiAgem9vbUluKHJhZGl1czpudW1iZXIgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyArIHJhZGl1cylcclxuICB9XHJcblxyXG4gIHpvb21PdXQocmFkaXVzOm51bWJlciA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcblxyXG4gIGxpbmVUbyh4OiBudW1iZXIsIHk6IG51bWJlcik6IHZvaWQge1xyXG4gICAgY29uc3QgY3R4ID0gdGhpcy5jdHhcclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5saW5lQ2FwXHJcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnXHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yXHJcbiAgICBjdHgubGluZVdpZHRoID0gdGhpcy5yYWRpdXMgKiAyXHJcbiAgICBjdHgubGluZVRvKHgsIHkpXHJcbiAgICBjdHguc3Ryb2tlKClcclxuICB9XHJcblxyXG4gIGRyYXdMaW5lKHg6IG51bWJlciwgeTogbnVtYmVyKTogYW55W10ge1xyXG4gICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJ1xyXG4gICAgdGhpcy5saW5lQ2FwID0gJ3JvdW5kJ1xyXG4gICAgdGhpcy5saW5lSm9pbiA9ICdyb3VuZCdcclxuICAgIHRoaXMubGluZVRvKHgsIHkpXHJcbiAgICByZXR1cm4gW01vdXNlVHlwZS5HUkFGRklUSSwgdGhpcy5jb2xvciwgeCwgeSwgdGhpcy5yYWRpdXNdXHJcbiAgfVxyXG5cclxuICBlcmFzZSh4OiBudW1iZXIsIHk6IG51bWJlcik6IGFueVtdIHtcclxuICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdkZXN0aW5hdGlvbi1vdXQnXHJcbiAgICB0aGlzLmxpbmVDYXAgPSAncm91bmQnXHJcbiAgICB0aGlzLmxpbmVKb2luID0gJ3JvdW5kJ1xyXG4gICAgdGhpcy5saW5lVG8oeCwgeSlcclxuICAgIHRoaXMuY3R4Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3ZlcidcclxuICAgIHJldHVybiBbTW91c2VUeXBlLkVSQVNFUiwgeCwgeSwgdGhpcy5yYWRpdXNdXHJcbiAgfVxyXG5cclxuICBtb3NhaWMoaW1hZ2VEYXRhOiBJbWFnZURhdGEpOiBJbWFnZURhdGEge1xyXG4gICAgY29uc3QgW2RvY10gPSBbdGhpcy5kb2NdXHJcblxyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgcmVzb2x1dGlvbjogdGhpcy5yZXNvbHV0aW9uXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNhbnZhcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgbGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcblxyXG4gICAgaWYgKCFjdHgpIHsgcmV0dXJuIG5ldyBJbWFnZURhdGEoMCwgMCl9XHJcblxyXG4gICAgY2FudmFzLndpZHRoID0gaW1hZ2VEYXRhLndpZHRoXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodFxyXG4gICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApXHJcblxyXG4gICAgbGV0IHJvd3MgPSBjYW52YXMuaGVpZ2h0IC8gb3B0aW9ucy5yZXNvbHV0aW9uXHJcbiAgICBsZXQgY29scyA9IGNhbnZhcy53aWR0aCAvIG9wdGlvbnMucmVzb2x1dGlvblxyXG4gICAgbGV0IHIsIGcsIGIsIGFcclxuXHJcbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCByb3dzOyByb3crKykge1xyXG4gICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCBjb2xzOyBjb2wrKykge1xyXG5cclxuICAgICAgICAvLyBsZXQgdGVtcERhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbiwgcm93ICogb3B0aW9ucy5yZXNvbHV0aW9uLCAxLCAxKS5kYXRhXHJcbiAgICAgICAgLy8gciA9IHRlbXBEYXRhWzBdXHJcbiAgICAgICAgLy8gZyA9IHRlbXBEYXRhWzFdXHJcbiAgICAgICAgLy8gZyA9IHRlbXBEYXRhWzJdXHJcbiAgICAgICAgLy8gYSA9IHRlbXBkYXRhWzNdIC8gMjU1XHJcblxyXG4gICAgICAgIHIgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAwXVxyXG4gICAgICAgIGcgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAxXVxyXG4gICAgICAgIGIgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAyXVxyXG4gICAgICAgIGEgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAzXVxyXG5cclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgXHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbiwgcm93ICogb3B0aW9ucy5yZXNvbHV0aW9uLCBvcHRpb25zLnJlc29sdXRpb24sIG9wdGlvbnMucmVzb2x1dGlvbilcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuICB9XHJcblxyXG4gIGRyYXdCeUV2ZW50KGV2ZW50OiBhbnkpOiBhbnlbXSB7XHJcbiAgICBsZXQgW3gsIHldID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChldmVudClcclxuXHJcbiAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5HUkFGRklUSSkgeyByZXR1cm4gdGhpcy5kcmF3TGluZSh4LCB5KSB9XHJcbiAgICBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikgeyByZXR1cm4gdGhpcy5lcmFzZSh4LCB5KSB9XHJcbiAgICBlbHNlIHsgcmV0dXJuIFtdIH1cclxuICB9XHJcblxyXG4gIGdldENvb3JkaW5hdGVCeUV2ZW50KGV2ZW50OiBhbnkpIHtcclxuICAgIGxldCB4LCB5XHJcbiAgICBpZiAodGhpcy5pc01vYmlsZSkgeyBldmVudCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdIH1cclxuXHJcbiAgICB4ID0gZXZlbnQucGFnZVggLSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICB5ID0gZXZlbnQucGFnZVkgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BcclxuXHJcbiAgICByZXR1cm4gW3gsIHldXHJcbiAgfVxyXG5cclxuICBsaW1pdFJlY3QocmVjdDogUmVjdCk6IFJlY3Qge1xyXG4gICAgbGV0IG5ld1JlY3QgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJlY3QpKVxyXG5cclxuICAgIGlmIChyZWN0LmxlZnQgPCB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0KSB7XHJcbiAgICAgIG5ld1JlY3Qud2lkdGggPSByZWN0LmxlZnQgKyByZWN0LndpZHRoIC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdFxyXG4gICAgICBuZXdSZWN0LmxlZnQgPSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlY3QudG9wIDwgdGhpcy5jYW52YXMub2Zmc2V0VG9wKSB7XHJcbiAgICAgIG5ld1JlY3QuaGVpZ2h0ID0gcmVjdC50b3AgKyByZWN0LmhlaWdodCAtIHRoaXMuY2FudmFzLm9mZnNldFRvcFxyXG4gICAgICBuZXdSZWN0LnRvcCA9IHRoaXMuY2FudmFzLm9mZnNldFRvcFxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZWN0LmxlZnQgKyByZWN0LndpZHRoID4gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCArIHRoaXMuY2FudmFzLmNsaWVudFdpZHRoKSB7XHJcbiAgICAgIG5ld1JlY3Qud2lkdGggPSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0ICsgdGhpcy5jYW52YXMuY2xpZW50V2lkdGggLSByZWN0LmxlZnRcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVjdC50b3AgKyByZWN0LmhlaWdodCA+IHRoaXMuY2FudmFzLm9mZnNldFRvcCArIHRoaXMuY2FudmFzLmNsaWVudEhlaWdodCkge1xyXG4gICAgICBuZXdSZWN0LmhlaWdodCA9IHRoaXMuY2FudmFzLm9mZnNldFRvcCArIHRoaXMuY2FudmFzLmNsaWVudEhlaWdodCAtIHJlY3QudG9wXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ld1JlY3RcclxuICB9XHJcblxyXG4gIGNhY3VsYXRlUmVjdChzdGFydFg6IG51bWJlciwgc3RhcnRZOiBudW1iZXIsIGVuZFg6IG51bWJlciwgZW5kWTogbnVtYmVyKTogUmVjdCB7XHJcbiAgICBsZXQgW3csIGhdID0gW2VuZFggLSBzdGFydFgsIGVuZFkgLSBzdGFydFldXHJcblxyXG4gICAgbGV0IGxlZnQgPSB3IDwgMCA/IHN0YXJ0WCAtIE1hdGguYWJzKHcpOiAgc3RhcnRYXHJcbiAgICBsZXQgdG9wID0gaCA8IDAgPyBzdGFydFkgLSBNYXRoLmFicyhoKTogc3RhcnRZXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbGVmdDogbGVmdCxcclxuICAgICAgdG9wOiB0b3AsXHJcbiAgICAgIHdpZHRoOiBNYXRoLmFicyh3KSxcclxuICAgICAgaGVpZ2h0OiBNYXRoLmFicyhoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaXNPbkNhbnZhcyhwYWdlWDogbnVtYmVyLCBwYWdlWTogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoXHJcbiAgICAgIHBhZ2VYIDwgdGhpcy5pbWcub2Zmc2V0TGVmdCB8fFxyXG4gICAgICBwYWdlWCA+ICh0aGlzLmltZy5vZmZzZXRMZWZ0ICsgdGhpcy5pbWcud2lkdGgpIHx8XHJcbiAgICAgIHBhZ2VZIDwgdGhpcy5pbWcub2Zmc2V0VG9wIHx8XHJcbiAgICAgIHBhZ2VZID4gKHRoaXMuaW1nLm9mZnNldFRvcCArIHRoaXMuaW1nLmhlaWdodClcclxuICAgICkgeyByZXR1cm4gZmFsc2V9XHJcblxyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcblxyXG4gIHNldE1heFdpZHRoKHdpZHRoOiBudW1iZXIpIHtcclxuICAgIHRoaXMubWF4V2lkdGggPSB3aWR0aFxyXG4gIH1cclxuXHJcbiAgc2V0Q29sb3IoY29sb3I6IHN0cmluZykge1xyXG4gICAgdGhpcy5jb2xvciA9IGNvbG9yXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBzZXQgdG9vbCBhcyBtb3VzZSB0eXBlXHJcbiAgICogQHBhcmFtIHRvb2wgTW91c2VUeXBlXHJcbiAgICovXHJcbiAgc2V0VG9vbCh0b29sOiBNb3VzZVR5cGUpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gdG9vbFxyXG5cclxuICAgIGlmICh0b29sID09PSBNb3VzZVR5cGUuR1JBRkZJVEkpIHtcclxuICAgICAgdGhpcy5zZXRHcmFmZml0aSgpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgdGhpcy5zZXRFcmFzZXIoKVxyXG4gICAgfSBlbHNlIGlmICh0b29sID0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0R3JhZmZpdGkoKSB7XHJcbiAgICBpZiAodGhpcy5tb3VzZSkge1xyXG4gICAgICAoT2JqZWN0IGFzIGFueSkuYXNzaWduKHRoaXMubW91c2Uuc3R5bGUsIHtcclxuICAgICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcclxuICAgICAgICBib3JkZXI6IGAxcHggc29saWQgJHtQaG90b0NvdmVyLkRFRkFVTFRfR1JBRkZJVElfQk9SREVSX0NPTE9SfWBcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IE1vdXNlVHlwZS5HUkFGRklUSVxyXG4gIH1cclxuXHJcbiAgc2V0RXJhc2VyKCkge1xyXG4gICAgaWYgKHRoaXMubW91c2UpIHtcclxuICAgICAgKE9iamVjdCBhcyBhbnkpLmFzc2lnbih0aGlzLm1vdXNlLnN0eWxlLCB7XHJcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke1Bob3RvQ292ZXIuREVGQVVMVF9FUkFTRVJfQk9SREVSX0NPTE9SfWBcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IE1vdXNlVHlwZS5FUkFTRVJcclxuICB9XHJcblxyXG4gIHNldE1vc2FpYygpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gTW91c2VUeXBlLk1PU0FJQ1xyXG4gIH1cclxuXHJcbiAgdW5kbygpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IGNvbG9yID0gdGhpcy5jb2xvclxyXG5cclxuICAgIGN0eC5zYXZlKClcclxuXHJcbiAgICAvLyBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG4gICAgdGhpcy5oaXN0b3JpZXMucG9wKClcclxuICAgIHRoaXMuaW1nLmRpc3BhdGNoRXZlbnQodGhpcy5oaXN0b3J5Q2hhbmdlKVxyXG5cclxuICAgIHRoaXMuaGlzdG9yaWVzLm1hcCgoc3RlcHM6IEFycmF5PGFueT4pID0+IHtcclxuICAgICAgc3RlcHMubWFwKChzdGVwOiBBcnJheTxhbnk+KSA9PiB7XHJcbiAgICAgICAgaWYgKHN0ZXBbMF0gPT09IE1vdXNlVHlwZS5HUkFGRklUSSkge1xyXG4gICAgICAgICAgdGhpcy5jb2xvciA9IHN0ZXBbMV1cclxuICAgICAgICAgIHRoaXMuc2V0UmFkaXVzKHN0ZXBbNF0pXHJcbiAgICAgICAgICB0aGlzLmRyYXdMaW5lKHN0ZXBbMl0sIHN0ZXBbM10pXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBNb3VzZVR5cGUuRVJBU0VSKSB7XHJcbiAgICAgICAgICB0aGlzLnNldFJhZGl1cyhzdGVwWzNdKVxyXG4gICAgICAgICAgdGhpcy5lcmFzZShzdGVwWzFdLCBzdGVwWzJdKVxyXG4gICAgICAgICAgdGhpcy5jb21iaW5lV2l0aEJhY2tncm91bmQoKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RlcFswXSA9PT0gJ01PVkVfVE8nKSB7XHJcbiAgICAgICAgICBjdHguYmVnaW5QYXRoKClcclxuICAgICAgICAgIGN0eC5tb3ZlVG8uYXBwbHkoY3R4LCBzdGVwLnNsaWNlKDEpKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RlcFswXSA9PT0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgICAgICAgbGV0IGltYWdlRGF0YSA9IHRoaXMuY3R4LmdldEltYWdlRGF0YShzdGVwWzFdLCBzdGVwWzJdLCBzdGVwWzNdLCBzdGVwWzRdKVxyXG4gICAgICAgICAgdGhpcy5jdHgucHV0SW1hZ2VEYXRhKHRoaXMubW9zYWljKGltYWdlRGF0YSksIHN0ZXBbMV0sIHN0ZXBbMl0sIDAsIDAsIHN0ZXBbM10sIHN0ZXBbNF0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvbG9yID0gY29sb3JcclxuICAgIGN0eC5yZXN0b3JlKClcclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBnZXQgaW1hZ2Ugb3JpZ2luIHNpemVcclxuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgc3JjICAgICAgaWFtZ2Ugc291cmNlIHVybFxyXG4gICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayBmdW5jdGlvbiwgd2lkdGggYXMgZmlyc3QgcGFyYW1ldGVyIGFuZCBoZWlnaHQgYXMgc2Vjb25kXHJcbiAgICogQHJldHVybiB7dW5kZWZpbmVkfVxyXG4gICAqL1xyXG4gIGdldEltYWdlT3JpZ2luU2l6ZShzcmM6IHN0cmluZywgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xyXG4gICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpXHJcblxyXG4gICAgaW1nLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgbGV0IHdpZHRoID0gaW1nLndpZHRoXHJcbiAgICAgIGxldCBoZWlnaHQgPSBpbWcuaGVpZ2h0XHJcblxyXG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayh3aWR0aCwgaGVpZ2h0KVxyXG4gICAgfVxyXG5cclxuICAgIGltZy5zcmMgPSBzcmNcclxuICB9XHJcblxyXG4gIGdldERhdGFVUkwodHlwZSA9ICdpbWFnZS9qcGVnJywgcXVhbGl0eSA9IDAuOCwgY2FsbGJhY2s/OiBGdW5jdGlvbikge1xyXG4gICAgdGhpcy5jb21iaW5lV2l0aEJhY2tncm91bmQoKGNhbnZhczogYW55KSA9PiB7XHJcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGNhbnZhcy50b0RhdGFVUkwodHlwZSwgcXVhbGl0eSkpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vIGxldCBzcmMgPSB0aGlzLmltZy5zcmNcclxuXHJcbiAgICAvLyB0aGlzLmdldEltYWdlT3JpZ2luU2l6ZShzcmMsICh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikgPT4ge1xyXG4gICAgLy8gICBsZXQgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAvLyAgIHRlbXBDYW52YXMud2lkdGggPSB3aWR0aFxyXG4gICAgLy8gICB0ZW1wQ2FudmFzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgLy8gICBsZXQgdGVtcEN0eCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKVxyXG4gICAgLy8gICBpZiAodGVtcEN0eCkge1xyXG4gICAgLy8gICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KVxyXG4gICAgLy8gICAgIHRlbXBDdHguZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgIC8vICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayh0ZW1wQ2FudmFzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSlcclxuICAgIC8vICAgfVxyXG4gICAgLy8gfSlcclxuICB9XHJcblxyXG5cclxuICBjb21iaW5lV2l0aEJhY2tncm91bmQoY2FsbGJhY2s/OiBGdW5jdGlvbikge1xyXG4gICAgY29uc3QgZG9jID0gdGhpcy5kb2NcclxuICAgIGxldCBjYW52YXMgPSBkb2MuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgIGNhbnZhcy53aWR0aCA9IHRoaXMuY2FudmFzLndpZHRoXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5jYW52YXMuaGVpZ2h0XHJcblxyXG4gICAgbGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcblxyXG4gICAgaWYgKCFjdHgpIHsgcmV0dXJuIH1cclxuXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuY2FudmFzLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpXHJcblxyXG4gICAgdGhpcy5jdHguZHJhd0ltYWdlKGNhbnZhcywgMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodClcclxuICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGNhbnZhcywgY3R4KVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogcmVtb3ZlIGRvbSB0aGF0IGFkZGVkIGludG8gYm9keSxcclxuICAgKiByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IHJlZ2lzdGVyZWRcclxuICAgKi9cclxuICBkZXN0cm95KCkge1xyXG4gICAgdGhpcy5jYW52YXMucGFyZW50Tm9kZSAmJiB0aGlzLmNhbnZhcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY2FudmFzKVxyXG4gICAgdGhpcy5tb3VzZS5wYXJlbnROb2RlICYmIHRoaXMubW91c2UucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLm1vdXNlKVxyXG5cclxuICAgIHRoaXMuaW1nLnNyYyA9ICcnXHJcblxyXG4gICAgdGhpcy5iaW5kZWRFdmVudHMuZm9yRWFjaCh2ID0+IHtcclxuICAgICAgdlswXS5yZW1vdmVFdmVudExpc3RlbmVyKHZbMV0sIHZbMl0sIGZhbHNlKVxyXG4gICAgfSlcclxuICAgIC8vIGRlbGV0ZSB0aGlzXHJcbiAgfVxyXG59XHJcbiJdfQ==
