import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f0f4f8', // Light blue-gray for main content area
        content1: '#ffffff', // White for sidebar and header
        foreground: '#000000', // Black for text
        divider: '#e2e8f0', // Light gray for borders
        primary:'#900c3e',
        primaryBlue: '#1e40af', // Primary blue for buttons and links
      },
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: '#f0f4f8',
          content1: '#ffffff',
          foreground: '#000000',
          divider: '#e2e8f0',
          primary:'#900c3e',
          primaryBlue: '#1e40af', // Primary blue for buttons and links
        },
      },
    },
  })],
};
