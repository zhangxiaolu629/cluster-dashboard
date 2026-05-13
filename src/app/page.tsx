import HomePage from "@/components/cluster/HomePage";
import { Service } from "@volcengine/openapi";
import { requirePageSession } from "@/lib/require-page-session";

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
  await requirePageSession("/");

  let initialClusters: VolcCluster[] = [];

  try {
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
  } catch (error) {
    console.error("Failed to fetch initial home cluster list:", error);
  }

  return <HomePage initialClusters={initialClusters} initialLoaded />;
}
