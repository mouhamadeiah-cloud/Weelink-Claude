// The contact channels in their own brand colours, for the contact questions and settings.
import React from 'react';

type IconProps = { size?: number };

const Round: React.FC<{ color: string; size: number; children: React.ReactNode }> = ({ color, size, children }) => (
  <span className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, backgroundColor: color, color: '#fff' }}>
    {children}
  </span>
);

export const WhatsAppIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Round color="#25D366" size={size}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.77.464 3.498 1.346 5.027L2 22l5.086-1.334A9.97 9.97 0 0 0 12.031 22c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm5.836 14.238c-.244.685-1.42 1.258-1.956 1.338-.508.077-1.168.109-3.73-1.025-3.08-1.36-5.074-4.495-5.23-4.7-.152-.206-1.246-1.657-1.246-3.16 0-1.503.788-2.243 1.068-2.533.279-.29.61-.363.814-.363.203 0 .407.002.585.011.19.009.444-.072.695.53.259.62.883 2.152.96 2.308.077.156.128.339.025.545-.102.206-.153.334-.305.513-.153.18-.323.402-.461.54-.153.153-.312.32-.134.626.178.305.79 1.302 1.696 2.109 1.168 1.04 2.152 1.362 2.457 1.515.305.153.484.128.662-.077.178-.206.764-.89 9.68-1.127.204-.238.408-.18.662-.077.255.103 1.616.764 1.895.903.28.14.467.209.535.326.068.118.068.685-.176 1.37z" />
    </svg>
  </Round>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Round color="#34C759" size={size}>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  </Round>
);

export const EmailIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Round color="#EA4335" size={size}>
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  </Round>
);

export const FacebookIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Round color="#1877F2" size={size}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  </Round>
);

export const TikTokIcon: React.FC<IconProps> = ({ size = 22 }) => (
  <Round color="#111111" size={size}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v7.94c.01 1.87-.6 3.73-1.74 5.21-1.42 1.83-3.67 2.9-5.98 2.8-2.61-.05-5.01-1.47-6.28-3.75-1.32-2.31-1.28-5.24.12-7.52 1.34-2.22 3.78-3.62 6.36-3.56.32.01.64.04.96.09v4.11c-.4-.14-.83-.22-1.26-.22-1.24-.04-2.47.53-3.15 1.57-.71 1.07-.67 2.49.09 3.52.74 1.01 2.01 1.57 3.26 1.42 1.34-.14 2.47-1.14 2.74-2.47.08-.41.11-.84.11-1.26V.02z" />
    </svg>
  </Round>
);
