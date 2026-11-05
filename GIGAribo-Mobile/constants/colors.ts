/**
 * Semantic design tokens for the mobile app.
 * Light: bright, friendly blue with soft pastel accents.
 * Dark: deep navy surfaces with a readable mid-blue for headings and buttons.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#16213E',
    tint: '#2860E8',

    // Core surfaces
    background: '#F5F8FF',
    foreground: '#16213E',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#16213E',

    // Primary action color (links, active states)
    primary: '#2860E8',
    primaryForeground: '#FFFFFF',

    // Secondary surfaces
    secondary: '#EDF2FF',
    secondaryForeground: '#22397A',

    // Muted text and surfaces
    muted: '#EEF2FA',
    mutedForeground: '#5B667F',

    // Highlights (badges, selected items)
    accent: '#E6EFFF',
    accentForeground: '#1B3A8A',

    // Destructive actions
    destructive: '#DC3E4A',
    destructiveForeground: '#FFFFFF',

    // Borders and inputs
    border: '#DDE5F3',
    input: '#DDE5F3',

    // Brand
    navy: '#162B63',
    sky: '#38B6F5',

    // Soft category tints
    categoryBlue: '#E3EEFF',
    categoryGreen: '#DDF3E8',
    categoryPeach: '#FFE9D6',
    categoryPink: '#FCE3EC',
    categoryLavender: '#ECE6FB',
    categoryYellow: '#FFF2CC',

    modalScrim: 'rgba(14, 24, 56, 0.5)',
  },

  dark: {
    text: '#F2F5FF',
    tint: '#7FA6FF',
    background: '#0E1526',
    foreground: '#F2F5FF',
    card: '#172138',
    cardForeground: '#F2F5FF',
    primary: '#7FA6FF',
    primaryForeground: '#0E1526',
    secondary: '#1D2A45',
    secondaryForeground: '#E4EBFF',
    muted: '#1B2540',
    mutedForeground: '#A8B3CC',
    accent: '#1F3157',
    accentForeground: '#D6E4FF',
    destructive: '#F0777F',
    destructiveForeground: '#FFFFFF',
    border: '#2A3757',
    input: '#2A3757',
    // Mid blue so it reads as text on dark AND as a button color with white text.
    navy: '#4A78EE',
    sky: '#5CC3F5',
    categoryBlue: '#1B2F4D',
    categoryGreen: '#1A3A30',
    categoryPeach: '#3D2E24',
    categoryPink: '#3B2634',
    categoryLavender: '#2E2848',
    categoryYellow: '#3A3320',
    modalScrim: 'rgba(4, 8, 20, 0.72)',
  },

  // Border radius (in px) for cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;