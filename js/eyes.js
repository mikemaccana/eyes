
var log = console.log.bind(console),
  query = document.querySelector.bind(document),
  queryAll = document.querySelectorAll.bind(document);

NodeList.prototype.forEach = Array.prototype.forEach

// https://www.mashape.com/orbeus/face-and-scene-recognition-provided-by-rekognition-com#!endpoint-Face
var key = 'notarealkey',
 secret = 'notarealsecret',
 mashapeAuthorization = 'notarealmashapeauthorization'

var EYE_SIZE_TO_DISTANCE_RATIO = 5;

var removeEyes = function(image){
  var replaceEyes = function(image, eyeData){
    var replaceElement = function(oldElement, newElement){
      oldElement.parentNode.replaceChild(newElement, oldElement);
    }

    var cutCircle = function(context, x, y, radius){
      // See https://developer.mozilla.org/samples/canvas-tutorial/6_1_canvas_composite.html
      log('Removing eye', x, y)
      context.globalCompositeOperation = 'destination-out'
      context.arc(x, y, radius, 0, Math.PI*2, true);
      context.fill();
      context.closePath();
    }

    var canvas = document.createElement('canvas');

    // Canvas is whatever size actual picture size is
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    log('Canvas full size', canvas.width, canvas.height)

    // Canvas element is styled to size of image element (eg, handle retina)
    canvas.style.height = image.height+'px';
    canvas.style.width = image.width+'px';
    log('Canvas size', image.width, image.height)

    var context = canvas.getContext("2d");

    context.drawImage(image,0,0);

    eyeData.forEach(function(eyeDatum){
      cutCircle(context, eyeDatum.leftEye.x, eyeDatum.leftEye.y, eyeDatum.eyeSize)
      cutCircle(context, eyeDatum.rightEye.x, eyeDatum.rightEye.y, eyeDatum.eyeSize)
    })

    replaceElement(image, canvas)


  }

  superagent
  .get('https://orbeus-rekognition.p.mashape.com')
  .set('X-Mashape-Authorization', mashapeAuthorization)
  .query({
    api_key: key,
    api_secret: secret,
    jobs: 'face_part',
    urls: image.src
  })
  .end(function(response){
    if (response.ok) {
      var results = JSON.parse(response.text)

      if ( results.face_detection && results.face_detection.length ) {
        log(results)
        var eyeData = []; // leftEye, rightEye, eyeSize
        log('Found', results.face_detection.length,'faces')
        results.face_detection.forEach(function(result){
          var leftEye = result.eye_left;
          var rightEye = result.eye_right;
          var eyeDistanceX = rightEye.x - leftEye.x
          var eyeDistanceY = rightEye.y - leftEye.y
          // API doesn't have eye size, so we use Pythagoras
          // to get the hypotenuse between the eyes, then divide by EYE_SIZE_TO_DISTANCE_RATIO
          var eyeSize = ( Math.sqrt(Math.pow(eyeDistanceX,2) + Math.pow(eyeDistanceY,2)) ) / EYE_SIZE_TO_DISTANCE_RATIO;

          eyeData.push({
            leftEye: leftEye,
            rightEye: rightEye,
            eyeSize: eyeSize
          })
        })

        replaceEyes(image, eyeData)

      }
    } else {
      log(response.error)
    }
  });
}

log("Removing eyes, because they're not real")
queryAll("img").forEach(function(image){
  removeEyes(image)
})
