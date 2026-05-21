let adminToken = "";

async function getAdminToken() {
  const url = process.env.POCKETBASE_URL;
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!url || !email || !password) return "";

  if (adminToken) return adminToken;

  try {
    let authUrl = `${url}/api/collections/_superusers/auth-with-password`;
    // Fallback para versiones antiguas de PocketBase por si acaso
    // const authUrl = `${url}/api/admins/auth-with-password`;
    
    const res = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to authenticate with PocketBase");
    const data = await res.json();
    adminToken = data.token || "";
    return adminToken;
  } catch (err) {
    console.error("[PocketBase Auth Error]", err);
    return "";
  }
}

export async function pbCreate(collection: string, data: Record<string, any>) {
  const baseUrl = process.env.POCKETBASE_URL;
  if (!baseUrl) throw new Error("POCKETBASE_URL is not defined");

  const token = await getAdminToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  const res = await fetch(`${baseUrl}/api/collections/${collection}/records`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `PocketBase create error on ${collection}`);
  }

  return res.json();
}

export async function pbUpdate(collection: string, id: string, data: Record<string, any>) {
  const baseUrl = process.env.POCKETBASE_URL;
  if (!baseUrl) throw new Error("POCKETBASE_URL is not defined");

  const token = await getAdminToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = token;

  const res = await fetch(`${baseUrl}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `PocketBase update error on ${collection} with ID ${id}`);
  }

  return res.json();
}

export async function pbList(collection: string, filter?: string) {
  const baseUrl = process.env.POCKETBASE_URL;
  if (!baseUrl) throw new Error("POCKETBASE_URL is not defined");

  const token = await getAdminToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = token;

  let url = `${baseUrl}/api/collections/${collection}/records`;
  if (filter) {
    url += `?filter=${encodeURIComponent(filter)}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `PocketBase list error on ${collection}`);
  }

  const result = await res.json();
  return result.items || [];
}
