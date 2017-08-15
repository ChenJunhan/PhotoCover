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
                    currentOperate = [];
                }
                else if (_this.mouseType === MouseType.MOSAIC) {
                    var rect = _this.limitRect(_this.caculateRect(startX, startY, e.pageX, e.pageY));
                    var _a = [rect.left - _this.canvas.offsetLeft, rect.top - _this.canvas.offsetTop], x = _a[0], y = _a[1]; // coodinate relative canvas
                    if (rect.width > 0 && rect.height > 0) {
                        var imageData = _this.ctx.getImageData(x, y, rect.width, rect.height);
                        _this.ctx.putImageData(_this.mosaic(imageData), x, y, 0, 0, rect.width, rect.height);
                        _this.histories.push([[MouseType.MOSAIC, x, y, rect.width, rect.height]]);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBob3RvY292ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSyxTQUFpQztBQUF0QyxXQUFLLFNBQVM7SUFBRyx1Q0FBRyxDQUFBO0lBQUUsNkNBQU0sQ0FBQTtJQUFFLDZDQUFNLENBQUE7QUFBQyxDQUFDLEVBQWpDLFNBQVMsS0FBVCxTQUFTLFFBQXdCO0FBU3RDO0lBaUNFLG9CQUFZLFFBQW1DO1FBeEJ0QyxhQUFRLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFN0csMkRBQTJEO1FBQzNELFFBQUcsR0FBVyxNQUFNLENBQUE7UUFDcEIsUUFBRyxHQUFpQixRQUFRLENBQUE7UUFDNUIsU0FBSSxHQUFnQixRQUFRLENBQUMsSUFBSSxDQUFBO1FBR2pDLFdBQU0sR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUc1RCxRQUFHLEdBQTZCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBNkIsQ0FBQTtRQUV4RixhQUFhO1FBQ2IsY0FBUyxHQUFjLFNBQVMsQ0FBQyxHQUFHLENBQUEsQ0FBSSx3QkFBd0I7UUFDaEUsV0FBTSxHQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUEsQ0FBSSx3QkFBd0I7UUFDL0QsYUFBUSxHQUFHLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQSxDQUFLLDZCQUE2QjtRQUN6RSxVQUFLLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQSxDQUFJLDBCQUEwQjtRQUM5RCxZQUFPLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQSxDQUFJLG9DQUFvQztRQUM1RSxhQUFRLEdBQUcsVUFBVSxDQUFDLGdCQUFnQixDQUFBLENBQUMscUNBQXFDO1FBRTVFLGNBQVMsR0FBWSxFQUFFLENBQUEsQ0FBSSxrQkFBa0I7UUFDN0MsaUJBQVksR0FBWSxFQUFFLENBQUEsQ0FBSSwyQ0FBMkM7UUFJdkUsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFBO1FBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQXFCLENBQUE7UUFBQyxDQUFDO1FBRTFHLDJDQUEyQztRQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQTtRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUVwQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDYixDQUFDO0lBRU8seUJBQUksR0FBWjtRQUFBLGlCQXNIQztRQXBISyxJQUFBLG9DQUFrRCxFQUFqRCxZQUFJLEVBQUUsV0FBRyxFQUFFLFdBQUcsQ0FBbUM7UUFFdEQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFN0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUFDLENBQUM7UUFFeEMsdURBQXVEO1FBQ3ZELElBQUksTUFBTSxHQUFHLENBQUM7WUFDWixLQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDYixHQUFHLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM3QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQTtRQUcvQywwQ0FBMEM7UUFDMUMsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXpFLElBQUksY0FBYyxHQUFZLEVBQUUsQ0FBQTtRQUVoQyxJQUFJLGlCQUFpQixHQUFZLEtBQUssQ0FBQTtRQUN0QyxJQUFJLGVBQStCLENBQUE7UUFDbkMsSUFBSSxNQUFjLENBQUE7UUFDbEIsSUFBSSxNQUFjLENBQUE7UUFFbEIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxVQUFDLENBQU07WUFDNUIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBRWxCLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO1lBQ2hCLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFBO1lBQ1YsSUFBQSxrQ0FBcUMsRUFBcEMsU0FBQyxFQUFFLFNBQUMsQ0FBZ0M7WUFFM0MsY0FBYyxHQUFHLEVBQUUsQ0FBQTtZQUVuQixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsaUJBQWlCLEdBQUcsSUFBSSxDQUFBO2dCQUV4QixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxHQUFHLElBQUksS0FBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDNUUsS0FBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtvQkFDcEIsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDdEMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBRXhDLEtBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ3BCLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBR3hDLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQy9DLGVBQWUsR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUMxQyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRywwREFFdEIsTUFBTSw4QkFDUCxNQUFNLG1LQU1kLENBQUE7b0JBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQTtnQkFDbkMsQ0FBQztnQkFFRCxHQUFHLENBQUMsZ0JBQWdCLENBQUMsS0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLEdBQUcsV0FBVyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN6RixDQUFDO1FBRUgsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxVQUFDLENBQU07WUFDNUIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ2xCLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLEdBQUcsSUFBSSxLQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUM1RSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUMxQyxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLElBQUksSUFBSSxHQUFHLEtBQUksQ0FBQyxTQUFTLENBQUMsS0FBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Z0JBRTlFLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtnQkFDakQsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFBO2dCQUMvQyxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtnQkFDL0MsZUFBZSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7WUFDbkQsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUViLElBQUksYUFBYSxHQUFHLENBQUMsVUFBQyxDQUFNO1lBQzFCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUNsQixHQUFHLENBQUMsbUJBQW1CLENBQUMsS0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLEdBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUV6RixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLGlCQUFpQixHQUFJLEtBQUssQ0FBQTtnQkFDMUIsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsR0FBRyxJQUFJLEtBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQzVFLEtBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFBO29CQUNuQyxjQUFjLEdBQUcsRUFBRSxDQUFBO2dCQUNyQixDQUFDO2dCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLElBQUksR0FBRyxLQUFJLENBQUMsU0FBUyxDQUFDLEtBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO29CQUMxRSxJQUFBLDZFQUErRSxFQUE5RSxTQUFDLEVBQUUsU0FBQyxDQUEwRSxDQUFDLDRCQUE0QjtvQkFFaEgsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxJQUFJLFNBQVMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO3dCQUNwRSxLQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTt3QkFFbEYsS0FBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7b0JBQzFFLENBQUM7b0JBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQTtnQkFDbkMsQ0FBQztnQkFFRCxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN4QyxLQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQTtnQkFDOUIsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFYixjQUFjO1FBQ2QsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsWUFBWSxHQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdkYsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLEdBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUE7UUFFekYsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsVUFBVSxHQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDakYsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLEdBQUUsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUE7SUFDckYsQ0FBQztJQUVELHFDQUFxQztJQUM3QiwwQkFBSyxHQUFiO1FBQ0UsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLDhDQUVsQixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsd0JBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyx1Q0FFMUIsQ0FBQTtJQUNILENBQUM7SUFFRCw0Q0FBNEM7SUFDcEMsOEJBQVMsR0FBakI7UUFBQSxpQkF5Q0M7UUF4Q0ssSUFBQSwwQkFBbUMsRUFBbEMsWUFBSSxFQUFFLFdBQUcsQ0FBeUI7UUFDdkMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN6QyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRywySEFNWCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsMkJBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLHdFQUcxQixDQUFBO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFFbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV2QixJQUFJLFNBQVMsR0FBRyxDQUFDLFVBQUMsQ0FBTTtZQUNsQixJQUFBLHVCQUEyQixFQUExQixTQUFDLEVBQUUsU0FBQyxDQUFzQjtZQUMvQixJQUFJLFVBQVUsR0FBRyxLQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUV0QyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxnQkFBYSxDQUFDLEdBQUcsS0FBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLGNBQU8sQ0FBQyxHQUFHLEtBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxTQUFLLENBQUEsQ0FBQyxtQ0FBbUM7WUFFM0gsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQTtZQUMvQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDeEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO29CQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUE7Z0JBQ2pDLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO29CQUM3QixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7Z0JBQzVCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWIscUJBQXFCO1FBQ3JCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsR0FBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2hGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxHQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFBO0lBQ3BGLENBQUM7SUFFRCw4QkFBUyxHQUFULFVBQVUsTUFBYztRQUN0QixFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQTtRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtRQUVwQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBRXRCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDVixLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtZQUNyQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtRQUN4QyxDQUFDO0lBQ0gsQ0FBQztJQUVELDJCQUFNLEdBQU4sVUFBTyxNQUFpQjtRQUFqQix1QkFBQSxFQUFBLFVBQWlCO1FBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBRUQsNEJBQU8sR0FBUCxVQUFRLE1BQWlCO1FBQWpCLHVCQUFBLEVBQUEsVUFBaUI7UUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFBO0lBQ3RDLENBQUM7SUFHRCwyQkFBTSxHQUFOLFVBQU8sQ0FBUyxFQUFFLENBQVM7UUFDekIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtRQUNwQixHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUE7UUFDMUIsR0FBRyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdEIsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBQzVCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7UUFDL0IsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDaEIsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFBO0lBQ2QsQ0FBQztJQUVELDZCQUFRLEdBQVIsVUFBUyxDQUFTLEVBQUUsQ0FBUztRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLHdCQUF3QixHQUFHLGFBQWEsQ0FBQTtRQUNqRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtRQUN2QixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUNqQixNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDdkQsQ0FBQztJQUVELDBCQUFLLEdBQUwsVUFBTSxDQUFTLEVBQUUsQ0FBUztRQUN4QixJQUFJLENBQUMsR0FBRyxDQUFDLHdCQUF3QixHQUFHLGlCQUFpQixDQUFBO1FBQ3JELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEdBQUcsYUFBYSxDQUFBO1FBQ2pELE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQUVELDJCQUFNLEdBQU4sVUFBTyxTQUFvQjtRQUNsQixJQUFBLG1CQUFHLENBQWM7UUFFeEIsSUFBTSxPQUFPLEdBQUc7WUFDZCxVQUFVLEVBQUUsQ0FBQztTQUNkLENBQUE7UUFFRCxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3hDLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFakMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUFBLENBQUM7UUFFdkMsTUFBTSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFBO1FBQzlCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtRQUNoQyxHQUFHLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFakMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFBO1FBQzdDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQTtRQUM1QyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUVkLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDcEMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQztnQkFFcEMsaUdBQWlHO2dCQUNqRyxrQkFBa0I7Z0JBQ2xCLGtCQUFrQjtnQkFDbEIsa0JBQWtCO2dCQUNsQix3QkFBd0I7Z0JBRXhCLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtnQkFDaEcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO2dCQUNoRyxDQUFDLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7Z0JBQ2hHLENBQUMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtnQkFFaEcsR0FBRyxDQUFDLFNBQVMsR0FBRyxVQUFRLENBQUMsVUFBSyxDQUFDLFVBQUssQ0FBQyxVQUFLLENBQUMsTUFBRyxDQUFBO2dCQUM5QyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzFHLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUM1RCxDQUFDO0lBRUQsZ0NBQVcsR0FBWCxVQUFZLEtBQVU7UUFDaEIsSUFBQSxxQ0FBeUMsRUFBeEMsU0FBQyxFQUFFLFNBQUMsQ0FBb0M7UUFFN0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUFDLENBQUM7UUFDcEUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtRQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVELHlDQUFvQixHQUFwQixVQUFxQixLQUFVO1FBQzdCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNSLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFBQyxDQUFDO1FBRXRELENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQ3hDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO1FBRXZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUNmLENBQUM7SUFFRCw4QkFBUyxHQUFULFVBQVUsSUFBVTtRQUNsQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtRQUU5QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN2QyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtZQUMvRCxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFBO1FBQ3ZDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQTtZQUMvRCxPQUFPLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO1FBQ3JDLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtRQUM5RSxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM5RSxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7UUFDOUUsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFPLENBQUE7SUFDaEIsQ0FBQztJQUVELGlDQUFZLEdBQVosVUFBYSxNQUFjLEVBQUUsTUFBYyxFQUFFLElBQVksRUFBRSxJQUFZO1FBQ2pFLElBQUEsbUNBQXVDLEVBQXRDLFNBQUMsRUFBRSxTQUFDLENBQWtDO1FBRTNDLElBQUksSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFBO1FBQ2hELElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUUsTUFBTSxDQUFBO1FBRTlDLE1BQU0sQ0FBQztZQUNMLElBQUksRUFBRSxJQUFJO1lBQ1YsR0FBRyxFQUFFLEdBQUc7WUFDUixLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDbEIsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3BCLENBQUE7SUFDSCxDQUFDO0lBRUQsK0JBQVUsR0FBVixVQUFXLEtBQWEsRUFBRSxLQUFhO1FBQ3JDLEVBQUUsQ0FBQyxDQUNELEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVU7WUFDM0IsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDOUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUztZQUMxQixLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FDL0MsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQUEsQ0FBQztRQUVqQixNQUFNLENBQUMsSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELGdDQUFXLEdBQVgsVUFBWSxLQUFhO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCw2QkFBUSxHQUFSLFVBQVMsS0FBYTtRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsNEJBQU8sR0FBUCxVQUFRLElBQWU7UUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7UUFFckIsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUNmLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNsQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDO0lBQ0gsQ0FBQztJQUVELDJCQUFNLEdBQU47UUFDRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNkLE1BQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ3ZDLFlBQVksRUFBRSxNQUFNO2dCQUNwQixNQUFNLEVBQUUsZUFBYSxVQUFVLENBQUMsd0JBQTBCO2FBQzNELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUE7SUFDaEMsQ0FBQztJQUVELDhCQUFTLEdBQVQ7UUFDRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNkLE1BQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUU7Z0JBQ3ZDLFlBQVksRUFBRSxNQUFNO2dCQUNwQixNQUFNLEVBQUUsZ0JBQWMsVUFBVSxDQUFDLDJCQUE2QjthQUMvRCxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO0lBQ25DLENBQUM7SUFFRCw4QkFBUyxHQUFUO1FBQ0UsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO0lBQ25DLENBQUM7SUFFRCx5QkFBSSxHQUFKO1FBQUEsaUJBZ0NDO1FBL0JDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7UUFDbEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQTtRQUV0QixHQUFHLENBQUMsSUFBSSxFQUFFLENBQUE7UUFFViw2REFBNkQ7UUFDN0QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNwRSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFBO1FBRXBCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBaUI7WUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQWdCO2dCQUN6QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLEtBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUNwQixLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUN2QixLQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDakMsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN4QyxLQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO29CQUN2QixLQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDNUIsS0FBSSxDQUFDLHFCQUFxQixFQUFFLENBQUE7Z0JBQzlCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUNqQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ2YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDdEMsQ0FBQztnQkFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN4QyxJQUFJLFNBQVMsR0FBRyxLQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDekUsS0FBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUN6RixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2xCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUNmLENBQUM7SUFHRDs7Ozs7T0FLRztJQUNILHVDQUFrQixHQUFsQixVQUFtQixHQUFXLEVBQUUsUUFBbUI7UUFDakQsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQTtRQUVyQixHQUFHLENBQUMsTUFBTSxHQUFHO1lBQ1gsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQTtZQUNyQixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1lBRXZCLFFBQVEsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3JDLENBQUMsQ0FBQTtRQUVELEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFBO0lBQ2YsQ0FBQztJQUVELCtCQUFVLEdBQVYsVUFBVyxJQUFtQixFQUFFLE9BQWEsRUFBRSxRQUFtQjtRQUF2RCxxQkFBQSxFQUFBLG1CQUFtQjtRQUFFLHdCQUFBLEVBQUEsYUFBYTtRQUMzQyxJQUFJLENBQUMscUJBQXFCLENBQUMsVUFBQyxNQUFXO1lBQ3JDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtRQUN2RCxDQUFDLENBQUMsQ0FBQTtRQUVGLHlCQUF5QjtRQUV6QixvRUFBb0U7UUFDcEUsc0RBQXNEO1FBQ3RELDZCQUE2QjtRQUM3QiwrQkFBK0I7UUFDL0IsOENBQThDO1FBQzlDLG1CQUFtQjtRQUNuQix1REFBdUQ7UUFDdkQsMERBQTBEO1FBRTFELGdFQUFnRTtRQUNoRSxNQUFNO1FBQ04sS0FBSztJQUNQLENBQUM7SUFHRCwwQ0FBcUIsR0FBckIsVUFBc0IsUUFBbUI7UUFDdkMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtRQUNwQixJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3hDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUE7UUFDaEMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtRQUVsQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQTtRQUFDLENBQUM7UUFFcEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUQsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFN0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RSxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsNEJBQU8sR0FBUDtRQUNFLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDekUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUV0RSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUE7UUFFakIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsY0FBYztJQUNoQixDQUFDO0lBdGhCTSx5QkFBYyxHQUFVLEVBQUUsQ0FBQTtJQUMxQiw0QkFBaUIsR0FBVSxHQUFHLENBQUE7SUFDOUIsd0JBQWEsR0FBVyxPQUFPLENBQUE7SUFDL0IsbUNBQXdCLEdBQVcsS0FBSyxDQUFBO0lBQ3hDLHNDQUEyQixHQUFVLE1BQU0sQ0FBQTtJQUMzQywwQkFBZSxHQUFXLE9BQU8sQ0FBQTtJQUNqQywyQkFBZ0IsR0FBVyxPQUFPLENBQUE7SUFpaEIzQyxpQkFBQztDQXhoQkQsQUF3aEJDLElBQUEiLCJmaWxlIjoicGhvdG9jb3Zlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImVudW0gTW91c2VUeXBlIHsgUEVOLCBFUkFTRVIsIE1PU0FJQyB9XHJcblxyXG5pbnRlcmZhY2UgUmVjdCB7XHJcbiAgbGVmdDogbnVtYmVyO1xyXG4gIHRvcDogbnVtYmVyO1xyXG4gIHdpZHRoOiBudW1iZXI7XHJcbiAgaGVpZ2h0OiBudW1iZXI7XHJcbn1cclxuXHJcbmNsYXNzIFBob3RvQ292ZXIge1xyXG4gIHN0YXRpYyBERUZBVUxUX1JBRElVUzpudW1iZXIgPSAyMFxyXG4gIHN0YXRpYyBERUZBVUxUX01BWF9XSURUSDpudW1iZXIgPSA4MDBcclxuICBzdGF0aWMgREVGQVVMVF9DT0xPUjogc3RyaW5nID0gJ2JsYWNrJ1xyXG4gIHN0YXRpYyBERUZBVUxUX1BFTl9CT1JERVJfQ09MT1I6IHN0cmluZyA9ICdyZWQnXHJcbiAgc3RhdGljIERFRkFVTFRfRVJBU0VSX0JPUkRFUl9DT0xPUjpzdHJpbmcgPSAnIzY2NidcclxuICBzdGF0aWMgREVGQVVMVF9MSU5FQ0FQOiBzdHJpbmcgPSAncm91bmQnXHJcbiAgc3RhdGljIERFRkFVTFRfTElORUpPSU46IHN0cmluZyA9ICdyb3VuZCdcclxuXHJcbiAgcmVhZG9ubHkgaXNNb2JpbGUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ2lQaG9uZScpID4gLTEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAtMVxyXG5cclxuICAvLyBjYWNoZSB3aW5kb3csIGRvY3VtZW50IGFuZCBib2R5IGZvciBzcGVlZCB1cCBwZXJmb3JtYW5jZVxyXG4gIHdpbjogV2luZG93ID0gd2luZG93XHJcbiAgZG9jOiBIVE1MRG9jdW1lbnQgPSBkb2N1bWVudFxyXG4gIGJvZHk6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQuYm9keVxyXG5cclxuICBtb3VzZTogSFRNTERpdkVsZW1lbnQgICAvLyBtb3VzZSBwb2ludGVyIG9uIGNhbnZhc1xyXG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gIGltZzogSFRNTEltYWdlRWxlbWVudCAgLy8gaW1hZ2UgdGhhdCB5b3Ugd2FudCB0byBjaGFuZ2UgXHJcblxyXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKSBhcyBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcclxuXHJcbiAgLy8gaW5pdCB2YWx1ZVxyXG4gIG1vdXNlVHlwZTogTW91c2VUeXBlID0gTW91c2VUeXBlLlBFTiAgICAvLyBkZWZhdWx0IG1vdXNlIHBvaW50ZXJcclxuICByYWRpdXMgPSAgUGhvdG9Db3Zlci5ERUZBVUxUX1JBRElVUyAgICAvLyBkZWZhdWx0IHJhZGl1cyBvZiBwZW5cclxuICBtYXhXaWR0aCA9IFBob3RvQ292ZXIuREVGQVVMVF9NQVhfV0lEVEggICAgIC8vIGRlZmF1bHQgbWF4IHdpZHRoIG9mIGltYWdlXHJcbiAgY29sb3IgPSBQaG90b0NvdmVyLkRFRkFVTFRfQ09MT1IgICAgLy8gZGVmYXVsdCBjb2xvciBvZiBjYW52YXNcclxuICBsaW5lQ2FwID0gUGhvdG9Db3Zlci5ERUZBVUxUX0xJTkVDQVAgICAgLy8gZGVmYXVsdCBsaW5lY2FwIG9mIGxpbmUgb24gY2FudmFzXHJcbiAgbGluZUpvaW4gPSBQaG90b0NvdmVyLkRFRkFVTFRfTElORUpPSU4gLy8gZGVmYXVsdCBsaW5lSm9pbiBvZiBsaW5lIG9uIGNhbnZhc1xyXG5cclxuICBoaXN0b3JpZXM6IGFueVtdW10gPSBbXSAgICAvLyBvcGVyYXRlIGhpc3RvcnlcclxuICBiaW5kZWRFdmVudHM6IGFueVtdW10gPSBbXSAgICAvLyByZWdpc3RlcmVkIGV2ZW50cyBbbm9kZSwgdHlwZSwgZnVuY3Rpb25dXHJcblxyXG4gIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBIVE1MSW1hZ2VFbGVtZW50IHwgc3RyaW5nKSB7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ29iamVjdCcpIHsgdGhpcy5pbWcgPSBzZWxlY3RvciB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7IHRoaXMuaW1nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgYXMgSFRNTEltYWdlRWxlbWVudCB9XHJcbiAgICBcclxuICAgIC8vIGluaXRpYWwgY2FudmFzIGFuZCBpdHMgc2l6ZSBhbmQgcG9zaXRpb25cclxuICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5pbWcud2lkdGhcclxuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuaW1nLmhlaWdodFxyXG5cclxuICAgIHRoaXMuaW5pdCgpXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGluaXQoKTogdm9pZCB7XHJcblxyXG4gICAgbGV0IFtib2R5LCB3aW4sIGRvY10gPSBbdGhpcy5ib2R5LCB0aGlzLndpbiwgdGhpcy5kb2NdXHJcblxyXG4gICAgdGhpcy5hc3luYygpXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKHRoaXMuY2FudmFzKVxyXG5cclxuICAgIGlmICghdGhpcy5pc01vYmlsZSkgeyB0aGlzLmluaXRNb3VzZSgpIH1cclxuXHJcbiAgICAvLyBhc3luYyBjYW52YXMgcG9zaXRpb24gYW5kIHNpemUgZHVyaW5nIGJyb3dzZXIgcmVzaXplXHJcbiAgICBsZXQgcmVzaXplID0gKCgpID0+IHtcclxuICAgICAgdGhpcy5hc3luYygpXHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplLCBmYWxzZSlcclxuICAgIHRoaXMuYmluZGVkRXZlbnRzLnB1c2goW3dpbiwgJ3Jlc2l6ZScsIHJlc2l6ZV0pXHJcblxyXG5cclxuICAgIC8vIHRoaXMuaW1nLnN0eWxlLmNzc1RleHQgPSBgb3BhY2l0eTogMC40YFxyXG4gICAgLy8gdGhpcy5pbWcuc3R5bGUub3BhY2l0eSA9ICcwJ1xyXG4gICAgdGhpcy5jdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG5cclxuICAgIGxldCBjdXJyZW50T3BlcmF0ZTogYW55W11bXSA9IFtdXHJcblxyXG4gICAgbGV0IG1vdXNlRG93bk9uQ2FudmFzOiBib29sZWFuID0gZmFsc2VcclxuICAgIGxldCBtb3NhaWNTZWxlY3Rpb246IEhUTUxEaXZFbGVtZW50XHJcbiAgICBsZXQgc3RhcnRYOiBudW1iZXJcclxuICAgIGxldCBzdGFydFk6IG51bWJlclxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZURvd24gPSAoKGU6IGFueSkgPT4ge1xyXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuXHJcbiAgICAgIHN0YXJ0WCA9IGUucGFnZVhcclxuICAgICAgc3RhcnRZID0gZS5wYWdlWVxyXG4gICAgICBjb25zdCBbeCwgeV0gPSB0aGlzLmdldENvb3JkaW5hdGVCeUV2ZW50KGUpXHJcblxyXG4gICAgICBjdXJyZW50T3BlcmF0ZSA9IFtdXHJcblxyXG4gICAgICBpZiAodGhpcy5pc09uQ2FudmFzKGUucGFnZVgsIGUucGFnZVkpKSB7XHJcbiAgICAgICAgbW91c2VEb3duT25DYW52YXMgPSB0cnVlXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLlBFTiB8fCB0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKClcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2goWydNT1ZFX1RPJywgeCwgeV0pXHJcbiAgICAgICAgICBjdXJyZW50T3BlcmF0ZS5wdXNoKHRoaXMuZHJhd0J5RXZlbnQoZSkpXHJcblxyXG4gICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKClcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2goWydNT1ZFX1RPJywgeCwgeV0pXHJcblxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBtb3NhaWNTZWxlY3Rpb24gPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS5jc3NUZXh0ID0gYFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgIGxlZnQ6ICR7c3RhcnRYfXB4O1xyXG4gICAgICAgICAgICB0b3A6ICR7c3RhcnRZfXB4O1xyXG4gICAgICAgICAgICB3aWR0aDogMDtcclxuICAgICAgICAgICAgaGVpZ2h0OiAwO1xyXG4gICAgICAgICAgICBib3JkZXI6IDFweCBkYXNoZWQgI2RkZDtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMjUsIDEyNSwgMTI1LCAwLjUpXHJcblxyXG4gICAgICAgICAgYFxyXG4gICAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtb3NhaWNTZWxlY3Rpb24pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJywgY2FudmFzTW91c2VNb3ZlLCBmYWxzZSlcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICBsZXQgY2FudmFzTW91c2VNb3ZlID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLlBFTiB8fCB0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgIGN1cnJlbnRPcGVyYXRlLnB1c2godGhpcy5kcmF3QnlFdmVudChlKSlcclxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgICAgIGxldCByZWN0ID0gdGhpcy5saW1pdFJlY3QodGhpcy5jYWN1bGF0ZVJlY3Qoc3RhcnRYLCBzdGFydFksIGUucGFnZVgsIGUucGFnZVkpKVxyXG5cclxuICAgICAgICBtb3NhaWNTZWxlY3Rpb24uc3R5bGUubGVmdCA9IHJlY3QubGVmdCAtIDEgKyAncHgnXHJcbiAgICAgICAgbW9zYWljU2VsZWN0aW9uLnN0eWxlLnRvcCA9IHJlY3QudG9wIC0gMSArICdweCdcclxuICAgICAgICBtb3NhaWNTZWxlY3Rpb24uc3R5bGUud2lkdGggPSByZWN0LndpZHRoICsgJ3B4J1xyXG4gICAgICAgIG1vc2FpY1NlbGVjdGlvbi5zdHlsZS5oZWlnaHQgPSByZWN0LmhlaWdodCArICdweCdcclxuICAgICAgfVxyXG4gICAgfSkuYmluZCh0aGlzKVxyXG5cclxuICAgIGxldCBjYW52YXNNb3VzZVVwID0gKChlOiBhbnkpID0+IHtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgIHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuaXNNb2JpbGUgPyAndG91Y2htb3ZlJzogJ21vdXNlbW92ZScsIGNhbnZhc01vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICAgIFxyXG4gICAgICBpZiAobW91c2VEb3duT25DYW52YXMpIHtcclxuICAgICAgICBtb3VzZURvd25PbkNhbnZhcyAgPSBmYWxzZVxyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLlBFTiB8fCB0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLkVSQVNFUikge1xyXG4gICAgICAgICAgdGhpcy5oaXN0b3JpZXMucHVzaChjdXJyZW50T3BlcmF0ZSlcclxuICAgICAgICAgIGN1cnJlbnRPcGVyYXRlID0gW11cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBsZXQgcmVjdCA9IHRoaXMubGltaXRSZWN0KHRoaXMuY2FjdWxhdGVSZWN0KHN0YXJ0WCwgc3RhcnRZLCBlLnBhZ2VYLCBlLnBhZ2VZKSlcclxuICAgICAgICAgIGxldCBbeCwgeV0gPSBbcmVjdC5sZWZ0IC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCwgcmVjdC50b3AgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BdIC8vIGNvb2RpbmF0ZSByZWxhdGl2ZSBjYW52YXNcclxuXHJcbiAgICAgICAgICBpZiAocmVjdC53aWR0aCA+IDAgJiYgcmVjdC5oZWlnaHQgPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBpbWFnZURhdGEgPSB0aGlzLmN0eC5nZXRJbWFnZURhdGEoeCwgeSwgcmVjdC53aWR0aCwgcmVjdC5oZWlnaHQpXHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnB1dEltYWdlRGF0YSh0aGlzLm1vc2FpYyhpbWFnZURhdGEpLCB4LCB5LCAwLCAwLCByZWN0LndpZHRoLCByZWN0LmhlaWdodClcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yaWVzLnB1c2goW1tNb3VzZVR5cGUuTU9TQUlDLCB4LCB5LCByZWN0LndpZHRoLCByZWN0LmhlaWdodF1dKVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGJvZHkucmVtb3ZlQ2hpbGQobW9zYWljU2VsZWN0aW9uKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMubW91c2VUeXBlID09PSBNb3VzZVR5cGUuRVJBU0VSKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbWJpbmVXaXRoQmFja2dyb3VuZCgpXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KS5iaW5kKHRoaXMpXHJcblxyXG4gICAgLy8gY2FudmFzIGRvd25cclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKHRoaXMuaXNNb2JpbGUgPyAndG91Y2hzdGFydCc6ICdtb3VzZWRvd24nLCBjYW52YXNNb3VzZURvd24sIGZhbHNlKVxyXG4gICAgdGhpcy5iaW5kZWRFdmVudHMucHVzaChbd2luLCB0aGlzLmlzTW9iaWxlID8gJ3RvdWNoc3RhcnQnOiAnbW91c2Vkb3duJywgY2FudmFzTW91c2VEb3duXSlcclxuXHJcbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmlzTW9iaWxlID8gJ3RvdWNoZW5kJzogJ21vdXNldXAnLCBjYW52YXNNb3VzZVVwLCBmYWxzZSlcclxuICAgIHRoaXMuYmluZGVkRXZlbnRzLnB1c2goW3dpbiwgdGhpcy5pc01vYmlsZSA/ICd0b3VjaGVuZCc6ICdtb3VzZXVwJywgY2FudmFzTW91c2VVcF0pXHJcbiAgfVxyXG5cclxuICAvLyBhc3luYyB4IGFuZCB5IGZyb20gaW1hZ2UgdG8gY2FudmFzXHJcbiAgcHJpdmF0ZSBhc3luYygpIHtcclxuICAgIHRoaXMuY2FudmFzLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogJHt0aGlzLmltZy5vZmZzZXRMZWZ0fXB4O1xyXG4gICAgICB0b3A6ICR7dGhpcy5pbWcub2Zmc2V0VG9wfXB4O1xyXG4gICAgICB1c2Utc2VsZWN0OiBub25lO1xyXG4gICAgYFxyXG4gIH1cclxuXHJcbiAgLy8gaW5pdGlhbCBtb3VzZSBzaGFwZSB3aGVyZSBtb3VzZSBvbiBjYW52YXNcclxuICBwcml2YXRlIGluaXRNb3VzZSgpIHtcclxuICAgIGxldCBbYm9keSwgd2luXSA9IFt0aGlzLmJvZHksIHRoaXMud2luXVxyXG4gICAgbGV0IG1vdXNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgIG1vdXNlLnN0eWxlLmNzc1RleHQgPSBgXHJcbiAgICAgIGRpc3BsYXk6IG5vbmU7XHJcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgbGVmdDogMDtcclxuICAgICAgdG9wOiAwO1xyXG4gICAgICB6LWluZGV4OiAxMDAwMTtcclxuICAgICAgd2lkdGg6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBoZWlnaHQ6ICR7dGhpcy5yYWRpdXMgKiAyfXB4O1xyXG4gICAgICBib3JkZXI6IDFweCBzb2xpZCByZWQ7XHJcbiAgICAgIGJvcmRlci1yYWRpdXM6IDEwMCU7XHJcbiAgICBgXHJcbiAgICB0aGlzLm1vdXNlID0gbW91c2VcclxuXHJcbiAgICBib2R5LmFwcGVuZENoaWxkKG1vdXNlKVxyXG5cclxuICAgIGxldCBtb3VzZU1vdmUgPSAoKGU6IGFueSkgPT4ge1xyXG4gICAgICBsZXQgW3gsIHldID0gW2UucGFnZVgsIGUucGFnZVldXHJcbiAgICAgIGxldCBpc09uQ2FudmFzID0gdGhpcy5pc09uQ2FudmFzKHgsIHkpXHJcblxyXG4gICAgICBtb3VzZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7eCAtIHRoaXMucmFkaXVzIC0gMX1weCwgJHt5IC0gdGhpcy5yYWRpdXMgLSAxfXB4KWAgLy8gbWludXMgYm9yZGVyIHdpZHRoIG9mIG1vdXNlIHR5cGVcclxuXHJcbiAgICAgIGlmICghaXNPbkNhbnZhcykge1xyXG4gICAgICAgIG1vdXNlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICBib2R5LnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0J1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlVHlwZSA9PT0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgICAgICAgbW91c2Uuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJ1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBtb3VzZS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgYm9keS5zdHlsZS5jdXJzb3IgPSAnbm9uZSdcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pLmJpbmQodGhpcylcclxuXHJcbiAgICAvLyBjaGFuZ2UgbW91c2Ugc3R5bGVcclxuICAgIHdpbi5hZGRFdmVudExpc3RlbmVyKHRoaXMuaXNNb2JpbGUgPyAndG91Y2htb3ZlJzogJ21vdXNlbW92ZScsIG1vdXNlTW92ZSwgZmFsc2UpXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5wdXNoKFt3aW4sIHRoaXMuaXNNb2JpbGUgPyAndG91Y2htb3ZlJzogJ21vdXNlbW92ZScsIG1vdXNlTW92ZV0pXHJcbiAgfVxyXG5cclxuICBzZXRSYWRpdXMocmFkaXVzOiBudW1iZXIpIHtcclxuICAgIGlmIChyYWRpdXMgPCAyIHx8IHJhZGl1cyA+IDEwMCkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1c1xyXG5cclxuICAgIGxldCBtb3VzZSA9IHRoaXMubW91c2VcclxuXHJcbiAgICBpZiAobW91c2UpIHtcclxuICAgICAgbW91c2Uuc3R5bGUud2lkdGggPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gICAgICBtb3VzZS5zdHlsZS5oZWlnaHQgPSByYWRpdXMgKiAyICsgJ3B4J1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgem9vbUluKHJhZGl1czpudW1iZXIgPSAyKSB7XHJcbiAgICB0aGlzLnNldFJhZGl1cyh0aGlzLnJhZGl1cyArIHJhZGl1cylcclxuICB9XHJcblxyXG4gIHpvb21PdXQocmFkaXVzOm51bWJlciA9IDIpIHtcclxuICAgIHRoaXMuc2V0UmFkaXVzKHRoaXMucmFkaXVzIC0gcmFkaXVzKVxyXG4gIH1cclxuXHJcblxyXG4gIGxpbmVUbyh4OiBudW1iZXIsIHk6IG51bWJlcik6IHZvaWQge1xyXG4gICAgY29uc3QgY3R4ID0gdGhpcy5jdHhcclxuICAgIGN0eC5saW5lQ2FwID0gdGhpcy5saW5lQ2FwXHJcbiAgICBjdHgubGluZUpvaW4gPSAncm91bmQnXHJcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yXHJcbiAgICBjdHgubGluZVdpZHRoID0gdGhpcy5yYWRpdXMgKiAyXHJcbiAgICBjdHgubGluZVRvKHgsIHkpXHJcbiAgICBjdHguc3Ryb2tlKClcclxuICB9XHJcblxyXG4gIGRyYXdMaW5lKHg6IG51bWJlciwgeTogbnVtYmVyKTogYW55W10ge1xyXG4gICAgdGhpcy5jdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJ1xyXG4gICAgdGhpcy5saW5lQ2FwID0gJ3JvdW5kJ1xyXG4gICAgdGhpcy5saW5lSm9pbiA9ICdyb3VuZCdcclxuICAgIHRoaXMubGluZVRvKHgsIHkpXHJcbiAgICByZXR1cm4gW01vdXNlVHlwZS5QRU4sIHRoaXMuY29sb3IsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gIH1cclxuXHJcbiAgZXJhc2UoeDogbnVtYmVyLCB5OiBudW1iZXIpOiBhbnlbXSB7XHJcbiAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnZGVzdGluYXRpb24tb3V0J1xyXG4gICAgdGhpcy5saW5lQ2FwID0gJ3JvdW5kJ1xyXG4gICAgdGhpcy5saW5lSm9pbiA9ICdyb3VuZCdcclxuICAgIHRoaXMubGluZVRvKHgsIHkpXHJcbiAgICB0aGlzLmN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInXHJcbiAgICByZXR1cm4gW01vdXNlVHlwZS5FUkFTRVIsIHgsIHksIHRoaXMucmFkaXVzXVxyXG4gIH1cclxuXHJcbiAgbW9zYWljKGltYWdlRGF0YTogSW1hZ2VEYXRhKTogSW1hZ2VEYXRhIHtcclxuICAgIGNvbnN0IFtkb2NdID0gW3RoaXMuZG9jXVxyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIHJlc29sdXRpb246IDggXHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNhbnZhcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgbGV0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcblxyXG4gICAgaWYgKCFjdHgpIHsgcmV0dXJuIG5ldyBJbWFnZURhdGEoMCwgMCl9XHJcblxyXG4gICAgY2FudmFzLndpZHRoID0gaW1hZ2VEYXRhLndpZHRoXHJcbiAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodFxyXG4gICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApXHJcblxyXG4gICAgbGV0IHJvd3MgPSBjYW52YXMuaGVpZ2h0IC8gb3B0aW9ucy5yZXNvbHV0aW9uXHJcbiAgICBsZXQgY29scyA9IGNhbnZhcy53aWR0aCAvIG9wdGlvbnMucmVzb2x1dGlvblxyXG4gICAgbGV0IHIsIGcsIGIsIGFcclxuXHJcbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCByb3dzOyByb3crKykge1xyXG4gICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCBjb2xzOyBjb2wrKykge1xyXG5cclxuICAgICAgICAvLyBsZXQgdGVtcERhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbiwgcm93ICogb3B0aW9ucy5yZXNvbHV0aW9uLCAxLCAxKS5kYXRhXHJcbiAgICAgICAgLy8gciA9IHRlbXBEYXRhWzBdXHJcbiAgICAgICAgLy8gZyA9IHRlbXBEYXRhWzFdXHJcbiAgICAgICAgLy8gZyA9IHRlbXBEYXRhWzJdXHJcbiAgICAgICAgLy8gYSA9IHRlbXBkYXRhWzNdIC8gMjU1XHJcblxyXG4gICAgICAgIHIgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAwXVxyXG4gICAgICAgIGcgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAxXVxyXG4gICAgICAgIGIgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAyXVxyXG4gICAgICAgIGEgPSBpbWFnZURhdGEuZGF0YVsocm93ICogb3B0aW9ucy5yZXNvbHV0aW9uICogY2FudmFzLndpZHRoICsgY29sICogb3B0aW9ucy5yZXNvbHV0aW9uKSAqIDQgKyAzXVxyXG5cclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gYHJnYmEoJHtyfSwgJHtnfSwgJHtifSwgJHthfSlgXHJcbiAgICAgICAgY3R4LmZpbGxSZWN0KGNvbCAqIG9wdGlvbnMucmVzb2x1dGlvbiwgcm93ICogb3B0aW9ucy5yZXNvbHV0aW9uLCBvcHRpb25zLnJlc29sdXRpb24sIG9wdGlvbnMucmVzb2x1dGlvbilcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuICB9XHJcblxyXG4gIGRyYXdCeUV2ZW50KGV2ZW50OiBhbnkpOiBhbnlbXSB7XHJcbiAgICBsZXQgW3gsIHldID0gdGhpcy5nZXRDb29yZGluYXRlQnlFdmVudChldmVudClcclxuXHJcbiAgICBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5QRU4pIHsgcmV0dXJuIHRoaXMuZHJhd0xpbmUoeCwgeSkgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5tb3VzZVR5cGUgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHsgcmV0dXJuIHRoaXMuZXJhc2UoeCwgeSkgfVxyXG4gICAgZWxzZSB7IHJldHVybiBbXSB9XHJcbiAgfVxyXG5cclxuICBnZXRDb29yZGluYXRlQnlFdmVudChldmVudDogYW55KSB7XHJcbiAgICBsZXQgeCwgeVxyXG4gICAgaWYgKHRoaXMuaXNNb2JpbGUpIHsgZXZlbnQgPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSB9XHJcblxyXG4gICAgeCA9IGV2ZW50LnBhZ2VYIC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdFxyXG4gICAgeSA9IGV2ZW50LnBhZ2VZIC0gdGhpcy5jYW52YXMub2Zmc2V0VG9wXHJcblxyXG4gICAgcmV0dXJuIFt4LCB5XVxyXG4gIH1cclxuXHJcbiAgbGltaXRSZWN0KHJlY3Q6IFJlY3QpOiBSZWN0IHtcclxuICAgIGxldCBuZXdSZWN0ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZWN0KSlcclxuXHJcbiAgICBpZiAocmVjdC5sZWZ0IDwgdGhpcy5jYW52YXMub2Zmc2V0TGVmdCkge1xyXG4gICAgICBuZXdSZWN0LndpZHRoID0gcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAtIHRoaXMuY2FudmFzLm9mZnNldExlZnRcclxuICAgICAgbmV3UmVjdC5sZWZ0ID0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdFxyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZWN0LnRvcCA8IHRoaXMuY2FudmFzLm9mZnNldFRvcCkge1xyXG4gICAgICBuZXdSZWN0LmhlaWdodCA9IHJlY3QudG9wICsgcmVjdC5oZWlnaHQgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BcclxuICAgICAgbmV3UmVjdC50b3AgPSB0aGlzLmNhbnZhcy5vZmZzZXRUb3BcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA+IHRoaXMuY2FudmFzLm9mZnNldExlZnQgKyB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aCkge1xyXG4gICAgICBuZXdSZWN0LndpZHRoID0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdCArIHRoaXMuY2FudmFzLmNsaWVudFdpZHRoIC0gcmVjdC5sZWZ0XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPiB0aGlzLmNhbnZhcy5vZmZzZXRUb3AgKyB0aGlzLmNhbnZhcy5jbGllbnRIZWlnaHQpIHtcclxuICAgICAgbmV3UmVjdC5oZWlnaHQgPSB0aGlzLmNhbnZhcy5vZmZzZXRUb3AgKyB0aGlzLmNhbnZhcy5jbGllbnRIZWlnaHQgLSByZWN0LnRvcFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXdSZWN0XHJcbiAgfVxyXG5cclxuICBjYWN1bGF0ZVJlY3Qoc3RhcnRYOiBudW1iZXIsIHN0YXJ0WTogbnVtYmVyLCBlbmRYOiBudW1iZXIsIGVuZFk6IG51bWJlcik6IFJlY3Qge1xyXG4gICAgbGV0IFt3LCBoXSA9IFtlbmRYIC0gc3RhcnRYLCBlbmRZIC0gc3RhcnRZXVxyXG5cclxuICAgIGxldCBsZWZ0ID0gdyA8IDAgPyBzdGFydFggLSBNYXRoLmFicyh3KTogIHN0YXJ0WFxyXG4gICAgbGV0IHRvcCA9IGggPCAwID8gc3RhcnRZIC0gTWF0aC5hYnMoaCk6IHN0YXJ0WVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGxlZnQ6IGxlZnQsXHJcbiAgICAgIHRvcDogdG9wLFxyXG4gICAgICB3aWR0aDogTWF0aC5hYnModyksXHJcbiAgICAgIGhlaWdodDogTWF0aC5hYnMoaClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlzT25DYW52YXMocGFnZVg6IG51bWJlciwgcGFnZVk6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgaWYgKFxyXG4gICAgICBwYWdlWCA8IHRoaXMuaW1nLm9mZnNldExlZnQgfHxcclxuICAgICAgcGFnZVggPiAodGhpcy5pbWcub2Zmc2V0TGVmdCArIHRoaXMuaW1nLndpZHRoKSB8fFxyXG4gICAgICBwYWdlWSA8IHRoaXMuaW1nLm9mZnNldFRvcCB8fFxyXG4gICAgICBwYWdlWSA+ICh0aGlzLmltZy5vZmZzZXRUb3AgKyB0aGlzLmltZy5oZWlnaHQpXHJcbiAgICApIHsgcmV0dXJuIGZhbHNlfVxyXG5cclxuICAgIHJldHVybiB0cnVlXHJcbiAgfVxyXG5cclxuICBzZXRNYXhXaWR0aCh3aWR0aDogbnVtYmVyKSB7XHJcbiAgICB0aGlzLm1heFdpZHRoID0gd2lkdGhcclxuICB9XHJcblxyXG4gIHNldENvbG9yKGNvbG9yOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogc2V0IHRvb2wgYXMgbW91c2UgdHlwZVxyXG4gICAqIEBwYXJhbSB0b29sIE1vdXNlVHlwZVxyXG4gICAqL1xyXG4gIHNldFRvb2wodG9vbDogTW91c2VUeXBlKSB7XHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IHRvb2xcclxuXHJcbiAgICBpZiAodG9vbCA9PT0gTW91c2VUeXBlLlBFTikge1xyXG4gICAgICB0aGlzLnNldFBlbigpXHJcbiAgICB9IGVsc2UgaWYgKHRvb2wgPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgdGhpcy5zZXRFcmFzZXIoKVxyXG4gICAgfSBlbHNlIGlmICh0b29sID0gTW91c2VUeXBlLk1PU0FJQykge1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2V0UGVuKCkge1xyXG4gICAgaWYgKHRoaXMubW91c2UpIHtcclxuICAgICAgKE9iamVjdCBhcyBhbnkpLmFzc2lnbih0aGlzLm1vdXNlLnN0eWxlLCB7XHJcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7UGhvdG9Db3Zlci5ERUZBVUxUX1BFTl9CT1JERVJfQ09MT1J9YFxyXG4gICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubW91c2VUeXBlID0gTW91c2VUeXBlLlBFTlxyXG4gIH1cclxuXHJcbiAgc2V0RXJhc2VyKCkge1xyXG4gICAgaWYgKHRoaXMubW91c2UpIHtcclxuICAgICAgKE9iamVjdCBhcyBhbnkpLmFzc2lnbih0aGlzLm1vdXNlLnN0eWxlLCB7XHJcbiAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXHJcbiAgICAgICAgYm9yZGVyOiBgMXB4IGRhc2hlZCAke1Bob3RvQ292ZXIuREVGQVVMVF9FUkFTRVJfQk9SREVSX0NPTE9SfWBcclxuICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm1vdXNlVHlwZSA9IE1vdXNlVHlwZS5FUkFTRVJcclxuICB9XHJcblxyXG4gIHNldE1vc2FpYygpIHtcclxuICAgIHRoaXMubW91c2VUeXBlID0gTW91c2VUeXBlLk1PU0FJQ1xyXG4gIH1cclxuXHJcbiAgdW5kbygpIHtcclxuICAgIGxldCBjdHggPSB0aGlzLmN0eFxyXG4gICAgbGV0IGNvbG9yID0gdGhpcy5jb2xvclxyXG5cclxuICAgIGN0eC5zYXZlKClcclxuXHJcbiAgICAvLyBjdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpXHJcbiAgICBjdHguZHJhd0ltYWdlKHRoaXMuaW1nLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG4gICAgdGhpcy5oaXN0b3JpZXMucG9wKClcclxuXHJcbiAgICB0aGlzLmhpc3Rvcmllcy5tYXAoKHN0ZXBzOiBBcnJheTxhbnk+KSA9PiB7XHJcbiAgICAgIHN0ZXBzLm1hcCgoc3RlcDogQXJyYXk8YW55PikgPT4ge1xyXG4gICAgICAgIGlmIChzdGVwWzBdID09PSBNb3VzZVR5cGUuUEVOKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbG9yID0gc3RlcFsxXVxyXG4gICAgICAgICAgdGhpcy5zZXRSYWRpdXMoc3RlcFs0XSlcclxuICAgICAgICAgIHRoaXMuZHJhd0xpbmUoc3RlcFsyXSwgc3RlcFszXSlcclxuICAgICAgICB9IGVsc2UgaWYgKHN0ZXBbMF0gPT09IE1vdXNlVHlwZS5FUkFTRVIpIHtcclxuICAgICAgICAgIHRoaXMuc2V0UmFkaXVzKHN0ZXBbM10pXHJcbiAgICAgICAgICB0aGlzLmVyYXNlKHN0ZXBbMV0sIHN0ZXBbMl0pXHJcbiAgICAgICAgICB0aGlzLmNvbWJpbmVXaXRoQmFja2dyb3VuZCgpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSAnTU9WRV9UTycpIHtcclxuICAgICAgICAgIGN0eC5iZWdpblBhdGgoKVxyXG4gICAgICAgICAgY3R4Lm1vdmVUby5hcHBseShjdHgsIHN0ZXAuc2xpY2UoMSkpXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdGVwWzBdID09PSBNb3VzZVR5cGUuTU9TQUlDKSB7XHJcbiAgICAgICAgICBsZXQgaW1hZ2VEYXRhID0gdGhpcy5jdHguZ2V0SW1hZ2VEYXRhKHN0ZXBbMV0sIHN0ZXBbMl0sIHN0ZXBbM10sIHN0ZXBbNF0pXHJcbiAgICAgICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEodGhpcy5tb3NhaWMoaW1hZ2VEYXRhKSwgc3RlcFsxXSwgc3RlcFsyXSwgMCwgMCwgc3RlcFszXSwgc3RlcFs0XSlcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29sb3IgPSBjb2xvclxyXG4gICAgY3R4LnJlc3RvcmUoKVxyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIGdldCBpbWFnZSBvcmlnaW4gc2l6ZVxyXG4gICAqIEBwYXJhbSAge1N0cmluZ30gICBzcmMgICAgICBpYW1nZSBzb3VyY2UgdXJsXHJcbiAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrIGZ1bmN0aW9uLCB3aWR0aCBhcyBmaXJzdCBwYXJhbWV0ZXIgYW5kIGhlaWdodCBhcyBzZWNvbmRcclxuICAgKiBAcmV0dXJuIHt1bmRlZmluZWR9XHJcbiAgICovXHJcbiAgZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYzogc3RyaW5nLCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKClcclxuXHJcbiAgICBpbWcub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBsZXQgd2lkdGggPSBpbWcud2lkdGhcclxuICAgICAgbGV0IGhlaWdodCA9IGltZy5oZWlnaHRcclxuXHJcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB9XHJcblxyXG4gICAgaW1nLnNyYyA9IHNyY1xyXG4gIH1cclxuXHJcbiAgZ2V0RGF0YVVSTCh0eXBlID0gJ2ltYWdlL2pwZWcnLCBxdWFsaXR5ID0gMC44LCBjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICB0aGlzLmNvbWJpbmVXaXRoQmFja2dyb3VuZCgoY2FudmFzOiBhbnkpID0+IHtcclxuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soY2FudmFzLnRvRGF0YVVSTCh0eXBlLCBxdWFsaXR5KSlcclxuICAgIH0pXHJcblxyXG4gICAgLy8gbGV0IHNyYyA9IHRoaXMuaW1nLnNyY1xyXG5cclxuICAgIC8vIHRoaXMuZ2V0SW1hZ2VPcmlnaW5TaXplKHNyYywgKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSA9PiB7XHJcbiAgICAvLyAgIGxldCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgIC8vICAgdGVtcENhbnZhcy53aWR0aCA9IHdpZHRoXHJcbiAgICAvLyAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICAvLyAgIGxldCB0ZW1wQ3R4ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpXHJcbiAgICAvLyAgIGlmICh0ZW1wQ3R4KSB7XHJcbiAgICAvLyAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAvLyAgICAgdGVtcEN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgLy8gICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHRlbXBDYW52YXMudG9EYXRhVVJMKHR5cGUsIHF1YWxpdHkpKVxyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9KVxyXG4gIH1cclxuXHJcblxyXG4gIGNvbWJpbmVXaXRoQmFja2dyb3VuZChjYWxsYmFjaz86IEZ1bmN0aW9uKSB7XHJcbiAgICBjb25zdCBkb2MgPSB0aGlzLmRvY1xyXG4gICAgbGV0IGNhbnZhcyA9IGRvYy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgY2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGhcclxuICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHRcclxuXHJcbiAgICBsZXQgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJylcclxuXHJcbiAgICBpZiAoIWN0eCkgeyByZXR1cm4gfVxyXG5cclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5jYW52YXMsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodClcclxuXHJcbiAgICB0aGlzLmN0eC5kcmF3SW1hZ2UoY2FudmFzLCAwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KVxyXG4gICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soY2FudmFzLCBjdHgpXHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiByZW1vdmUgZG9tIHRoYXQgYWRkZWQgaW50byBib2R5LFxyXG4gICAqIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgcmVnaXN0ZXJlZFxyXG4gICAqL1xyXG4gIGRlc3Ryb3koKSB7XHJcbiAgICB0aGlzLmNhbnZhcy5wYXJlbnROb2RlICYmIHRoaXMuY2FudmFzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5jYW52YXMpXHJcbiAgICB0aGlzLm1vdXNlLnBhcmVudE5vZGUgJiYgdGhpcy5tb3VzZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubW91c2UpXHJcblxyXG4gICAgdGhpcy5pbWcuc3JjID0gJydcclxuXHJcbiAgICB0aGlzLmJpbmRlZEV2ZW50cy5mb3JFYWNoKHYgPT4ge1xyXG4gICAgICB2WzBdLnJlbW92ZUV2ZW50TGlzdGVuZXIodlsxXSwgdlsyXSwgZmFsc2UpXHJcbiAgICB9KVxyXG4gICAgLy8gZGVsZXRlIHRoaXNcclxuICB9XHJcbn1cclxuIl19
