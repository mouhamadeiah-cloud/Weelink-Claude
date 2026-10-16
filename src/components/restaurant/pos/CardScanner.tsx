// Reads a gift card's QR code with the device camera (where the browser can: Chrome on Android and
// most tablets). Where it cannot, the cashier types the number instead.
import React, { useEffect, useRef, useState } from 'react';
import { cleanCardNumber, isCardNumber } from '../giftCardLogic';
import { Modal } from './posUi';

export const canScan = () => typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

export const CardScanner: React.FC<{ onNumber: (n: string) => void; onClose: () => void }> = ({ onNumber, onClose }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      try {
        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector({ formats: ['qr_code'] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const tick = async () => {
          if (stop || !video.current) return;
          try {
            const found = await detector.detect(video.current);
            const n = cleanCardNumber(found[0]?.rawValue || '');
            if (isCardNumber(n)) {
              onNumber(n);
              return;
            }
          } catch {
            /* keep trying */
          }
          window.setTimeout(tick, 250);
        };
        tick();
      } catch {
        setError('تعذر فتح الكاميرا. اكتب رقم البطاقة بدلًا من ذلك.');
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
