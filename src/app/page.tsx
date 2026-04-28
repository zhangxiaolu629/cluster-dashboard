import HomePage from "@/components/cluster/HomePage";
import { Service } from "@volcengine/openapi";

type VolcCluster = {
  Id: string;
  Name: string;
  Status: {
    Phase: string;
  };
  CreateTime?: string;
};

type ListClustersResponse = {
  Result?: {
    Items?: VolcCluster[];
  };
};

export default async function Home() {
  let initialClusters: VolcCluster[] = [];
  const isDev = process.env.NODE_ENV !== "production";
  const startTime = Date.now();

  try {
    if (isDev) {
      console.info("[home:ssr] ListClusters request started");
    }
    const service = new Service({
      accessKeyId: process.env.VOLC_ACCESS_KEY_ID!,
      secretKey: process.env.VOLC_SECRET_ACCESS_KEY!,
      region: process.env.REGION,
      serviceName: "vke",
    });

    const listClustersApi = service.createJSONAPI("ListClusters", {
      Version: "2022-05-12",
      method: "POST",
    });

    const response = (await listClustersApi({})) as ListClustersResponse;
    if (Array.isArray(response?.Result?.Items)) {
      initialClusters = response.Result.Items;
    }
    if (isDev) {
      console.info(
        `[home:ssr] ListClusters request finished in ${Date.now() - startTime}ms, items=${initialClusters.length}`
      );
    }
  } catch (error) {
    console.error("Failed to fetch initial home cluster list:", error);
  }

  return <HomePage initialClusters={initialClusters} initialLoaded />;
}
