export type K8sObjectMeta = {
  name?: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
};

export type K8sObjectReference = {
  kind?: string;
  namespace?: string;
  name?: string;
  uid?: string;
  apiVersion?: string;
  resourceVersion?: string;
  fieldPath?: string;
};

export type K8sEvent = {
  metadata: K8sObjectMeta;
  involvedObject: K8sObjectReference;
  reason?: string;
  message?: string;
  type?: "Normal" | "Warning" | string;
  count?: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
  eventTime?: string;
  source?: {
    component: string;
    host?: string;
  };
  action?: string;
  related?: K8sObjectReference;
  reportingComponent?: string;
  reportingInstance?: string;
};

export type K8sEventList = {
  kind: "EventList";
  apiVersion: "v1";
  metadata: {
    resourceVersion: string;
    continue?: string;
  };
  items: K8sEvent[];
};
