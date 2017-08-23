
var click = $.isMobile ? 'touchend' : 'click'

$(window).on('load', function () {
  var draw = new PhotoCover('#originImg')


  $('[name=mouseType').on('click', function (e) {
    $('[name=mouseType]').removeClass('selected')
    $(this).addClass('selected')
  })

  // history change, right side bar
  $('#originImg').on('historyChange', e => {
    let histories = e.detail

    let lis = histories.reduce((previous, his) => {
      let className = ''
      let text = ''
      let color = ''
      let operate = his.length > 1 ? his[1] : his[0]

      switch(operate[0]) {
        case MouseType.GRAFFITI: className = 'pencil'; text = 'Graffiti'; color = `<i class="fa fa-stop" style="color: ${operate[1]}"></i>`; break;
        case MouseType.ERASER: className = 'eraser'; text = 'Eraser'; break;
        case MouseType.MOSAIC: className = 'th'; text = 'Mosaic'; break;
        default: className = 'question'; text = 'Other';;
      }

      return previous += `<li"><i class="fa fa-${className}"></i>${text}${color}</li>`
    }, '')

    $('#history')[0].innerHTML = lis
  }, false)


  // graffiti
  
  // radius setting
  var watchObject = {
    graffiti: {
      radius: $('#textGraffitiRadius')[0].value || 20,
    },
    eraser: {
      radius: $('#textEraserRadius')[0].value || 20
    },
    mosaic: {
      resolution: 8
    }
  }
  watchObject.graffiti.watch('radius', function (id, oldval, newval) {

    var radius = +newval.toString().replace(/\D/g, '');

    if (radius > 100) {
      radius = 100
    } else if (radius <= 0) [
      radius = 1
    ]

    $('#rangeGraffitiRadius')[0].value = radius;
    $('#textGraffitiRadius')[0].value = radius 
    draw.setRadius(radius)

    return radius;
  })
  $('#buttonGraffitiIncreaseRadius').on('click', function () {
    watchObject.graffiti.radius += 1;
  })
  $('#buttonGraffitiDescreaseRadius').on('click', function () {
    watchObject.graffiti.radius -= 1;
  })
  $('#rangeGraffitiRadius').on('change', function (e) {
    watchObject.graffiti.radius = e.target.value;
  })
  $('#textGraffitiRadius').on('keyup', function(e) {
    watchObject.graffiti.radius = e.target.value;
  })

  // graffiti button 
  // todo bugfix watchObject.graffitiRadius issue
  $('#graffiti').on(click, function () {
    draw.setGraffiti()
    draw.setRadius($('#textGraffitiRadius')[0].value)
    $('#graffitiToolbox').addClass('show').siblings().removeClass('show')
  }, false)

  
  // eraser setting
  watchObject.eraser.watch('radius', function (id, oldval, newval) {
    
    var radius = +newval.toString().replace(/\D/g, '');

    if (radius > 100) {
      radius = 100
    } else if (radius <= 0) [
      radius = 1
    ]

    $('#rangeEraserRadius')[0].value = radius;
    $('#textEraserRadius')[0].value = radius 
    draw.setRadius(radius)

    return radius;
  })
  $('#buttonEraserIncreaseRadius').on('click', function () {
    watchObject.eraser.radius += 1;
  })
  $('#buttonEraserDescreaseRadius').on('click', function () {
    watchObject.eraser.radius -= 1;
  })
  $('#rangeEraserRadius').on('change', function (e) {
    watchObject.eraser.radius = e.target.value;
  })
  $('#textEraserRadius').on('keyup', function(e) {
    watchObject.eraser.radius = e.target.value;
  })

  // eraser button
  $('#eraser').on(click, function () {
    draw.setEraser()
    draw.setRadius($('#textEraserRadius')[0].value)
    $('#eraserToolbox').addClass('show').siblings().removeClass('show')
  }, false)


  // mosaic setting
  watchObject.mosaic.watch('resolution', function (id, oldval, newval) {
    
    var radius = +newval.toString().replace(/\D/g, '');

    if (radius > 100) {
      radius = 100
    } else if (radius <= 0) [
      radius = 1
    ]

    $('#rangeMosaicResolution')[0].value = radius;
    $('#textMosaicResolution')[0].value = radius 
    draw.setResolution(radius)

    return radius;
  })
  $('#buttonMosaicIncreaseResolution').on('click', function () {
    watchObject.mosaic.resolution += 1;
  })
  $('#buttonMosaicDescreaseResolution').on('click', function () {
    watchObject.mosaic.resolution -= 1;
  })
  $('#rangeMosaicResolution').on('change', function (e) {
    watchObject.mosaic.resolution = e.target.value;
  })
  $('#textMosaicResolution').on('keyup', function(e) {
    watchObject.mosaic.resolution = e.target.value;
  })

  $('#mosaic').on(click, function () {
    draw.setMosaic()
    draw.setResolution($('#textMosaicResolution')[0].value)
    $('#mosaicToolbox').addClass('show').siblings().removeClass('show')
  }, false)



  // color setting
  $('#colorPicker').on('change', function (e) {
    draw.setColor(e.target.value);
  })

  $('#undo').on(click, function () {
    draw.undo()
  }, false)

  $('#save').on(click, function () {
    var dataurl = draw.getDataURL()
  }, false)

  // choose History
  $('#history').on(click,'li', (e, index) => {
    currentStep = draw.histories.slice(0, index+1);
    // addClass 'active'
    if (e.target.tagName === 'LI') {
      e.target.className = 'active';
      $(e.target).siblings().removeClass('active');
    }else {
      e.target.parentNode.className = 'active';
      $(e.target.parentNode).siblings().removeClass('active');
    }
    draw.ctx.save();
    // ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    draw.ctx.drawImage(draw.img, 0, 0, draw.canvas.width, draw.canvas.height);
    currentStep.map(function (steps) {
      steps.map((step) => {
        if (step[0] === MouseType.GRAFFITI) {
            draw.color = step[1];
            draw.setRadius(step[4]);
            draw.drawLine(step[2], step[3]);
        }
        else if (step[0] === MouseType.ERASER) {
            draw.setRadius(step[3]);
            draw.erase(step[1], step[2]);
            draw.combineWithBackground();
        }
        else if (step[0] === 'MOVE_TO') {
            draw.ctx.beginPath();
            draw.ctx.moveTo.apply(draw.ctx, step.slice(1));
        }
        else if (step[0] === MouseType.MOSAIC) {
            var imageData = draw.ctx.getImageData(step[1], step[2], step[3], step[4]);
            draw.ctx.putImageData(draw.mosaic(imageData), step[1], step[2], 0, 0, step[3], step[4]);
        }
      })
    });
    draw.ctx.restore();
  })
 
})

$(window).on('keydown', function (e) {
  if (e.keyCode === 187 || e.key === '+') {
    $('#zoomIn').click()
  }

  if (e.keyCode === 189 || e.key === '_') {
    $('#zoomOut').click()
  }

  if (e.keyCode === 80 || e.key === 'p') {
    $('#graffiti').click()
  }

  if (e.keyCode === 69 || e.key === 'e') {
    $('#eraser').click()
  }

  if (e.keyCode === 90 || e.key === 'z') {
    $('#undo').click()
  }

  if (e.key === 'm') {
    $('#mosaic').click()
  }
})
