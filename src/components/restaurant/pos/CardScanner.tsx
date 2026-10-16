// Reads a gift card's QR code with the device camera. Uses the browser's own detector where there is
// one (Chrome on Android), and a small JavaScript reader everywhere else (iPhone, iPad, desktop).
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { cleanCardNumber, isCardNumber } from '../giftCardLogic';
import { Modal } from './posUi';

export const CardScanner: React.FC<{ onNumber: (n: string) => void; onClose: () => void }> = ({ onNumber, onClose }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    const canvas = document.createElement('canvas');
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
        const Native = (window as any).BarcodeDetector;
        const detector = Native ? new Native({ formats: ['qr_code'] }) : null;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const read = async (): Promise<string> => {
          const v = video.current!;
          if (detector) return (await detector.detect(v))[0]?.rawValue || '';
          if (!v.videoWidth) return '';
          // A smaller copy of the frame is enough for a QR code and keeps the reader quick.
          const scale = Math.min(1, 640 / v.videoWidth);
          canvas.width = Math.round(v.videoWidth * scale);
          canvas.height = Math.round(v.videoHeight * scale);
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          return jsQR(img.data, img.width, img.height)?.data || '';
        };
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const n = cleanCardNumber(await read());
            if (isCardNumber(n)) {
              onNumber(n);
              return;
            }
          } catch {
            /* keep trying */
          }
          window.setTimeout(tick, 200);
        };
        tick();
      } catch {
        setError('تعذر فتح الكاميرا. اسمح للمتصفح باستعمالها أو اكتب رقم البطاقة بدلًا من ذلك.');
      }
    })();
    return () => {
      stop = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Modal title="امسح رمز QR للبطاقة" onClose={onClose}>
      {error ? <div className="py-8 text-center text-sm font-bold text-[#E03131]">{error}</div> : <video ref={video} muted playsInline className="w-full rounded-2xl bg-black aspect-square object-cover" />}
    </Modal>
  );
};
