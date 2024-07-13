'use strict';

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs;

const recordingFormat = document.querySelector('#recordingFormat');
const targetFormat = document.querySelector('#targetFormat');

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const startRecordingButton = document.querySelector('button#startRecording');
startRecordingButton.addEventListener('click', () => {
  if (startRecordingButton.textContent === '开始录制') {
    startRecording();
  } else {
    stopRecording();
    startRecordingButton.textContent = '开始录制';
    playButton.disabled = false;
    downloadButton.disabled = false;
    recordingFormat.disabled = false;
    targetFormat.disabled = false;
  }
});

function getSelectedTargetMimeType() {
    return targetFormat.options[targetFormat.selectedIndex].value;
}

function getSelectedTargetVideoType() {
    return getSelectedTargetMimeType().split(';', 1)[0];
}

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
  const videoType = getSelectedTargetVideoType();
  const superBuffer = new Blob(recordedBlobs, {type: videoType});
  console.log('Playing blob: ', superBuffer);
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  const videoType = getSelectedTargetVideoType();
  const blob = new Blob(recordedBlobs, {type: videoType});
  console.log('Downloading blob', blob);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = videoType === 'video/mp4' ? 'test.mp4' : 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleDataAvailable(event) {
  console.log('handleDataAvailable', event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function getSupportedMimeTypes() {
  const possibleTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=av01,opus',
    'video/mp4;codecs=h264,aac',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    ''
  ];
  return possibleTypes.filter(mimeType => {
    return MediaRecorder.isTypeSupported(mimeType);
  });
}

function getOptionalMimeTypes() {
    class MimeTypeWithLabel {
        constructor(typeString, label) {
            this.type = typeString;
            this.label = label;
        }
    }

    const optionalMimeTypes = [
        new MimeTypeWithLabel('video/webm', 'WebM'),
        new MimeTypeWithLabel('video/mp4', 'MP4'),
        new MimeTypeWithLabel('', '默认')
    ];

    return optionalMimeTypes;
}

function alertUnsupportedMimeType(mimeType) {
    alert(`MediaRecorder 不支持的格式：${mimeType}`);
}

async function startRecording() {
  recordedBlobs = [];
  const mimeType = recordingFormat.options[recordingFormat.selectedIndex].value;
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    alertUnsupportedMimeType(mimeType);
    return;
  }
  
  const options = {mimeType};
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  startRecordingButton.textContent = '停止录制';
  playButton.disabled = true;
  downloadButton.disabled = true;
  recordingFormat.disabled = true;
  targetFormat.disabled = false;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
    console.log('Recorded Blobs: ', recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  startRecordingButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;

  const gumVideo = document.querySelector('video#gum');
  gumVideo.srcObject = stream;

  getOptionalMimeTypes().forEach(mimeTypeWithLabel => {
    const option = document.createElement('option');
    option.value = mimeTypeWithLabel.type;
    option.innerText = mimeTypeWithLabel.label;
    recordingFormat.appendChild(option);
  });
  recordingFormat.disabled = false;

  getOptionalMimeTypes().forEach(mimeTypeWithLabel => {
    const option = document.createElement('option');
    option.value = mimeTypeWithLabel.type;
    option.innerText = mimeTypeWithLabel.label;
    targetFormat.appendChild(option);
  });
  targetFormat.disabled = false;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

document.querySelector('button#startCamera').addEventListener('click', async () => {
  document.querySelector('button#startCamera').disabled = true;
  const constraints = {
    video: {
      width: 1280, height: 720
    }
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});
