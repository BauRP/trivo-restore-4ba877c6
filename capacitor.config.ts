import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Ваш уникальный ID приложения (важно для Android)
  appId: "com.trivo.chat.elite",
  // Название, которое будет отображаться на телефоне
  appName: "Trivo Chat Elite",
  // Папка, в которую собирается проект (не меняем, чтобы ничего не забыть)
  webDir: "dist",
  server: {
    androidScheme: "https",
    // Добавляем, чтобы серверная часть и база данных могли работать без сбоев
    cleartext: true,
    allowNavigation: ["*"]
  },
  android: {
    // Гарантируем поддержку современной версии Android
    buildOptions: {
      releaseType: "APK"
    }
  }
};

export default config;
