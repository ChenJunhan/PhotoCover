enum MouseType { PEN, ERASER }

class PhotoCover {
  static DEFAULT_RADIUS:number = 20
  static DEFAULT_MAX_WIDTH:number = 800
  static DEFAULT_COLOR: string = 'black'
  static DEFAULT_PEN_BORDER_COLOR: string = 'red'
  static DEFAULT_ERASER_BORDER_COLOR:string = '#666'
  static DEFAULT_LINECAP: string = 'round'

  readonly isMobile = navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1

  // cache window, document and body for speed up performance
  win: Window = window
  doc: HTMLDocument = document
  body: HTMLElement = document.body

  mouse: HTMLDivElement   // mouse pointer on canvas
  canvas: HTMLCanvasElement = document.createElement('canvas')
  img: HTMLImageElement  // image that you want to change 

  ctx: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D

  width: number    // width of image after render
  height: number  // height of image after render
  left: number    // absolute left relative body of image
  top: number     // absolute top relative body of image

  // init value
  mouseType: MouseType = MouseType.PEN    // default mouse pointer
  radius =  PhotoCover.DEFAULT_RADIUS    // default radius of pen
  maxWidth = PhotoCover.DEFAULT_MAX_WIDTH     // default max width of image
  color = PhotoCover.DEFAULT_COLOR    // default color of canvas
  linecap = PhotoCover.DEFAULT_LINECAP    // default linecap of line on canvas

  histories: any[][] = []    // operate history
  bindedEvents: any[][] = []    // registered events [node, type, function]

  constructor(selector: HTMLImageElement | string) {

    if (typeof selector === 'object') { this.img = selector }
    else if (typeof selector === 'string') { this.img = document.querySelector(selector) as HTMLImageElement }
    
    // initial canvas and its size and position
    this.width = this.img.width
    this.height = this.img.height
    this.canvas.width = this.img.width
    this.canvas.height = this.img.height

    this.init()
  }

  private init(): void {

    let [body, win] = [this.body, this.win]

    this.async()
    body.appendChild(this.canvas)

    if (!this.isMobile) { this.initMouse() }

    // async canvas position and size during browser resize
    let resize = (() => {
      this.async()
    }).bind(this)
    win.addEventListener('resize', resize, false)
    this.bindedEvents.push([win, 'resize', resize])


    let currentOperate: any[][] = []

    let canvasMouseDown = ((e: any) => {
      e.preventDefault()

      const [x, y] = this.getCoordinateByEvent(e)

      currentOperate = []

      if (this.isOnCanvas(x, y, true)) {

        this.ctx.beginPath()
        currentOperate.push(['MOVE_TO', x, y])
        currentOperate.push(this.drawByEvent(e))

        this.ctx.beginPath()
        currentOperate.push(['MOVE_TO', x, y])

        if (!this.isMobile) { win.addEventListener('mousemove', canvasMouseMove, false) }
        else { win.addEventListener('touchmove', canvasMouseMove, false) }
      }
      
    }).bind(this)

    let canvasMouseMove = ((e: any) => {
      e.preventDefault()
      currentOperate.push(this.drawByEvent(e))
    }).bind(this)

    let canvasMouseUp = ((e: any) => {
      e.preventDefault()

      if (!this.isMobile) { win.removeEventListener('mousemove', canvasMouseMove, false) }
      else { win.removeEventListener('touchmove', canvasMouseMove, false) }
      
      let [x, y] = [e.pageX, e.pageY]

      if (this.isOnCanvas(x, y)) {
        this.histories.push(currentOperate)
        currentOperate = []
      }
    }).bind(this)

    // canvas down
    if (!this.isMobile) {
      win.addEventListener('mousedown', canvasMouseDown, false)
      this.bindedEvents.push([win, 'mousedown', canvasMouseDown])

      win.addEventListener('mouseup', canvasMouseUp, false)
      this.bindedEvents.push([win, 'mouseup', canvasMouseUp]) 
    } else {
      win.addEventListener('touchstart', canvasMouseDown, false)
      this.bindedEvents.push([win, 'touchstart', canvasMouseDown])

      win.addEventListener('touchend', canvasMouseUp, false)
      this.bindedEvents.push([win, 'touchend', canvasMouseUp])
    }
  }

