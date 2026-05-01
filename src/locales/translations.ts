export type Language = 'en' | 'id';

export const translations = {
  'nav.explore': {
    en: 'Explore',
    id: 'Jelajahi'
  },
  'nav.search': {
    en: 'Search',
    id: 'Cari'
  },
  'nav.tickets': {
    en: 'Tickets',
    id: 'Tiket'
  },
  'nav.manage': {
    en: 'Manage',
    id: 'Kelola'
  },
  'nav.profile': {
    en: 'Profile',
    id: 'Profil'
  },
  'home.title': {
    en: 'Discover Events',
    id: 'Temukan Event'
  },
  'home.subtitle': {
    en: 'The pulse of premium events.',
    id: 'Pusat event premium.'
  },
  'home.featured': {
    en: 'Featured Events',
    id: 'Event Unggulan'
  },
  'home.exclusive': {
    en: 'Exclusive Access',
    id: 'Akses Eksklusif'
  },
  'profile.booked': {
    en: 'Booked',
    id: 'Dipesan'
  },
  'profile.attended': {
    en: 'Attended',
    id: 'Diikuti'
  },
  'profile.favorites': {
    en: 'Favorites',
    id: 'Favorit'
  },
  'profile.menu.tickets': {
    en: 'My Tickets',
    id: 'Tiket Saya'
  },
  'profile.menu.payment': {
    en: 'Payment Methods',
    id: 'Metode Pembayaran'
  },
  'profile.menu.notifications': {
    en: 'Notifications',
    id: 'Notifikasi'
  },
  'profile.menu.settings': {
    en: 'Settings',
    id: 'Pengaturan'
  },
  'profile.menu.help': {
    en: 'Help Center',
    id: 'Pusat Bantuan'
  },
  'profile.logout': {
    en: 'Logout',
    id: 'Keluar'
  },
  'settings.title': {
    en: 'Settings',
    id: 'Pengaturan'
  },
  'settings.account': {
    en: 'Account',
    id: 'Akun'
  },
  'settings.security': {
    en: 'Security',
    id: 'Keamanan'
  },
  'settings.notifications': {
    en: 'Notifications',
    id: 'Notifikasi'
  },
  'settings.payment': {
    en: 'Payment',
    id: 'Pembayaran'
  },
  'settings.app': {
    en: 'App Settings',
    id: 'Pengaturan Aplikasi'
  },
  'settings.support': {
    en: 'Support',
    id: 'Dukungan'
  },
  'settings.dark_mode': {
    en: 'Dark Mode',
    id: 'Mode Gelap'
  },
  'settings.language': {
    en: 'Language',
    id: 'Bahasa'
  },
  'account.edit_profile': {
    en: 'Edit Profile',
    id: 'Edit Profil'
  },
  'account.change_password': {
    en: 'Change Password',
    id: 'Ubah Kata Sandi'
  },
  'account.connected_accounts': {
    en: 'Connected Accounts',
    id: 'Akun Tertaut'
  },
  'account.membership': {
    en: 'Membership',
    id: 'Keanggotaan'
  },
  'account.upgrade': {
    en: 'Upgrade Now',
    id: 'Upgrade Sekarang'
  },
  'account.save': {
    en: 'Save Changes',
    id: 'Simpan Perubahan'
  },
  'account.name': {
    en: 'Full Name',
    id: 'Nama Lengkap'
  },
  'account.avatar_url': {
    en: 'Avatar URL',
    id: 'URL Avatar'
  },
  'account.phone': {
    en: 'Phone Number',
    id: 'Nomor Telepon'
  }
};

export type TranslationKey = keyof typeof translations;
