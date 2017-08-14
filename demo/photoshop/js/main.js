window.$ = document.querySelector.bind(document)

var isMobile = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent)
var click = isMobile ? 'touchend' : 'click'

Element.prototype.css = function (property, value) {
  this.style[property] = value
}

var switchRadio= function (name, classname) {
  var nodes = document.querySelectorAll('[name=' + name + ']')
  nodes.forEach(node => {
    node.addEventListener(click, function (e) {
      nodes.forEach(n => n.classList.remove(classname))
      node.classList.add(classname)
    })
  })
}


window.onload = function () {

  switchRadio('mouseType', 'selected')

  var draw = new PhotoCover('#originImg')

  $('#pen').addEventListener(click, function () {
    draw.setPen()
  }, false)

  $('#eraser').addEventListener(click, function () {
    draw.setEraser()
  }, false)

  $('#mosaic').addEventListener(click, function () {
    draw.setMosaic()
  }, false)
  $('#zoomIn').addEventListener(click, function () {
    draw.zoomIn()
  }, false)

  $('#zoomOut').addEventListener(click, function () {
    draw.zoomOut()
  }, false)

  $('#undo').addEventListener(click, function () {
    draw.undo()
  }, false)

  $('#save').addEventListener(click, function () {
    var dataurl = draw.getDataURL()
  }, false)

  $('.black').addEventListener(click, function () {
    draw.setColor('black')
    $('.colorPicker').css('color', 'black')
  }, false)

  $('.red').addEventListener(click, function () {
    draw.setColor('red')
    $('.colorPicker').css('color', 'red')
  }, false)

  $('.blue').addEventListener(click, function () {
    draw.setColor('blue')
    $('.colorPicker').css('color', 'blue')
  }, false)

  $('.lightBlue').addEventListener(click, function () {
    draw.setColor('#00ffff')
    $('.colorPicker').css('color', '#00ffff')
  }, false)

  $('.yellow').addEventListener(click, function () {
    draw.setColor('yellow')
    $('.colorPicker').css('color', 'yellow')
  }, false)

  $('.green').addEventListener(click, function () {
    draw.setColor('green')
    $('.colorPicker').css('color', 'green')
  }, false)

  $('.purple').addEventListener(click, function () {
    draw.setColor('purple')
    $('.colorPicker').css('color', 'purple')
  }, false)

  $('.white').addEventListener(click, function () {
    draw.setColor('white')
    $('.colorPicker').css('color', 'white')
  }, false)
}

window.onkeydown = function (e) {
  if (e.keyCode === 187 || e.key === '+') {
    $('#zoomIn').click()
  }

  if (e.keyCode === 189 || e.key === '_') {
    $('#zoomOut').click()
  }

  if (e.keyCode === 80 || e.key === 'p') {
    $('#pen').click()
  }

  if (e.keyCode === 69 || e.key === 'e') {
    $('#eraser').click()
  }

  if (e.keyCode === 90 || e.key === 'z') {
    $('#undo').click()
  }
}