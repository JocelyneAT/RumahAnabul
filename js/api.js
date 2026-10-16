// Data layer. Uses Supabase when js/config.js has keys, otherwise a demo store in localStorage.
// Both versions have the same functions, so app.js doesn't care which one is running.

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Shrinks a photo before saving so uploads are fast and storage stays small.
function resizeImage(file, maxSize = 1000, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(t("error.photo")))), "image/jpeg", quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(t("error.photo")));
    };
    img.src = url;
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function createDemoApi() {
  const KEY = "happypaws-demo-v1";
  let db = null;
  try {
    db = JSON.parse(localStorage.getItem(KEY));
  } catch {}
  if (!db) db = { users: [], sessionUserId: null, dogs: SEED_DOGS.map((d) => ({ ...d })), applications: [] };

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (err) {
      // Blocked storage just means the demo forgets on reload; a full one is worth telling the user about.
      if (err.name === "QuotaExceededError") throw new Error(t("error.storageFull"));
    }
  }

  const sessionUser = () => db.users.find((u) => u.id === db.sessionUserId) || null;
  const needUser = () => {
    const u = sessionUser();
    if (!u) throw new Error(t("error.login"));
    return u;
  };
  const newestFirst = (list) => [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    isDemo: true,

    async getUser() {
      const u = sessionUser();
      return u && { id: u.id, email: u.email, name: u.name };
    },
    async signUp({ name, email, password }) {
      email = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === email)) throw new Error(t("error.emailTaken"));
      const user = { id: newId(), name: name.trim(), email, password };
      db.users.push(user);
      db.sessionUserId = user.id;
      save();
      return { needsConfirm: false };
    },
    async signIn({ email, password }) {
      const user = db.users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
      if (!user) throw new Error(t("error.badLogin"));
      db.sessionUserId = user.id;
      save();
    },
    async signOut() {
      db.sessionUserId = null;
      save();
    },

    async listDogs() {
      return newestFirst(db.dogs);
    },
    async getDog(id) {
      return db.dogs.find((d) => d.id === id) || null;
    },
    async myDogs() {
      const u = needUser();
      return newestFirst(db.dogs.filter((d) => d.owner_id === u.id));
    },
    async createDog(data, photo) {
      const u = needUser();
      const photo_url = photo ? await blobToDataURL(await resizeImage(photo, 700, 0.7)) : null;
      const dog = {
        ...data, id: newId(), owner_id: u.id, owner_name: u.name, photo_url,
        status: "available", created_at: new Date().toISOString(),
      };
      db.dogs.push(dog);
      try {
        save();
      } catch (err) {
        db.dogs.pop();
        throw err;
      }
      return dog;
    },
    async updateDogStatus(id, status) {
      const u = needUser();
      const dog = db.dogs.find((d) => d.id === id && d.owner_id === u.id);
      if (dog) {
        dog.status = status;
        save();
      }
    },
    async deleteDog(id) {
      const u = needUser();
      db.dogs = db.dogs.filter((d) => !(d.id === id && d.owner_id === u.id));
      db.applications = db.applications.filter((a) => db.dogs.some((d) => d.id === a.dog_id));
      save();
    },

    async applicationsForMyDogs() {
      const u = needUser();
      const myDogIds = new Set(db.dogs.filter((d) => d.owner_id === u.id).map((d) => d.id));
      return newestFirst(db.applications.filter((a) => myDogIds.has(a.dog_id)));
    },
    async myApplications() {
      const u = needUser();
      return newestFirst(db.applications.filter((a) => a.applicant_id === u.id)).map((a) => ({
        ...a,
        dog_name: db.dogs.find((d) => d.id === a.dog_id)?.name,
      }));
    },
    async createApplication(dogId, data) {
      const u = needUser();
      const dog = db.dogs.find((d) => d.id === dogId);
      if (!dog || dog.status !== "available" || dog.owner_id === u.id) throw new Error(t("error.cannotApply"));
      if (db.applications.some((a) => a.dog_id === dogId && a.applicant_id === u.id)) {
        throw new Error(t("error.alreadyApplied"));
      }
      db.applications.push({
        ...data, id: newId(), dog_id: dogId, applicant_id: u.id,
        status: "pending", created_at: new Date().toISOString(),
      });
      save();
    },
    async setApplicationStatus(id, status) {
      const u = needUser();
      const application = db.applications.find((a) => a.id === id);
      const dog = application && db.dogs.find((d) => d.id === application.dog_id);
      if (dog?.owner_id === u.id) {
        application.status = status;
        save();
      }
    },
  };
}

