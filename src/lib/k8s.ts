const K8S_API_SERVER = process.env.K8S_API_SERVER;
const K8S_TOKEN = process.env.K8S_TOKEN;

if (!K8S_API_SERVER || !K8S_TOKEN) {
  throw new Error("K8S_API_SERVER and K8S_TOKEN must be set in environment variables");
}

// 当前集群 API 使用自签证书，开发与内网环境需要跳过 TLS 校验。
// 后续可改为受控开关（例如 K8S_INSECURE_SKIP_TLS_VERIFY）以避免生产误用。
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function k8sFetch(path: string, options?: RequestInit) {
  const url = `${K8S_API_SERVER}${path}`;
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
