function onWindowLoad(callback) {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

let videoSourceEl,
  tempVideoSourceEl,
  outputCanvasEl,
  tempCanvasEl;

let outputCanvasContext,
  tempCanvasContext;

function init() {

  const worker = new Worker('/assets/js/worker.js');
  worker.postMessage('Hola');
  
  // Source video
  videoSourceEl = document.getElementById('video-source');
  
  outputCanvasEl = document.getElementById('output-canvas');
  outputCanvasEl.width = videoSourceEl.getBoundingClientRect().width;
  outputCanvasEl.height = videoSourceEl.getBoundingClientRect().height;
  outputCanvasContext = outputCanvasEl.getContext('2d');

  const offscreenCanvasEl = outputCanvasEl.transferControlToOffscreen();
  worker.postMessage({ canvas: offscreenCanvasEl }, [offscreenCanvasEl]);

  // Create fake canvas
  tempCanvasEl = document.createElement('canvas');
  tempCanvasEl.setAttribute('width', videoSourceEl.getBoundingClientRect().width);
  tempCanvasEl.setAttribute('height', videoSourceEl.getBoundingClientRect().height);
  tempCanvasContext = tempCanvasEl.getContext('2d');

  // Background video
  tempVideoSourceEl = document.getElementById('video-background');
  tempVideoSourceEl.setAttribute('width', videoSourceEl.getBoundingClientRect().width);
  tempVideoSourceEl.setAttribute('height', videoSourceEl.getBoundingClientRect().height);

  videoSourceEl.addEventListener('play', handleOnVideoSourcePlay);
}

function handleOnVideoSourcePlay() {
  return;
  tempCanvasContext.drawImage(videoSourceEl, 0, 0, videoSourceEl.getBoundingClientRect().width, videoSourceEl.getBoundingClientRect().height);
  let frame = tempCanvasContext.getImageData(0, 0, videoSourceEl.getBoundingClientRect().width, videoSourceEl.getBoundingClientRect().height);

  // Change background
  for (let i = 0; i < frame.data.length / 4; i++) {
    let r = frame.data[i * 4 + 0];
    let g = frame.data[i * 4 + 1];
    let b = frame.data[i * 4 + 2];

    if (r > 70 && r < 160 && g > 95 && g < 220 && b > 25 && b < 150) {
      frame = addBackgroundPixel(frame, i);
      // frame = removePixel(frame, i);
    }
  }

  outputCanvasContext.putImageData(frame, 0, 0);
  requestAnimationFrame(handleOnVideoSourcePlay, 0);
}

function removePixel(frame, index) {
  // frame.data[index * 4 + 0] = 0;
  // frame.data[index * 4 + 1] = 0;
  // frame.data[index * 4 + 2] = 0;
  frame.data[index * 4 + 3] = 0;

  return frame;
}

function addBackgroundPixel(frame, index) {
  tempCanvasContext.drawImage(tempVideoSourceEl, 0, 0, tempVideoSourceEl.width, tempVideoSourceEl.height);
  const backgroundFrame = tempCanvasContext.getImageData(0, 0, tempVideoSourceEl.width, tempVideoSourceEl.height);

  frame.data[index * 4 + 0] = backgroundFrame.data[index * 4 + 0];
  frame.data[index * 4 + 1] = backgroundFrame.data[index * 4 + 1];
  frame.data[index * 4 + 2] = backgroundFrame.data[index * 4 + 2];
  frame.data[index * 4 + 3] = backgroundFrame.data[index * 4 + 3];

  return frame;
}

onWindowLoad(init);