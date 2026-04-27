const K8S_API_SERVER = process.env.K8S_API_SERVER;
const K8S_TOKEN = process.env.K8S_TOKEN;

if (!K8S_API_SERVER || !K8S_TOKEN) {
  throw new Error("K8S_API_SERVER and K8S_TOKEN must be set in environment variables");
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function k8sFetch(path: string, options?: RequestInit) {
  const url = `${K8S_API_SERVER}${path}`;
  console.log('url',url)
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${K8S_TOKEN}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`K8s API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}
