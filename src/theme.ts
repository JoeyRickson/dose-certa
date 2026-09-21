export type ThemeKey =
  | 'rose'
  | 'lavender'
  | 'sky'
  | 'sage'
  | 'peach'
  | 'cream'
  | 'neutral'
  | 'dark'
  | 'black';

export type AppColors = {
  backdrop: string;
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceLavender: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  break: string;
  breakSoft: string;
  pending: string;
  pendingSoft: string;
  white: string;
  shadow: string;
};

export type AppTheme = {
  key: ThemeKey;
  label: string;
  dark: boolean;
  preview: string;
  heroGradient: [string, string];
  colors: AppColors;
};

const statusLight = {
  success: '#2E8B6B',
  successSoft: '#E7F7F0',
  danger: '#C64A5B',
  dangerSoft: '#FDECEF',
  warning: '#A96B1D',
  warningSoft: '#FFF4DF',
  break: '#708096',
  breakSoft: '#EEF2F7',
  pending: '#B46A36',
  pendingSoft: '#FFF0E5',
};

export const appThemes: Record<ThemeKey, AppTheme> = {
  rose: {
    key: 'rose', label: 'Rosé', dark: false, preview: '#B13F75', heroGradient: ['#FFF0F6', '#F5EDFF'],
    colors: {
      backdrop: '#F5F0F4', background: '#FFF9FC', surface: '#FFFFFF', surfaceSoft: '#FFF0F6', surfaceLavender: '#F5EEFF',
      primary: '#B13F75', primaryDark: '#7D2451', primarySoft: '#F7D9E7', secondary: '#7C5CC7', accent: '#FF8E7B', accentSoft: '#FFE9E4',
      text: '#30242A', muted: '#7C6D74', border: '#EADDE3', ...statusLight, white: '#FFFFFF', shadow: '#4B2738',
    },
  },
  lavender: {
    key: 'lavender', label: 'Lavanda', dark: false, preview: '#7658C9', heroGradient: ['#F1EAFE', '#E9E2FA'],
    colors: {
      backdrop: '#F1EEF8', background: '#FAF8FF', surface: '#FFFFFF', surfaceSoft: '#F0EBFB', surfaceLavender: '#E9E1F8',
      primary: '#7658C9', primaryDark: '#53399A', primarySoft: '#E8DDF8', secondary: '#AF5EAD', accent: '#A978E8', accentSoft: '#F1E7FC',
      text: '#2E2938', muted: '#746D80', border: '#DDD5EA', ...statusLight, white: '#FFFFFF', shadow: '#3E3550',
    },
  },
  sky: {
    key: 'sky', label: 'Azul névoa', dark: false, preview: '#4E84A8', heroGradient: ['#EAF5FB', '#EEF0FF'],
    colors: {
      backdrop: '#EDF4F8', background: '#F7FBFD', surface: '#FFFFFF', surfaceSoft: '#E7F2F8', surfaceLavender: '#ECF0FB',
      primary: '#4E84A8', primaryDark: '#315E7A', primarySoft: '#D8EAF4', secondary: '#6478C8', accent: '#63A9D4', accentSoft: '#E1F2FB',
      text: '#24343E', muted: '#687B87', border: '#D3E0E7', ...statusLight, white: '#FFFFFF', shadow: '#293E4A',
    },
  },
  sage: {
    key: 'sage', label: 'Sálvia', dark: false, preview: '#628B70', heroGradient: ['#EAF4EC', '#F0F4EA'],
    colors: {
      backdrop: '#EEF4F0', background: '#F9FCFA', surface: '#FFFFFF', surfaceSoft: '#E8F2EA', surfaceLavender: '#EEF1F0',
      primary: '#628B70', primaryDark: '#41624D', primarySoft: '#DAEBDD', secondary: '#617F83', accent: '#83AC8E', accentSoft: '#E5F2E8',
      text: '#29362D', muted: '#6B786E', border: '#D4E0D6', ...statusLight, white: '#FFFFFF', shadow: '#34483A',
    },
  },
  peach: {
    key: 'peach', label: 'Pêssego', dark: false, preview: '#D8785F', heroGradient: ['#FFF0E8', '#FAECF1'],
    colors: {
      backdrop: '#FAF0EB', background: '#FFF9F6', surface: '#FFFFFF', surfaceSoft: '#FCEAE1', surfaceLavender: '#F7EDF4',
      primary: '#D8785F', primaryDark: '#A34E3C', primarySoft: '#F7DDD4', secondary: '#A65F8B', accent: '#ED967A', accentSoft: '#FCE7DF',
      text: '#392C27', muted: '#816F67', border: '#ECD7CE', ...statusLight, white: '#FFFFFF', shadow: '#54362C',
    },
  },
  cream: {
    key: 'cream', label: 'Creme', dark: false, preview: '#A98451', heroGradient: ['#F8F0DF', '#F4EEE7'],
    colors: {
      backdrop: '#F7F4EB', background: '#FFFCF5', surface: '#FFFFFF', surfaceSoft: '#F3ECDE', surfaceLavender: '#F0EDF1',
      primary: '#A98451', primaryDark: '#765C38', primarySoft: '#EEE1CB', secondary: '#86709D', accent: '#C89D62', accentSoft: '#F5E8D3',
      text: '#353026', muted: '#797164', border: '#E4DBCB', ...statusLight, white: '#FFFFFF', shadow: '#453B2C',
    },
  },
  neutral: {
    key: 'neutral', label: 'Neutro', dark: false, preview: '#565B66', heroGradient: ['#F3F3F5', '#ECEEF2'],
    colors: {
      backdrop: '#F2F3F5', background: '#FAFAFB', surface: '#FFFFFF', surfaceSoft: '#ECEEF1', surfaceLavender: '#EFF0F4',
      primary: '#565B66', primaryDark: '#363A42', primarySoft: '#E1E3E6', secondary: '#70788C', accent: '#7A7E88', accentSoft: '#EAEBED',
      text: '#292B30', muted: '#71747C', border: '#DDDFE3', ...statusLight, white: '#FFFFFF', shadow: '#33353A',
    },
  },
  dark: {
    key: 'dark', label: 'Escuro', dark: true, preview: '#202129', heroGradient: ['#2A2028', '#232132'],
    colors: {
      backdrop: '#121318', background: '#17181E', surface: '#202129', surfaceSoft: '#2A2229', surfaceLavender: '#252332',
      primary: '#E16A9F', primaryDark: '#F095BC', primarySoft: '#492637', secondary: '#AD93F0', accent: '#FF9A86', accentSoft: '#4B302D',
      text: '#F7F4F6', muted: '#AAA2A8', border: '#34353E',
      success: '#63C99B', successSoft: '#1B3A2E', danger: '#F17A88', dangerSoft: '#45252C', warning: '#EBB15C', warningSoft: '#44351F',
      break: '#A6B2C2', breakSoft: '#2B3038', pending: '#E09A67', pendingSoft: '#443126', white: '#FFFFFF', shadow: '#000000',
    },
  },
  black: {
    key: 'black', label: 'Preto AMOLED', dark: true, preview: '#000000', heroGradient: ['#180D13', '#0D0B14'],
    colors: {
      backdrop: '#000000', background: '#050505', surface: '#101010', surfaceSoft: '#181116', surfaceLavender: '#15121C',
      primary: '#F05A9D', primaryDark: '#FF86B9', primarySoft: '#391420', secondary: '#B099FF', accent: '#FF927E', accentSoft: '#381B18',
      text: '#FFFFFF', muted: '#A8A8AE', border: '#26262B',
      success: '#5DD19A', successSoft: '#102C20', danger: '#FF7685', dangerSoft: '#351318', warning: '#F2B45D', warningSoft: '#312410',
      break: '#ADB8C7', breakSoft: '#181C21', pending: '#E7A06C', pendingSoft: '#301F14', white: '#FFFFFF', shadow: '#000000',
    },
  },
};

export const colors = appThemes.rose.colors;
export type BackgroundThemeKey = ThemeKey;
export const backgroundThemes = Object.values(appThemes).map((theme) => ({
  key: theme.key,
  label: theme.label,
  color: theme.preview,
  dark: theme.dark,
}));

export function getTheme(key: string | null | undefined): AppTheme {
  return key && key in appThemes ? appThemes[key as ThemeKey] : appThemes.rose;
}

export function getBackgroundTheme(key: string | null | undefined) {
  const theme = getTheme(key);
  return { key: theme.key, label: theme.label, color: theme.colors.backdrop };
}

export function getShadow(theme: AppTheme) {
  return {
    shadowColor: theme.colors.shadow,
    shadowOpacity: theme.dark ? 0.35 : 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: theme.dark ? 3 : 4,
  };
}

export const shadow = getShadow(appThemes.rose);