function createSupabaseApi({ supabaseUrl, supabaseAnonKey }) {
  const sb = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  const UUID = /^[0-9a-f-]{36}$/i;

  function check({ data, error }) {
    if (!error) return data;
    if (error.code === "23505") throw new Error(t("error.alreadyApplied"));
    if (error.code === "42501") throw new Error(t("error.cannotApply"));
    throw new Error(error.message || t("error.generic"));
  }

  async function getUser() {
    const { data } = await sb.auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email, name: u.user_metadata?.name || u.email.split("@")[0] } : null;
  }
  async function needUser() {
    const u = await getUser();
    if (!u) throw new Error(t("error.login"));
    return u;
  }

  return {
    isDemo: false,

    getUser,
    async signUp({ name, email, password }) {
      const data = check(await sb.auth.signUp({ email, password, options: { data: { name: name.trim() } } }));
      return { needsConfirm: !data.session };
    },
    async signIn({ email, password }) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(t("error.badLogin"));
    },
    async signOut() {
      await sb.auth.signOut();
    },

    async listDogs() {
      return check(await sb.from("dogs").select("*").neq("status", "adopted").order("created_at", { ascending: false }));
    },
    async getDog(id) {
      if (!UUID.test(id)) return null;
      return check(await sb.from("dogs").select("*").eq("id", id).maybeSingle());
    },
    async myDogs() {
      const u = await needUser();
      return check(await sb.from("dogs").select("*").eq("owner_id", u.id).order("created_at", { ascending: false }));
    },
    async createDog(data, photo) {
      const u = await needUser();
      let photo_url = null;
      if (photo) {
        const path = `${u.id}/${newId()}.jpg`;
        check(await sb.storage.from("dog-photos").upload(path, await resizeImage(photo), { contentType: "image/jpeg" }));
        photo_url = sb.storage.from("dog-photos").getPublicUrl(path).data.publicUrl;
      }
      return check(
        await sb.from("dogs").insert({ ...data, owner_id: u.id, owner_name: u.name, photo_url }).select().single()
      );
    },
    async updateDogStatus(id, status) {
      check(await sb.from("dogs").update({ status }).eq("id", id));
    },
    async deleteDog(id) {
      check(await sb.from("dogs").delete().eq("id", id));
    },

    async applicationsForMyDogs() {
      const u = await needUser();
      return check(
        await sb.from("applications").select("*, dogs!inner(owner_id)").eq("dogs.owner_id", u.id)
          .order("created_at", { ascending: false })
      );
    },
    async myApplications() {
      const u = await needUser();
      const rows = check(
        await sb.from("applications").select("*, dogs(name)").eq("applicant_id", u.id)
          .order("created_at", { ascending: false })
      );
      return rows.map((r) => ({ ...r, dog_name: r.dogs?.name }));
    },
    async createApplication(dogId, data) {
      const u = await needUser();
      check(await sb.from("applications").insert({ ...data, dog_id: dogId, applicant_id: u.id }));
    },
    async setApplicationStatus(id, status) {
      check(await sb.from("applications").update({ status }).eq("id", id));
    },
  };
}

const api = (() => {
  const cfg = window.APP_CONFIG || {};
  if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase) return createSupabaseApi(cfg);
  return createDemoApi();
})();