  // async x and y from image to canvas
  private async() {
    let coordinate = this.img.getBoundingClientRect()
    this.top = coordinate.top
    this.left = coordinate.left

    this.canvas.style.cssText = `
      position: absolute;
      left: ${this.left + this.body.scrollLeft}px;
      top: ${this.top + this.body.scrollTop}px;
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
        mouse.style.display = 'block'
        body.style.cursor = 'none'
      }
    }).bind(this)

    // change mouse style
    if (!this.isMobile) {
      win.addEventListener('mousemove', mouseMove, false)
      this.bindedEvents.push([win, 'mousemove', mouseMove])
    } else {
      win.addEventListener('touchmove', mouseMove, false)
      this.bindedEvents.push([win, 'touchmove', mouseMove])
    }
  }

  setRadius(radius: number) {
    if (radius < 2 || radius > 100) {
      return
    }

    let mouse = this.mouse
    this.radius = radius

    mouse.style.width = radius * 2 + 'px'
    mouse.style.height = radius * 2 + 'px'
  }

  zoomIn(radius:number = 2) {
    this.setRadius(this.radius + radius)
  }

  zoomOut(radius:number = 2) {
    this.setRadius(this.radius - radius)
  }

  drawCircle(x: number, y: number, radius?: number): any[] {
    let ctx = this.ctx
    ctx.fillStyle = this.color;
    ctx.beginPath()
    ctx.arc(x + 1, y + 1, radius || this.radius, 0, 360)
    ctx.fill()
    ctx.closePath()

    return [MouseType.PEN, this.color, x, y, this.radius]
  }

  drawLine(x: number, y: number, radius?: number): any[] {
    const ctx = this.ctx

    ctx.lineCap = this.linecap
    ctx.lineJoin = 'round'
    ctx.strokeStyle = this.color
    ctx.lineWidth = (radius || this.radius) * 2
    ctx.lineTo(x, y)
    ctx.stroke()

    return [MouseType.PEN, this.color, x, y, this.radius]
  }

  drawByEvent(event: any): Array<any> {
    let ctx = this.ctx
    let [x, y] = this.getCoordinateByEvent(event)

    if (this.mouseType === MouseType.PEN) {
      this.drawLine(x, y)
      return [MouseType.PEN, this.color, x, y, this.radius]
    } else if (this.mouseType === MouseType.ERASER) {
      x -= this.radius
      y -= this.radius
      let [w, h] = [this.radius * 2, this.radius * 2]
      ctx.clearRect(x, y, w, h)
      return [MouseType.ERASER, x, y, w, h]
    } else {
      return []
    }
  }

  getCoordinateByEvent(event: any) {
    let x, y
    let [doc, body] = [this.doc, this.body]
    let canvas = this.canvas

    if (this.isMobile) { event = event.changedTouches[0] }

    if (event.pageX || event.pageY) {
      x = event.pageX
      y = event.pageY
    } else {
      x = event.clientX + body.scrollLeft + doc.documentElement.scrollLeft
      y = event.clientY + body.scrollTop + doc.documentElement.scrollTop
    }

    x -= canvas.offsetLeft
    y -= canvas.offsetTop

    return [x, y]
  }


  isOnCanvas(x: number, y: number, isRelative:boolean = false) {
    let body = this.body
    let scrollTop = body.scrollTop

    if (isRelative) {
      if (x < 0 || x > this.width || y < 0 || y > this.height) { return false }
      else { return true }
    } else {
      if (x < this.left || x > (this.left + this.width) || y < (scrollTop + this.top) || y > (scrollTop + this.top + this.height)) { return false }
      else { return true }
    }
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
    }
  }

  setPen() {
    (Object as any).assign(this.mouse.style, {
      borderRadius: '100%',
      border: `1px solid ${PhotoCover.DEFAULT_PEN_BORDER_COLOR}`
    })

    this.mouseType = MouseType.PEN
  }

  setEraser() {
    (Object as any).assign(this.mouse.style, {
      borderRadius: 0,
      border: `1px dashed ${PhotoCover.DEFAULT_ERASER_BORDER_COLOR}`
    })

    this.mouseType = MouseType.ERASER
  }

  undo() {
    let ctx = this.ctx
    let color = this.color

    ctx.save()

    ctx.clearRect(0, 0, this.width, this.height)
    this.histories.pop()

    this.histories.map((steps: Array<any>) => {
      steps.map((step: Array<any>) => {
        if (step[0] === MouseType.PEN) {
          this.color = step[1]
          this.drawLine(step[2], step[3], step[4])
        } else if (step[0] === MouseType.ERASER) {
          ctx.clearRect.apply(ctx, step.slice(1))
        } else if (step[0] === 'MOVE_TO') {
          ctx.beginPath()
          ctx.moveTo.apply(ctx, step.slice(1))
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

    let src = this.img.src

    this.getImageOriginSize(src, (width: number, height: number) => {
      let tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      let tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCtx.drawImage(this.img, 0, 0, width, height)
        tempCtx.drawImage(this.canvas, 0, 0, width, height)

        callback && callback(tempCanvas.toDataURL(type, quality))
      }
    })
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
