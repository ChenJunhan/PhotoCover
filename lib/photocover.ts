enum MouseType { PEN, ERASER, MOSAIC }

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

class PhotoCover {
  static DEFAULT_RADIUS:number = 20
  static DEFAULT_MAX_WIDTH:number = 800
  static DEFAULT_COLOR: string = 'black'
  static DEFAULT_PEN_BORDER_COLOR: string = 'red'
  static DEFAULT_ERASER_BORDER_COLOR:string = '#666'
  static DEFAULT_LINECAP: string = 'round'
  static DEFAULT_LINEJOIN: string = 'round'

  readonly isMobile = navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1

  // cache window, document and body for speed up performance
  win: Window = window
  doc: HTMLDocument = document
  body: HTMLElement = document.body

  mouse: HTMLDivElement   // mouse pointer on canvas
  canvas: HTMLCanvasElement = document.createElement('canvas')
  img: HTMLImageElement  // image that you want to change 

  ctx: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D

  // init value
  mouseType: MouseType = MouseType.PEN    // default mouse pointer
  radius =  PhotoCover.DEFAULT_RADIUS    // default radius of pen
  maxWidth = PhotoCover.DEFAULT_MAX_WIDTH     // default max width of image
  color = PhotoCover.DEFAULT_COLOR    // default color of canvas
  lineCap = PhotoCover.DEFAULT_LINECAP    // default linecap of line on canvas
  lineJoin = PhotoCover.DEFAULT_LINEJOIN // default lineJoin of line on canvas

  histories: any[][] = []    // operate history
  bindedEvents: any[][] = []    // registered events [node, type, function]
  historyChange: Event = new CustomEvent('historyChange', { detail: this.histories })

  constructor(selector: HTMLImageElement | string) {

    if (typeof selector === 'object') { this.img = selector }
    else if (typeof selector === 'string') { this.img = document.querySelector(selector) as HTMLImageElement }
    
    // initial canvas and its size and position
    this.canvas.width = this.img.width
    this.canvas.height = this.img.height

    this.init()
  }

  private init(): void {

    let [body, win, doc] = [this.body, this.win, this.doc]

    this.async()
    body.appendChild(this.canvas)

    if (!this.isMobile) { this.initMouse() }

    // async canvas position and size during browser resize
    let resize = (() => {
      this.async()
    }).bind(this)
    win.addEventListener('resize', resize, false)
    this.bindedEvents.push([win, 'resize', resize])


    // this.img.style.cssText = `opacity: 0.4`
    // this.img.style.opacity = '0'
    this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height)

    let currentOperate: any[][] = []

    let mouseDownOnCanvas: boolean = false
    let mosaicSelection: HTMLDivElement
    let startX: number
    let startY: number

