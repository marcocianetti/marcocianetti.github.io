  /*
  Useful colors
  const chromaColors = [
    [120, 179, 96],
    [136, 189, 110],
    [113, 150, 80],
    [97, 116, 59],
    [83, 112, 44],
    [92, 123, 66],
    [59, 89, 42]
  ];
  */

(function(){

  // Variables for canvas and context
  let outputCanvas, outputContext, hiddenCanvas, hiddenContext;
  
  // Add event listener for the messages
  this.addEventListener('message', handleOnMessage);

  // Handle the worker message
  function handleOnMessage(event) {
    const { data } = event;
    if (!data) {
      return;
    }
  
    // Handle the action
    switch (data.action) {
      case 'CONFIG':
        config(data);
        break;
      case 'DRAW':
        draw(data);
        break;
    }
  }

  // Configure the worker
  function config(data) {
    if (!data.outputCanvas || !data.hiddenCanvas) {
      console.error('Worker - Missing some canvas');
    }

    outputCanvas = data.outputCanvas;
    outputContext = outputCanvas.getContext('2d');
    hiddenCanvas = data.hiddenCanvas;
    hiddenContext = hiddenCanvas.getContext('2d');
  }

  // Draw on output canvas
  function draw(data) {
    if (!data.sourceImageBitmap || !data.backgroundImageBitmap || !outputContext || !hiddenContext) {
      console.error('Worker - Missing images or context');
      return
    }

    // Draw next image
    outputContext.putImageData(getNextImageData(data.sourceImageBitmap, data.backgroundImageBitmap), 0, 0);

    // Close the bitmaps
    data.sourceImageBitmap.close();
    data.backgroundImageBitmap.close();
  }

  // Create the next image array of pixels
  function getNextImageData(image, backgroundImage) {

    // Draw the source image on hidden canvas and get its pixels array
    hiddenContext.drawImage(image, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
    const imageData = hiddenContext.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
  
    let data = imageData.data;
    let backgroundImageData;
  
    // Loop on every pixel
    for (let i = 0; i < data.length; i += 4) {
  
      // Check if its a fake pixel (chroma-key pixel)
      if (isFakePixel(data, i, 35)) {
  
        // If we have no background image data for this frame then we have to draw it
        if (!backgroundImageData) {
  
          // Draw the background image on hidden canvas and get its pixels array
          hiddenContext.drawImage(backgroundImage, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
          backgroundImageData = hiddenContext.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
        }
  
        // data = removePixel(data, i);
        data = mergePixel(data, backgroundImageData.data, i);
      }
    }
  
    imageData.data.set(data);
    return imageData;
  }

  function isFakePixel(data, index, perc) {
    const similarityPerc = 1 + perc / 100;
  
    const chromaKeyColor = [120, 179, 96];
  
    return (
      data[index] > (chromaKeyColor[0] / similarityPerc) && data[index] < (chromaKeyColor[0] * similarityPerc) && 
      data[index + 1] > (chromaKeyColor[1] / similarityPerc) && data[index + 1] < (chromaKeyColor[1] * similarityPerc) && 
      data[index + 2] > (chromaKeyColor[2] / similarityPerc) && data[index + 2] < (chromaKeyColor[2] * similarityPerc)
    );
  }
  
  function removePixel(data, index) {
    data[index + 3] = 0;
    return data;
  }
  
  function mergePixel(dataA, dataB, index) {
    dataA[index] = dataB[index];
    dataA[index + 1] = dataB[index + 1];
    dataA[index + 2] = dataB[index + 2];
    dataA[index + 3] = dataB[index + 3];
  
    return dataA;
  }
})();