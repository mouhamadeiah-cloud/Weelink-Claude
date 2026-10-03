import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const uploadGalleryImageToStorage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawDataUrl = e.target?.result as string;
        const blob = dataURLtoBlob(rawDataUrl);
        const timestamp = Date.now();
        const fileRef = ref(storage, `gallery/${timestamp}_${file.name.replace(/\s+/g, '_')}`);
        const snapshot = await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        resolve(downloadUrl);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
