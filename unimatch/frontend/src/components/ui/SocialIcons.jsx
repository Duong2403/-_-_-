import React from 'react';

// Base Icon component
const Icon = ({ children, className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`icon ${className}`}
    {...props}
  >
    {children}
  </svg>
);

// University/School Icons
export const UniversityIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path
      d="M12 3L2 9L12 15L22 9L12 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 15L12 21L22 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 18L22 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

export const SchoolIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path
      d="M22 10V16C22 17 21 18 20 18C19 18 18 17 18 16V10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 10L12 5L22 10L12 15L2 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 12V16C6 17.1046 9.13401 20 12 20C14.866 20 18 17.1046 18 16V12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// Social Connection Icons
export const GroupsIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M24 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const CoupleIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <circle cx="15.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
    <path d="M13 21v-2a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const FriendshipIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="9"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Icon>
);

// Meeting & Dating Icons
export const MeetingIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
    <circle cx="8" cy="14" r="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="16" cy="14" r="2" stroke="currentColor" strokeWidth="2" />
    <path d="M12 18v2" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const DateIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
    />
  </Icon>
);

export const CoffeeIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" strokeWidth="2" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="1" x2="6" y2="4" stroke="currentColor" strokeWidth="2" />
    <line x1="10" y1="1" x2="10" y2="4" stroke="currentColor" strokeWidth="2" />
    <line x1="14" y1="1" x2="14" y2="4" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

// Connection & Matching Icons
export const ConnectionIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="6" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
    <line x1="9" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="2" />
    <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const MatchIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M12 1v6m0 6v6" stroke="currentColor" strokeWidth="2" />
    <path d="M21 12h-6m-6 0H3" stroke="currentColor" strokeWidth="2" />
    <path d="M18.364 5.636l-4.243 4.243m-4.242 4.242l-4.243 4.243" stroke="currentColor" strokeWidth="2" />
    <path d="M5.636 5.636l4.243 4.243m4.242 4.242l4.243 4.243" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const SparkIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path
      d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
    />
    <path
      d="M5 3L5.5 5.5L8 6L5.5 6.5L5 9L4.5 6.5L2 6L4.5 5.5L5 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
    />
  </Icon>
);

// Activity Icons
export const StudyIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" />
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const SocialIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="20" r="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const PartyIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M8 12h8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8v8" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

// Chat & Communication Icons
export const MessageIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.60583 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const SearchIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const SendIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" />
    <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const EmojiIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const AttachmentIcon = ({ className, ...props }) => (
  <Icon className={className} {...props}>
    <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59719 21.9983 8.005 21.9983C6.41281 21.9983 4.88581 21.3658 3.76 20.24C2.63419 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63419 12.8758 3.76 11.75L12.95 2.56C13.7006 1.80944 14.7186 1.38755 15.78 1.38755C16.8414 1.38755 17.8594 1.80944 18.61 2.56C19.3606 3.31056 19.7825 4.32856 19.7825 5.39C19.7825 6.45144 19.3606 7.46944 18.61 8.22L9.41 17.41C9.03494 17.7851 8.52736 17.9957 8 17.9957C7.47264 17.9957 6.96506 17.7851 6.59 17.41C6.21494 17.0349 6.00434 16.5274 6.00434 16C6.00434 15.4726 6.21494 14.9651 6.59 14.59L15.07 6.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export default Icon; 