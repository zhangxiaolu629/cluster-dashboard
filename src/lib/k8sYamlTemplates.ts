/** 与列表页「YAML新建」跳转参数 `?kind=` 一致，均为 K8s kind 字符串 */
export type YamlQuickCreateKind = "Namespace" | "Service" | "Deployment" | "StatefulSet";

const isYamlQuickCreateKind = (s: string): s is YamlQuickCreateKind =>
  s === "Namespace" || s === "Service" || s === "Deployment" || s === "StatefulSet";

/** 根据资源类型返回编辑器初始 YAML；未知 kind 返回空串 */
export function getInitialYamlForKind(kind: string | null | undefined): string {
  if (!kind || !isYamlQuickCreateKind(kind)) {
    return "";
  }
  switch (kind) {
    case "Namespace":
      return `apiVersion: v1
kind: Namespace
metadata:
  name: example-namespace
`;
    case "Service":
      return `apiVersion: v1
kind: Service
metadata:
  name: example-service
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: example
  ports:
    - name: http
      port: 80
      targetPort: 8080
`;
    case "Deployment":
      return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:latest
`;
    case "StatefulSet":
      return `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: example-statefulset
  namespace: default
spec:
  serviceName: example-headless
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: app
          image: nginx:latest
`;
    default:
      return "";
  }
}
