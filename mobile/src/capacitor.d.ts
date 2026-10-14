interface Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      StatusBar?: {
        setStyle: (options: { style: string }) => Promise<void>;
        setBackgroundColor: (options: { color: string }) => Promise<void>;
      };
      App?: {
        addListener: (event: string, callback: (data: { canGoBack: boolean }) => void) => Promise<void>;
        exitApp: () => Promise<void>;
      };
    };
  };
}