export type CameraLoopControls = {
  stop: () => void;
};

async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    return (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
  } catch {
    return [];
  }
}

export async function listCameraLabels(): Promise<string[]> {
  const devices = await getVideoDevices();
  return devices.map((device, index) => device.label || `Camera ${index + 1}`);
}

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器不支持 getUserMedia，或页面不是安全上下文。请使用 HTTPS / localhost。');
  }

  const devices = await getVideoDevices();
  const attempts: MediaStreamConstraints[] = [];

  if (devices[0]?.deviceId) {
    attempts.push({
      video: {
        deviceId: { exact: devices[0].deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  }

  attempts.push(
    {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    { video: true, audio: false },
  );

  const errors: string[] = [];
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await video.play();
      return stream;
    } catch (error) {
      errors.push(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    }
  }

  const deviceHint = devices.length
    ? `检测到 ${devices.length} 个摄像头，但都无法打开：${devices.map((d, i) => d.label || `Camera ${i + 1}`).join(', ')}`
    : '浏览器没有枚举到摄像头。请检查系统摄像头权限、浏览器站点权限、外接摄像头连接，或是否被其他软件占用。';
  throw new Error(`${deviceHint}\n尝试结果：${errors.join(' | ')}`);
}

export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function createRafLoop(callback: (now: number) => void): CameraLoopControls {
  let raf = 0;
  let active = true;

  const tick = (now: number) => {
    if (!active) return;
    callback(now);
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return {
    stop: () => {
      active = false;
      cancelAnimationFrame(raf);
    },
  };
}