    let canvasMouseDown = ((e: any) => {
      e.preventDefault()

      startX = e.pageX
      startY = e.pageY
      const [x, y] = this.getCoordinateByEvent(e)

      currentOperate = []

      if (this.isOnCanvas(e.pageX, e.pageY)) {
        mouseDownOnCanvas = true

        if (this.mouseType === MouseType.PEN || this.mouseType === MouseType.ERASER) {
          this.ctx.beginPath()
          currentOperate.push(['MOVE_TO', x, y])
          currentOperate.push(this.drawByEvent(e))

          this.ctx.beginPath()
          currentOperate.push(['MOVE_TO', x, y])


        } else if (this.mouseType === MouseType.MOSAIC) {
          mosaicSelection = doc.createElement('div')
          mosaicSelection.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${startY}px;
            width: 0;
            height: 0;
            border: 1px dashed #ddd;
            background-color: rgba(125, 125, 125, 0.5)

          `
          body.appendChild(mosaicSelection)
        }

        win.addEventListener(this.isMobile ? 'touchmove' : 'mousemove', canvasMouseMove, false)
      }
      
    }).bind(this)

    let canvasMouseMove = ((e: any) => {
      e.preventDefault()
      if (this.mouseType === MouseType.PEN || this.mouseType === MouseType.ERASER) {
        currentOperate.push(this.drawByEvent(e))
      } else if (this.mouseType === MouseType.MOSAIC) {
        let rect = this.limitRect(this.caculateRect(startX, startY, e.pageX, e.pageY))

        mosaicSelection.style.left = rect.left - 1 + 'px'
        mosaicSelection.style.top = rect.top - 1 + 'px'
        mosaicSelection.style.width = rect.width + 'px'
        mosaicSelection.style.height = rect.height + 'px'
      }
    }).bind(this)

    let canvasMouseUp = ((e: any) => {
      e.preventDefault()
      win.removeEventListener(this.isMobile ? 'touchmove': 'mousemove', canvasMouseMove, false)
      
      if (mouseDownOnCanvas) {
        mouseDownOnCanvas  = false
        if (this.mouseType === MouseType.PEN || this.mouseType === MouseType.ERASER) {
          this.histories.push(currentOperate)
          this.img.dispatchEvent(this.historyChange)
          currentOperate = []
        } else if (this.mouseType === MouseType.MOSAIC) {
          let rect = this.limitRect(this.caculateRect(startX, startY, e.pageX, e.pageY))
          let [x, y] = [rect.left - this.canvas.offsetLeft, rect.top - this.canvas.offsetTop] // coodinate relative canvas

          if (rect.width > 0 && rect.height > 0) {
            let imageData = this.ctx.getImageData(x, y, rect.width, rect.height)
            this.ctx.putImageData(this.mosaic(imageData), x, y, 0, 0, rect.width, rect.height)

            this.histories.push([[MouseType.MOSAIC, x, y, rect.width, rect.height]])
            this.img.dispatchEvent(this.historyChange)
          }

          body.removeChild(mosaicSelection)
        }

        if (this.mouseType === MouseType.ERASER) {
          this.combineWithBackground()
        }
      }
    }).bind(this)

    // canvas down
    win.addEventListener(this.isMobile ? 'touchstart': 'mousedown', canvasMouseDown, false)
    this.bindedEvents.push([win, this.isMobile ? 'touchstart': 'mousedown', canvasMouseDown])

    win.addEventListener(this.isMobile ? 'touchend': 'mouseup', canvasMouseUp, false)
    this.bindedEvents.push([win, this.isMobile ? 'touchend': 'mouseup', canvasMouseUp])
  }

  // async x and y from image to canvas
  private async() {
    this.canvas.style.cssText = `
      position: absolute;
      left: ${this.img.offsetLeft}px;
      top: ${this.img.offsetTop}px;
      use-select: none;
    `
  }

  // initial mouse shape where mouse on canvas
  private initMouse() {
    let [body, win] = [this.body, this.win]
    let mouse = document.createElement('div')
    mouse.style.cssText = `
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 10001;
      width: ${this.radius * 2}px;
      height: ${this.radius * 2}px;
      border: 1px solid red;
      border-radius: 100%;
    `
    this.mouse = mouse

    body.appendChild(mouse)

    let mouseMove = ((e: any) => {
      let [x, y] = [e.pageX, e.pageY]
      let isOnCanvas = this.isOnCanvas(x, y)

      mouse.style.transform = `translate(${x - this.radius - 1}px, ${y - this.radius - 1}px)` // minus border width of mouse type

      if (!isOnCanvas) {
        mouse.style.display = 'none'
        body.style.cursor = 'default'
      } else {
        if (this.mouseType === MouseType.MOSAIC) {
          mouse.style.display = 'none'
          body.style.cursor = 'crosshair'
        } else {
          mouse.style.display = 'block'
          body.style.cursor = 'none'
        }
      }
    }).bind(this)

    // change mouse style
    win.addEventListener(this.isMobile ? 'touchmove': 'mousemove', mouseMove, false)
    this.bindedEvents.push([win, this.isMobile ? 'touchmove': 'mousemove', mouseMove])
  }

  setRadius(radius: number) {
    if (radius < 2 || radius > 100) {
      return
    }

    this.radius = radius

    let mouse = this.mouse

    if (mouse) {
      mouse.style.width = radius * 2 + 'px'
      mouse.style.height = radius * 2 + 'px'
    }
  }

  zoomIn(radius:number = 2) {
    this.setRadius(this.radius + radius)
  }

  zoomOut(radius:number = 2) {
    this.setRadius(this.radius - radius)
  }


  lineTo(x: number, y: number): void {
    const ctx = this.ctx
    ctx.lineCap = this.lineCap
    ctx.lineJoin = 'round'
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.radius * 2
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  drawLine(x: number, y: number): any[] {
    this.ctx.globalCompositeOperation = 'source-over'
    this.lineCap = 'round'
    this.lineJoin = 'round'
    this.lineTo(x, y)
    return [MouseType.PEN, this.color, x, y, this.radius]
  }

  erase(x: number, y: number): any[] {
    this.ctx.globalCompositeOperation = 'destination-out'
    this.lineCap = 'round'
    this.lineJoin = 'round'
    this.lineTo(x, y)
    this.ctx.globalCompositeOperation = 'source-over'
    return [MouseType.ERASER, x, y, this.radius]
  }

  mosaic(imageData: ImageData): ImageData {
    const [doc] = [this.doc]

    const options = {
      resolution: 8 
    }

    let canvas = doc.createElement('canvas')
    let ctx = canvas.getContext('2d')

    if (!ctx) { return new ImageData(0, 0)}

    canvas.width = imageData.width
    canvas.height = imageData.height
    ctx.putImageData(imageData, 0, 0)

    let rows = canvas.height / options.resolution
    let cols = canvas.width / options.resolution
    let r, g, b, a

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {

        // let tempData = ctx.getImageData(col * options.resolution, row * options.resolution, 1, 1).data
        // r = tempData[0]
        // g = tempData[1]
        // g = tempData[2]
        // a = tempdata[3] / 255

        r = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 0]
        g = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 1]
        b = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 2]
        a = imageData.data[(row * options.resolution * canvas.width + col * options.resolution) * 4 + 3]

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        ctx.fillRect(col * options.resolution, row * options.resolution, options.resolution, options.resolution)
      }
    }

    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  drawByEvent(event: any): any[] {
    let [x, y] = this.getCoordinateByEvent(event)

    if (this.mouseType === MouseType.PEN) { return this.drawLine(x, y) }
    else if (this.mouseType === MouseType.ERASER) { return this.erase(x, y) }
    else { return [] }
  }

  getCoordinateByEvent(event: any) {
    let x, y
    if (this.isMobile) { event = event.changedTouches[0] }

    x = event.pageX - this.canvas.offsetLeft
    y = event.pageY - this.canvas.offsetTop

    return [x, y]
  }

  limitRect(rect: Rect): Rect {
    let newRect = JSON.parse(JSON.stringify(rect))

    if (rect.left < this.canvas.offsetLeft) {
      newRect.width = rect.left + rect.width - this.canvas.offsetLeft
      newRect.left = this.canvas.offsetLeft
    }

    if (rect.top < this.canvas.offsetTop) {
      newRect.height = rect.top + rect.height - this.canvas.offsetTop
      newRect.top = this.canvas.offsetTop
    }

    if (rect.left + rect.width > this.canvas.offsetLeft + this.canvas.clientWidth) {
      newRect.width = this.canvas.offsetLeft + this.canvas.clientWidth - rect.left
    }

    if (rect.top + rect.height > this.canvas.offsetTop + this.canvas.clientHeight) {
      newRect.height = this.canvas.offsetTop + this.canvas.clientHeight - rect.top
    }

    return newRect
  }

  caculateRect(startX: number, startY: number, endX: number, endY: number): Rect {
    let [w, h] = [endX - startX, endY - startY]

    let left = w < 0 ? startX - Math.abs(w):  startX
    let top = h < 0 ? startY - Math.abs(h): startY

    return {
      left: left,
      top: top,
      width: Math.abs(w),
      height: Math.abs(h)
    }
  }

  isOnCanvas(pageX: number, pageY: number): boolean {
    if (
      pageX < this.img.offsetLeft ||
      pageX > (this.img.offsetLeft + this.img.width) ||
      pageY < this.img.offsetTop ||
      pageY > (this.img.offsetTop + this.img.height)
    ) { return false}

    return true
  }

  setMaxWidth(width: number) {
    this.maxWidth = width
  }

  setColor(color: string) {
    this.color = color
  }

  /**
   * set tool as mouse type
   * @param tool MouseType
   */
  setTool(tool: MouseType) {
    this.mouseType = tool

    if (tool === MouseType.PEN) {
      this.setPen()
    } else if (tool === MouseType.ERASER) {
      this.setEraser()
    } else if (tool = MouseType.MOSAIC) {
    }
  }

  setPen() {
    if (this.mouse) {
      (Object as any).assign(this.mouse.style, {
        borderRadius: '100%',
        border: `1px solid ${PhotoCover.DEFAULT_PEN_BORDER_COLOR}`
      })
    }

    this.mouseType = MouseType.PEN
  }

  setEraser() {
    if (this.mouse) {
      (Object as any).assign(this.mouse.style, {
        borderRadius: '100%',
        border: `1px dashed ${PhotoCover.DEFAULT_ERASER_BORDER_COLOR}`
      })
    }

    this.mouseType = MouseType.ERASER
  }

  setMosaic() {
    this.mouseType = MouseType.MOSAIC
  }

  undo() {
    let ctx = this.ctx
    let color = this.color

    ctx.save()

    // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height)
    this.histories.pop()
    this.img.dispatchEvent(this.historyChange)

    this.histories.map((steps: Array<any>) => {
      steps.map((step: Array<any>) => {
        if (step[0] === MouseType.PEN) {
          this.color = step[1]
          this.setRadius(step[4])
          this.drawLine(step[2], step[3])
        } else if (step[0] === MouseType.ERASER) {
          this.setRadius(step[3])
          this.erase(step[1], step[2])
          this.combineWithBackground()
        } else if (step[0] === 'MOVE_TO') {
          ctx.beginPath()
          ctx.moveTo.apply(ctx, step.slice(1))
        } else if (step[0] === MouseType.MOSAIC) {
          let imageData = this.ctx.getImageData(step[1], step[2], step[3], step[4])
          this.ctx.putImageData(this.mosaic(imageData), step[1], step[2], 0, 0, step[3], step[4])
        }
      })
    })

    this.color = color
    ctx.restore()
  }


  /**
   * get image origin size
   * @param  {String}   src      iamge source url
   * @param  {Function} callback callback function, width as first parameter and height as second
   * @return {undefined}
   */
  getImageOriginSize(src: string, callback?: Function) {
    let img = new Image()

    img.onload = () => {
      let width = img.width
      let height = img.height

      callback && callback(width, height)
    }

    img.src = src
  }

  getDataURL(type = 'image/jpeg', quality = 0.8, callback?: Function) {
    this.combineWithBackground((canvas: any) => {
      callback && callback(canvas.toDataURL(type, quality))
    })

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
  }


  combineWithBackground(callback?: Function) {
    const doc = this.doc
    let canvas = doc.createElement('canvas')
    canvas.width = this.canvas.width
    canvas.height = this.canvas.height

    let ctx = canvas.getContext('2d')

    if (!ctx) { return }

    ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height)
    ctx.drawImage(this.canvas, 0, 0, canvas.width, canvas.height)

    this.ctx.drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height)
    callback && callback(canvas, ctx)
  }

  /**
   * remove dom that added into body,
   * remove all events that registered
   */
  destroy() {
    this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas)
    this.mouse.parentNode && this.mouse.parentNode.removeChild(this.mouse)

    this.img.src = ''

    this.bindedEvents.forEach(v => {
      v[0].removeEventListener(v[1], v[2], false)
    })
    // delete this
  }
}
