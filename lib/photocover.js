const DEFAULT_OPTIONS = {
  RADIUS: 20,
  MAX_WIDTH: 800,
  COLOR: 'black',
  MOUSE: 'circle'
}

class PhotoCover {
  constructor(selector) {
    this.radius = DEFAULT_OPTIONS.RADIUS
    this.maxWidth = DEFAULT_OPTIONS.MAX_WIDTH
    this.color = DEFAULT_OPTIONS.COLOR
    this.mouseType = DEFAULT_OPTIONS.MOUSE

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

    let [body, win] = [this.body, this.win]

    // initial canvas and its size and position
    this.img.addEventListener('load', ((e) => {
      this.width = e.target.width
      this.height = e.target.height

      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      this._async()

      body.appendChild(this.canvas)

      this._initMouse()

    }).bind(this), false)

    // async canvas position and size during browser resize
    win.addEventListener('resize', ((e) => {
      this._async()
    }).bind(this), false)


    let canvasMouseMove = ((e) => {
      this.drawByEvent(e)
    }).bind(this)

    // canvas down
    win.addEventListener('mousedown', ((e) => {
      this.drawByEvent(e)

      win.addEventListener('mousemove', canvasMouseMove, false)
    }).bind(this), false)

    win.addEventListener('mouseup', ((e) => {
      win.removeEventListener('mousemove', canvasMouseMove, false)
    }).bind(this), false)
  }

  // async the width, height, x and y of image to canvas
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

    this.width = this.canvas.width = this.img.width
    this.height = this.canvas.height = this.img.height
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
      console.log(e)
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

  drawCircle(x, y) {
    let ctx = this.ctx

    ctx.beginPath()
    ctx.arc(x + 1, y + 1, this.radius, 0, 360)
    ctx.fill()
    ctx.closePath()
  }


  drawByEvent(event) {
    if (!this.ctx) return

    let [x, y, ctx] = [event.pageX, event.pageY, this.ctx]
    let isOnCanvas = this.isOnCanvas(x, y)

    let canvasX = x - this.left
    let canvasY = y - this.top

    if (isOnCanvas) {
      this.drawCircle(canvasX, canvasY)
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
}
