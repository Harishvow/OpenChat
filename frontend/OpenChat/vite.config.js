import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default {
  server: {
    proxy: {
      '/create-chatLink': 'http://localhost:5008',
      '/chat': 'http://localhost:5008',
      '/messages': 'http://localhost:5008'
    }
  }
};