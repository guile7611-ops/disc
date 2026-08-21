export interface ElectronAPI {
  isElectron: boolean;
  openScreenPicker: () => Promise<void>;
  onSourceSelected: (callback: (sourceId: string | null) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
