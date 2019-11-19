// SCREEN CAPTURE STUFF
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
// IFRAME COMM: https://gist.github.com/pbojinov/8965299
// ALSO https://sokolskynikita.github.io/cross-domain-iframe-communication/
import adapter from 'webrtc-adapter';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';
// possible croppers: https://www.npmjs.com/package/cropperjs
// https://www.npmjs.com/package/react-image-crop

let TESTAREA;
let VIDEO = document.createElement('video');
let CANVAS = document.createElement('canvas');
let BUTTON = document.createElement('button');
let CROPDIV = document.createElement('div');
let PHOTO = document.createElement('img');
PHOTO.style.maxWidth = '100%';

let displayMediaOptions = {
  video: {
    cursor: 'never'
  },
  audio: false
};

let streaming = false;
let width = 640;
let height = 0;

function DoTest() {
  console.log('Testing Screen Capturing');
  TESTAREA = document.getElementById('app-container');
  if (!TESTAREA) {
    console.warn(`Could not find element 'testout'...aborting`);
    return;
  }
  VIDEO.addEventListener(
    'canplay',
    function(ev) {
      if (!streaming) {
        height = VIDEO.videoHeight / (VIDEO.videoWidth / width);
        VIDEO.setAttribute('width', width);
        VIDEO.setAttribute('height', height);
        VIDEO.setAttribute('width', width);
        VIDEO.setAttribute('height', height);
        streaming = true;
      }
    },
    false
  );

  BUTTON.innerText = 'CAPTURE';
  BUTTON.addEventListener(
    'click',
    function(ev) {
      TakePicture();
      StopCapture();
      TESTAREA.removeChild(BUTTON);
      TESTAREA.removeChild(VIDEO);
      const cropper = new Cropper(PHOTO, {
        aspectRatio: 16 / 9,
        crop(event) {
          console.log(event.detail.x);
          console.log(event.detail.y);
          console.log(event.detail.width);
          console.log(event.detail.height);
          console.log(event.detail.rotate);
          console.log(event.detail.scaleX);
          console.log(event.detail.scaleY);
        }
      });
      ev.preventDefault();
    },
    false
  );
  TESTAREA.append(BUTTON);
  TESTAREA.insertAdjacentHTML('beforeend', '<br>');
  TESTAREA.append(VIDEO);
  CROPDIV.append(PHOTO);
  TESTAREA.append(CROPDIV);

  StartCapture(displayMediaOptions);
}

function ClearPhoto() {
  var context = CANVAS.getContext('2d');
  context.fillStyle = '#AAA';
  context.fillRect(0, 0, CANVAS.width, CANVAS.height);

  var data = CANVAS.toDataURL('image/png');
  PHOTO.setAttribute('src', data);
}

function TakePicture() {
  var context = CANVAS.getContext('2d');
  if (width && height) {
    CANVAS.width = width;
    CANVAS.height = height;
    context.drawImage(VIDEO, 0, 0, width, height);

    var data = CANVAS.toDataURL('image/png');
    PHOTO.setAttribute('src', data);
  } else {
    ClearPhoto();
  }
}

async function StartCapture(displayMediaOptions) {
  let captureStream = null;

  try {
    // for compatibility see
    // https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    } else {
      console.log('!!! no navigator.mediaDevices', window.navigator);
      if (location.hostname !== 'localhost')
        console.log('!!! only works from localhost/secure server');
    }
  } catch (err) {
    console.error('Error: ' + err);
  }
  VIDEO.srcObject = captureStream;
  VIDEO.autoplay = true;
  return captureStream;
}

function StopCapture(evt) {
  let tracks = VIDEO.srcObject.getTracks();

  tracks.forEach(track => track.stop());
  VIDEO.srcObject = null;
}

function DumpOptionsInfo() {
  const videoTrack = VIDEO.srcObject.getVideoTracks()[0];

  console.info('Track settings:');
  console.info(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.info('Track constraints:');
  console.info(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

export default {
  DoTest
};
