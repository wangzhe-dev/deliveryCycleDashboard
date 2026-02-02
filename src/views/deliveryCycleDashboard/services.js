const memoryStore = new Map();

export const fetchMaster3dByCode = (materialsCode) => {
  const key = String(materialsCode || '').trim();
  const json = key ? memoryStore.get(key) : '';
  return Promise.resolve({ success: true, data: { json } });
};

export const updateMaster3dJson = (materialsCode, json) => {
  const key = String(materialsCode || '').trim();
  if (key) {
    const payload = typeof json === 'string' ? json : JSON.stringify(json ?? {});
    memoryStore.set(key, payload);
  }
  return Promise.resolve({ success: true, data: true });
};
