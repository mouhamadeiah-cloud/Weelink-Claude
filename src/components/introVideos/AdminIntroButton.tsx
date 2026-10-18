// «شرح» in the header of an admin window. The admin floats over the editor, so its explainer opens
// enlarged over it and can shrink to a small floating screen while the owner carries on in the admin.
import React, { useRef, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { ADMIN_VIDEOS, AdminKind } from './introVideos';
import { IntroVideoMode, IntroVideoPlayer } from './IntroVideoPlayer';

export const AdminIntroButton: React.FC<{ kind: AdminKind }> = ({ kind }) => {
  const [mode, setMode] = useState<IntroVideoMode | null>(null);
  const time = useRef(0);
  // There is no panel to go back to: «back to the panel» floats it, «small» closes it.
  const onModeChange = (m: IntroVideoMode) => setMode(m === 'docked' ? 'floating' : m === 'mini' ? null : m);
  return (
    <>
      <button
        type="button"
        onClick={() => setMode((m) => (m ? null : 'big'))}
        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${mode ? 'bg-brand/10 text-brand' : 'hover:bg-neutral-100 text-neutral-600'}`}
        title="شرح الإدارة"
      >
        <PlayCircle size={15} /> شرح
      </button>
      {mode && <IntroVideoPlayer video={ADMIN_VIDEOS[kind]} mode={mode} onModeChange={onModeChange} timeRef={time} />}
    </>
  );
};
