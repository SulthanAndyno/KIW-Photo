let videoElement, canvasElement, canvasContext;
let streamActive = null;
let isCameraActive = false;
let currentVideoFrame = null;

export function initCamera(video, canvas, ctx){
  videoElement = video;
  canvasElement = canvas;
  canvasContext = ctx;
  canvasContext.willReadFrequently = true;
}

export async function startCameraStream(){
  try{
    const constraints = {
      video:{
        width:{ideal:1280, min:640},
        height:{ideal:720, min:360},
        facingMode:'environment'
      },
      audio:false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamActive = stream;
    videoElement.srcObject = stream;
    isCameraActive = true;

    return new Promise((resolve, reject)=>{
      videoElement.onloadedmetadata = ()=>{
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
        videoElement.play().then(resolve).catch(e=>{
          console.error("Error playing video:", e);
          isCameraActive=false; reject(new Error("Gagal memutar stream video."));
        });
      };
      videoElement.onerror = (e)=>{ isCameraActive=false; reject(new Error("Video gagal memuat metadata.")); };
      setTimeout(()=>{
        if (videoElement.readyState===0 && isCameraActive){
          if (videoElement.videoWidth===0){
            canvasElement.width = constraints.video.width.ideal || 1280;
            canvasElement.height = constraints.video.height.ideal || 720;
          }
          resolve();
        }
      }, 5000);
    });
  }catch(err){
    console.error("Error mengakses kamera:", err);
    isCameraActive=false; throw err;
  }
}

export function stopCameraStream(){
  if (streamActive){
    streamActive.getTracks().forEach(t=>t.stop());
    videoElement.srcObject=null;
    videoElement.pause();
    streamActive=null; isCameraActive=false; currentVideoFrame=null;
  }
}

export function drawLiveFrame(filterCallback){
  if (!isCameraActive || videoElement.readyState < videoElement.HAVE_ENOUGH_DATA) return null;
  canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
  currentVideoFrame = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);

  if (filterCallback){
    const filtered = new ImageData(new Uint8ClampedArray(currentVideoFrame.data), currentVideoFrame.width, currentVideoFrame.height);
    filterCallback(filtered);
    canvasContext.putImageData(filtered, 0, 0);
    return filtered;
  }
  return currentVideoFrame;
}

export function isStreamActive(){ return isCameraActive; }
export function getCurrentVideoFrame(){ return currentVideoFrame; }
export function getCanvasDimensions(){ return { width: canvasElement.width, height: canvasElement.height }; }
