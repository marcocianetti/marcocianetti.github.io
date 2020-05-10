function onWindowLoad(callback) {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

// Elements
let playButtonEl,
  sourceVideoEl,
  backgroundVideoEl,
  outputCanvasEl,
  chromeOnlyInfoBoxEl;

let sourceImageCapture, backgroundImageCapture, worker;

let maxVideoSize = {
  width: 0,
  height: 0,
};

// Variables to check if all videos are loaded
let sourceVideoLoaded, backgroundVideoLoaded = false;

// Variable to check if worker is configured
let isWorkerConfig = false;

let isPlaying = false;

function init() {

  // Source video
  sourceVideoEl = document.getElementById('source-video');

  // Background video
  backgroundVideoEl = document.getElementById('background-video');

  // Play button
  playButtonEl = document.getElementById('play-button');

  // Canvas for the output
  outputCanvasEl = document.getElementById('output-canvas');

  // Info for Chrome only support
  chromeOnlyInfoBoxEl = document.getElementById('chrome-only-info-box');

  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (!isChrome) {
    playButtonEl.classList.add('hidden');
    chromeOnlyInfoBoxEl.classList.remove('hidden');
  }

  // When all videos are loaded we can enable the UI
  sourceVideoEl.addEventListener('loadeddata', handleVideoLoaded);
  backgroundVideoEl.addEventListener('loadeddata', handleVideoLoaded);
}

function handleVideoLoaded(event) {
  switch (event.srcElement.id) {
    case 'source-video':
      sourceVideoLoaded = true;
      break;
    case 'background-video':
      backgroundVideoLoaded = true;
      break;
  }

  // If all videos are loaded then we can init the video stuff
  if (sourceVideoLoaded && backgroundVideoLoaded) {
    initVideoElements();
  }
}

function initVideoElements() {
  // Load the worker
  worker = new Worker('/assets/js/index.worker.js');

  if ((sourceVideoEl.videoWidth / sourceVideoEl.videoHeight) !== (backgroundVideoEl.videoWidth / backgroundVideoEl.videoHeight)) {
    console.error('Videos have different ratio', sourceVideoEl.videoWidth, sourceVideoEl.videoHeight, backgroundVideoEl.videoWidth, backgroundVideoEl.videoHeight);
    return;
  }

  if (sourceVideoEl.videoWidth > backgroundVideoEl.videoWidth) {
    maxVideoSize.width = sourceVideoEl.videoWidth;
    maxVideoSize.height = sourceVideoEl.videoHeight;
  } else {
    maxVideoSize.width = backgroundVideoEl.videoWidth;
    maxVideoSize.height = backgroundVideoEl.videoHeight;
  }
  
  outputCanvasEl.width = maxVideoSize.width;
  outputCanvasEl.height = maxVideoSize.height;

  // Get image capture
  sourceImageCapture = new ImageCapture(sourceVideoEl.captureStream().getVideoTracks()[0]);
  backgroundImageCapture = new ImageCapture(backgroundVideoEl.captureStream().getVideoTracks()[0]);

  // Enable the play button
  playButtonEl.removeAttribute('disabled');
  playButtonEl.addEventListener('click', handleOnPlayButtonClick);

  sourceVideoEl.addEventListener('play', handleOnSourceVideoPlay);
}

function createHiddenCanvas() {
  const hiddenCanvas = document.createElement('canvas');
  
  hiddenCanvas.width = maxVideoSize.width;
  hiddenCanvas.height = maxVideoSize.height;
  hiddenCanvas.style.height = sourceVideoEl.getBoundingClientRect().height;
  hiddenCanvas.style.width = sourceVideoEl.getBoundingClientRect().width;

  return hiddenCanvas;
}

async function drawFrame() {
  if (!isPlaying) {
    return;
  }

  try {
    const sourceImageBitmap = await sourceImageCapture.grabFrame();
    const backgroundImageBitmap = await backgroundImageCapture.grabFrame();
    worker.postMessage(
      {
        action: 'DRAW',
        sourceImageBitmap,
        backgroundImageBitmap,
      }, 
      [sourceImageBitmap, backgroundImageBitmap]
    );
  } catch (err) {
    console.error(err);
  }

  requestAnimationFrame(drawFrame);
}

function handleOnPlayButtonClick() {
  if (isPlaying) {
    sourceVideoEl.pause();
    backgroundVideoEl.pause();
    playButtonEl.innerText = 'Avvia';
    playButtonEl.classList.add('button--accent');
    playButtonEl.classList.remove('button--outlined');
  } else {
    sourceVideoEl.play();
    backgroundVideoEl.play();
    playButtonEl.innerText = 'Pausa';
    playButtonEl.classList.add('button--outlined');
    playButtonEl.classList.remove('button--accent');
    
    // Scroll to output canvas
    setTimeout(function() {
      outputCanvasEl.scrollIntoView({
        behavior: 'smooth',
      });
    }, 0);
  }

  // Update the playing state
  isPlaying = !isPlaying;
}

function handleOnSourceVideoPlay() {
  
  // If worker is not configured then configure it
  if (!isWorkerConfig) {
    
    // Show the output canvas
    outputCanvasEl.classList.remove('hidden');

    // Prepare the canvas for the worker
    const outputCanvas = outputCanvasEl.transferControlToOffscreen();
    const hiddenCanvas = createHiddenCanvas().transferControlToOffscreen();
   
    // Init the worker
    worker.postMessage({ 
        action: 'CONFIG',
        outputCanvas, 
        hiddenCanvas,
      }, 
      [outputCanvas, hiddenCanvas],
    );

    isWorkerConfig = true;
  }

  requestAnimationFrame(drawFrame);
}

// Start here
onWindowLoad(init);