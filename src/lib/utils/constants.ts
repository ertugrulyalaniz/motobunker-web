// ICE servers for WebRTC
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// Default map center (Istanbul)
export const DEFAULT_MAP_CENTER = {
  lat: 41.015137,
  lng: 28.97953,
};

export const DEFAULT_MAP_ZOOM = 11;

// Turkish UI strings
export const UI_STRINGS = {
  // Header
  APP_TITLE: "P2P Motosiklet Grup Konum Paylaşımı",
  APP_SUBTITLE: "Sunucusuz – Konum sadece cihazlar arasında paylaşılıyor",

  // Roles
  ROLE_LEADER: "Grup Lideri",
  ROLE_RIDER: "Sürücü",

  // Actions
  CREATE_GROUP: "Grup Oluştur",
  JOIN_GROUP: "Gruba Katıl",
  START_SHARING: "Konum Paylaşmayı Başlat",
  STOP_SHARING: "Durdur",
  SHARE_INVITE: "Davet Paylaş",
  LEAVE_GROUP: "Gruptan Ayrıl",

  // Status
  CONNECTED: "Bağlandı",
  CONNECTING: "Bağlanıyor...",
  DISCONNECTED: "Bağlı kimse yok",
  RIDERS_CONNECTED: (n: number) => `${n} sürücü bağlı`,

  // Forms
  NICKNAME_LABEL: "Takma Ad",
  NICKNAME_PLACEHOLDER: "Adınızı girin",
  INVITE_CODE_LABEL: "Davet Kodu",
  INVITE_CODE_PLACEHOLDER: "6 haneli kod",
  GROUP_NAME_LABEL: "Grup Adı (opsiyonel)",
  GROUP_NAME_PLACEHOLDER: "Örn: Hafta Sonu Turu",

  // Instructions
  HOW_IT_WORKS: "Nasıl Çalışır?",
  INSTRUCTION_1: "Bir kişi Grup Lideri olur ve davet oluşturur.",
  INSTRUCTION_2: "Diğer sürücüler davet koduyla katılır.",
  INSTRUCTION_3: "Konumlar sadece telefonlar arasında paylaşılır.",

  // Errors
  ERROR_INVALID_CODE: "Geçersiz davet kodu",
  ERROR_GROUP_EXPIRED: "Bu grup artık aktif değil",
  ERROR_CONNECTION_FAILED: "Bağlantı kurulamadı",
  ERROR_LOCATION_DENIED: "Konum izni reddedildi",
  ERROR_NICKNAME_REQUIRED: "Takma ad gerekli",
} as const;
