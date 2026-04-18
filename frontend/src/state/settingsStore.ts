import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { getDb, STORE_SETTINGS, SETTINGS_KEY } from "@/persistence/db";

export interface Settings {
  autoBackupOnPublish: boolean;
  modelOverride: string | null;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  autoBackupOnPublish: true,
  modelOverride: null,
  darkMode: true,
};

interface SettingsState extends Settings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

async function persist(settings: Settings): Promise<void> {
  const db = await getDb();
  await db.put(STORE_SETTINGS, settings, SETTINGS_KEY);
}

export const useSettingsStore = create<SettingsState>()(
  immer((set, get) => ({
    ...DEFAULT_SETTINGS,
    hydrated: false,
    hydrate: async () => {
      try {
        const db = await getDb();
        const loaded = (await db.get(STORE_SETTINGS, SETTINGS_KEY)) as Settings | undefined;
        set((state) => {
          Object.assign(state, loaded ?? DEFAULT_SETTINGS);
          state.hydrated = true;
        });
      } catch {
        set((state) => {
          state.hydrated = true;
        });
      }
    },
    update: async (patch) => {
      set((state) => {
        Object.assign(state, patch);
      });
      const { autoBackupOnPublish, modelOverride, darkMode } = get();
      await persist({ autoBackupOnPublish, modelOverride, darkMode });
    },
  })),
);
