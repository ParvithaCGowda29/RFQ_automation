import type { DataProvider } from "@refinedev/core";
import { SKILLS, OUTPUTS } from "./data";

// Front-end mock data provider: serves the local workflow data through Refine.
// No backend is connected - write operations are rejected explicitly.
export const mockProvider: DataProvider = {
  getApiUrl: () => "mock://local",
  getList: async ({ resource }) => {
    if (resource === "skills") return { data: SKILLS as any, total: SKILLS.length };
    if (resource === "outputs")
      return { data: Object.entries(OUTPUTS).map(([sub, cards]) => ({ id: sub, cards })) as any, total: Object.keys(OUTPUTS).length };
    return { data: [], total: 0 };
  },
  getOne: async ({ resource, id }) => {
    if (resource === "skills") return { data: SKILLS.find(s => String(s.n) === String(id)) as any };
    return { data: null as any };
  },
  create: async () => { throw new Error("Read-only demo: no backend connected"); },
  update: async () => { throw new Error("Read-only demo: no backend connected"); },
  deleteOne: async () => { throw new Error("Read-only demo: no backend connected"); },
};
