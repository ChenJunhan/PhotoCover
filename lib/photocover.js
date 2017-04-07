const DEFAULT_OPTIONS = {
  RADIUS: 20,
  MAX_WIDTH: 800,
  COLOR: 'black',
  MOUSE: 'pen',
  PEN_BORDER_COLOR: 'red',
  ERASER_BORDER_COLOR: '#666',
  PEN: 'pen',
  ERASER: 'eraser'
}

class PhotoCover {
  constructor(selector) {
    this.radius = DEFAULT_OPTIONS.RADIUS
    this.maxWidth = DEFAULT_OPTIONS.MAX_WIDTH
    this.color = DEFAULT_OPTIONS.COLOR
    this.mouseType = DEFAULT_OPTIONS.MOUSE

    this.operateHistories = []

    this.img = document.querySelector(selector)

    this.win = window
    this.doc = document
    this.body = this.doc.body

    this.mouse
    this.width
    this.height
    this.left
    this.top
    this.canvas
    this.ctx

    this._init()
  }

  _init() {
    if (!this.img) {
      throw Error('No Image Selected')
      return
    }

    let [body, win, img] = [this.body, this.win, this.img]

    // initial canvas and its size and position
    win.addEventListener('load', ((e) => {
      this.width = img.width
      this.height = img.height

      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      this._async()

      this.canvas.width = img.width
      this.canvas.height = img.height

      body.appendChild(this.canvas)

      this._initMouse()

    }).bind(this), false)


    // async canvas position and size during browser resize
    win.addEventListener('resize', ((e) => {
      this._async()
    }).bind(this), false)


    let currentOperate = []

    let canvasMouseMove = ((e) => {
      currentOperate.push(this.drawByEvent(e))
    }).bind(this)

    // canvas down
    win.addEventListener('mousedown', ((e) => {
      currentOperate = []
      currentOperate.push(this.drawByEvent(e))

      win.addEventListener('mousemove', canvasMouseMove, false)
    }).bind(this), false)

    win.addEventListener('mouseup', ((e) => {
      win.removeEventListener('mousemove', canvasMouseMove, false)
      let coordinate = this.getCoordinateByEvent(e)
      let [x, y] = [e.pageX, e.pageY]

      if (this.isOnCanvas(x, y)) {
        this.operateHistories.push(currentOperate)
        currentOperate = []
      }
    }).bind(this), false)
  }

  // async x and y from image to canvas
  _async() {
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
  _initMouse(type) {
    let [body, win] = [this.body, this.win]
    let mouse = document.createElement('div')
    mouse.style.cssText = `
      display: none;
      position: absolute;
      left: 0;
      top: 0;
      width: ${this.radius * 2}px;
      height: ${this.radius * 2}px;
      border: 1px solid red;
      border-radius: 100%;
    `
    this.mouse = mouse

    body.appendChild(mouse)

    // change mouse style
    win.addEventListener('mousemove', ((e) => {
      let [x, y] = [e.pageX, e.pageY]
      let isOnCanvas = this.isOnCanvas(x, y)

      mouse.style.transform = `translate(${x - this.radius}px, ${y - this.radius}px)`

      if (!isOnCanvas) {
        mouse.style.display = 'none'
        body.style.cursor = 'default'
      } else {
        mouse.style.display = 'block'
        body.style.cursor = 'none'
      }

    }).bind(this), false)

  }

  setRadius(radius) {
    if (radius < 2 || radius > 100) {
      return
    }

    let mouse = this.mouse
    this.radius = radius

    mouse.style.width = radius * 2 + 'px'
    mouse.style.height = radius * 2 + 'px'
  }

  zoomIn(radius = 2) {
    this.setRadius(this.radius + radius)
  }

  zoomOut(radius = 2) {
    this.setRadius(this.radius - radius)
  }

  drawCircle(x, y, radius) {
    let ctx = this.ctx

    ctx.beginPath()
    ctx.arc(x + 1, y + 1, radius || this.radius, 0, 360)
    ctx.fill()
    ctx.closePath()
  }


  getCoordinateByEvent(event) {
    let x, y
    let [doc, body] = [this.doc, this.body]
    let canvas = this.canvas


    if (event.pageX || event.pageY) {
      x = event.pageX
      y = event.pageY
    } else {
      x = e.clientX + body.scrollLeft + doc.documentElement.scrollLeft
      y = e.clientY + body.scrollTop + doc.documentElement.scrollTop
    }

    x -= canvas.offsetLeft
    y -= canvas.offsetTop

    return [x, y]
  }

  drawByEvent(event) {
    if (!this.ctx) return

    let ctx = this.ctx
    let [x, y]= this.getCoordinateByEvent(event)

    if (this.mouseType === DEFAULT_OPTIONS.PEN) {
      this.drawCircle(x, y)
      return [DEFAULT_OPTIONS.PEN, x, y, this.radius]
    } else if (this.mouseType === DEFAULT_OPTIONS.ERASER) {
      x -= this.radius
      y -= this.radius
      let [w, h] = [this.radius * 2, this.radius * 2]
      ctx.clearRect(x, y, w, h)
      return [DEFAULT_OPTIONS.ERASER, x, y, w, h]
    }
  }

  isOnCanvas(x, y) {

    if (x < this.left || x > (this.left + this.width) || y < this.top || y > (this.top + this.height)) {
      return false
    } else {
      return true
    }
  }

  setMaxWidth(width) {
    this.maxWidth = width
  }

  setColor(color) {
    this.color = color
  }

  // pen, eraser
  setTool(tool) {
    this.mouseType = tool

    if (tool.toLowerCase() === DEFAULT_OPTIONS.PEN) {
      this.setPen()
    } else if (tool.toLowerCase() === DEFAULT_OPTIONS.ERASER) {
      this.setEraser()
    }
  }


  setPen() {
    let mouse = this.mouse
    Object.assign(mouse.style, {
      borderRadius: '100%',
      border: `1px solid ${DEFAULT_OPTIONS.PEN_BORDER_COLOR}`
    })

    this.mouseType = DEFAULT_OPTIONS.PEN
  }

  setEraser() {
    let mouse = this.mouse
    Object.assign(mouse.style, {
      borderRadius: 0,
      border: `1px dashed ${DEFAULT_OPTIONS.ERASER_BORDER_COLOR}`
    })

    this.mouseType = DEFAULT_OPTIONS.ERASER
  }

  undo() {
    let ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)
    this.operateHistories.pop()

    this.operateHistories.map((steps) => {
      steps.map((step) => {
        if (step[0] === DEFAULT_OPTIONS.PEN) {
          this.drawCircle.apply(this, step.slice(1))
        } else if (step[0] === DEFAULT_OPTIONS.ERASER) {
          ctx.clearRect.apply(ctx, step.slice(1))
        }
      })
    })
  }

}
