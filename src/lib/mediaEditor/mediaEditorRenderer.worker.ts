// --isolated-modules
export {}

type EvtData = {
  type: 'requestFrame'
  imageData: ImageData
}

function renderFrame(imageData: ImageData): ImageData {
  return imageData
}

addEventListener('message', (event) => {
  const data: EvtData = event.data

  switch(data.type) {
    case 'requestFrame':
      const newImageData = renderFrame(data.imageData)
      postMessage({type: 'frameReady', imageData: newImageData}, [newImageData.data.buffer])
      break
  }
})
