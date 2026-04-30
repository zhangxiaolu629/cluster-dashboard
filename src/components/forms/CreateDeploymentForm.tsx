"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Steps, Button, Card, Space, Typography, Alert, message } from "antd";
import Step1BasicInfo from "./CreateDeploymentForm/steps/Step1BasicInfo";
import Step2Container from "./CreateDeploymentForm/steps/Step2Container";
import Step3DeploymentConfig from "./CreateDeploymentForm/steps/Step3DeploymentConfig";
import Step4PodTemplate from "./CreateDeploymentForm/steps/Step4PodTemplate";
import DeploymentPreview from "./CreateDeploymentForm/DeploymentPreview";
import { Slide } from "@/components/common/FadeIn";

const { Title } = Typography;

/** Zod v4 中 `z.string().default(...)` 后不能再链式 `.min()`，用 preprocess 把 undefined/null 变成空串再校验 */
const requiredTrimmedString = (message: string) =>
  z.preprocess((val) => (val === undefined || val === null ? "" : val), z.string().min(1, message));

const optionalEmptyString = z.preprocess(
  (val) => (val === undefined || val === null ? "" : val),
  z.string()
);

const namespaceSchema = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === "") return "default";
    return val;
  },
  z.string().min(1, "命名空间不能为空")
);

const deploymentSchema = z.object({
  name: requiredTrimmedString("名称不能为空"),
  namespace: namespaceSchema,
  labels: z
    .array(
      z.object({
        key: optionalEmptyString,
        value: optionalEmptyString,
      })
    )
    .optional(),
  annotations: z
    .array(
      z.object({
        key: optionalEmptyString,
        value: optionalEmptyString,
      })
    )
    .optional(),
  containerName: requiredTrimmedString("容器名称不能为空"),
  image: requiredTrimmedString("镜像地址不能为空"),
  imagePullPolicy: z.enum(["Always", "IfNotPresent", "Never"]).optional(),
  command: z.array(z.string()).optional(),
  args: z.array(z.string()).optional(),
  workingDir: z.string().optional(),
  portName: z.string().optional(),
  containerPort: z.number().min(1, "容器端口不能为空"),
  protocol: z.enum(["TCP", "UDP"]).optional(),
  cpuRequests: z.string().optional(),
  memoryRequests: z.string().optional(),
  cpuLimits: z.string().optional(),
  memoryLimits: z.string().optional(),
  env: z
    .array(
      z.object({
        name: z.string(),
        value: z.string().optional(),
        valueFromSecret: z
          .object({
            name: z.string(),
            key: z.string(),
          })
          .optional(),
      })
    )
    .optional(),
  livenessProbe: z
    .object({
      enabled: z.boolean(),
      type: z.enum(["httpGet", "tcpSocket", "exec"]).optional(),
      path: z.string().optional(),
      port: z.number().optional(),
      command: z.array(z.string()).optional(),
      initialDelaySeconds: z.number().optional(),
      periodSeconds: z.number().optional(),
      timeoutSeconds: z.number().optional(),
      successThreshold: z.number().optional(),
      failureThreshold: z.number().optional(),
    })
    .optional(),
  readinessProbe: z
    .object({
      enabled: z.boolean(),
      type: z.enum(["httpGet", "tcpSocket", "exec"]).optional(),
      path: z.string().optional(),
      port: z.number().optional(),
      command: z.array(z.string()).optional(),
      initialDelaySeconds: z.number().optional(),
      periodSeconds: z.number().optional(),
      timeoutSeconds: z.number().optional(),
      successThreshold: z.number().optional(),
      failureThreshold: z.number().optional(),
    })
    .optional(),
  replicas: z.number().min(0).optional(),
  minReadySeconds: z.number().min(0).optional(),
  revisionHistoryLimit: z.number().min(0).optional(),
  progressDeadlineSeconds: z.number().min(0).optional(),
  paused: z.boolean().optional(),
  strategyType: z.enum(["RollingUpdate", "Recreate"]).optional(),
  maxSurge: z.union([z.number(), z.string()]).optional(),
  maxUnavailable: z.union([z.number(), z.string()]).optional(),
  matchLabels: z.record(z.string(), z.string()).optional(),
  podLabels: z.preprocess(
    (val) =>
      val !== undefined && val !== null && typeof val === "object" && !Array.isArray(val)
        ? val
        : {},
    z.record(z.string(), z.string())
  ),
  restartPolicy: z.enum(["Always", "IfNotPresent", "Never"]).optional(),
  serviceAccountName: z.string().optional(),
});

type DeploymentFormInput = z.input<typeof deploymentSchema>;
export type DeploymentFormData = z.output<typeof deploymentSchema>;

const defaultValues: Partial<DeploymentFormInput> = {
  name: "",
  namespace: "default",
  containerName: "",
  image: "",
  containerPort: 80,
  podLabels: {},
  labels: [],
  annotations: [],
  imagePullPolicy: "IfNotPresent",
  protocol: "TCP",
  replicas: 1,
  minReadySeconds: 0,
  revisionHistoryLimit: 10,
  progressDeadlineSeconds: 600,
  paused: false,
  strategyType: "RollingUpdate",
  restartPolicy: "Always",
};

export default function CreateDeploymentForm() {
  const params = useParams();
  const ClusterId = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const DRAFT_KEY = `deployment_draft_${ClusterId}`;

  const methods = useForm<DeploymentFormInput, unknown, DeploymentFormData>({
    resolver: zodResolver(deploymentSchema),
    defaultValues,
    mode: "onChange",
  });

  const { handleSubmit, trigger, getValues, watch, reset } = methods;

  // 自动保存草稿
  useEffect(() => {
    const subscription = watch((value) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
        setHasDraft(true);
      } catch {
        // 忽略存储错误
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, DRAFT_KEY]);

  // 加载草稿
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        reset(parsed);
        setHasDraft(true);
      }
    } catch {
      // 忽略解析错误
    }
  }, [DRAFT_KEY, reset]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      message.success("草稿已清除");
    } catch {
      message.error("清除草稿失败");
    }
  };

  const steps = [
    { title: "基础信息" },
    { title: "容器配置" },
    { title: "部署配置" },
    { title: "Pod 模板" },
    { title: "YAML 预览" },
  ];

  const onNext = async () => {
    let isValid = true;
    if (currentStep === 0) {
      isValid = await trigger(["name", "namespace", "labels", "annotations"]);
    } else if (currentStep === 1) {
      isValid = await trigger(["containerName", "image", "containerPort"]);
    } else if (currentStep === 2) {
      isValid = await trigger(["matchLabels", "podLabels"]);
    }

    if (isValid) {
      setSlideDirection("right");
      setCurrentStep((prev) => prev + 1);
    }
  };

  const onPrev = () => {
    setSlideDirection("left");
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: DeploymentFormData) => {
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const yaml = generateYaml(data);
      const response = await fetch("/api/kubernetes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml, namespace: data.namespace, ClusterId }),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        message.success("Deployment 创建成功");
        clearDraft();
        window.history.back();
      } else {
        const err = result.error;
        if (err && typeof err === "object") {
          const code = err.Code || err.Code === 0 ? `(${err.Code})` : "";
          const errMsg = err.Message || "创建失败";
          setSubmitError(`${code} ${errMsg}`.trim());
        } else {
          setSubmitError(err || "创建失败");
        }
      }
    } catch (error) {
      setSubmitError(`创建失败: ${error}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const generateYaml = (data: DeploymentFormData): string => {
    const deployment: Record<string, unknown> = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: data.name,
        namespace: data.namespace,
        labels: data.labels?.reduce(
          (acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        ),
        annotations: data.annotations?.reduce(
          (acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        ),
      },
      spec: {
        replicas: data.replicas,
        minReadySeconds: data.minReadySeconds,
        revisionHistoryLimit: data.revisionHistoryLimit,
        progressDeadlineSeconds: data.progressDeadlineSeconds,
        paused: data.paused,
        selector: {
          matchLabels: data.matchLabels || { app: data.name },
        },
        strategy: {
          type: data.strategyType || "RollingUpdate",
        },
        template: {
          metadata: {
            labels: data.podLabels,
          },
          spec: {
            restartPolicy: data.restartPolicy || "Always",
            serviceAccountName: data.serviceAccountName,
            containers: [
              {
                name: data.containerName,
                image: data.image,
                imagePullPolicy: data.imagePullPolicy || "IfNotPresent",
              },
            ],
          },
        },
      },
    };

    const deploymentSpec = deployment.spec as {
      strategy: Record<string, unknown>;
      template: {
        spec: {
          containers: Array<Record<string, unknown>>;
        };
      };
    };
    const container = deploymentSpec.template.spec.containers[0];

    if (data.command?.length) container.command = data.command;
    if (data.args?.length) container.args = data.args;
    if (data.workingDir) container.workingDir = data.workingDir;

    if (data.portName || data.containerPort) {
      container.ports = [
        {
          name: data.portName,
          containerPort: data.containerPort,
          protocol: data.protocol || "TCP",
        },
      ];
    }

    if (data.cpuRequests || data.memoryRequests || data.cpuLimits || data.memoryLimits) {
      container.resources = { requests: {}, limits: {} };
      if (data.cpuRequests) container.resources.requests.cpu = data.cpuRequests;
      if (data.memoryRequests) container.resources.requests.memory = data.memoryRequests;
      if (data.cpuLimits) container.resources.limits.cpu = data.cpuLimits;
      if (data.memoryLimits) container.resources.limits.memory = data.memoryLimits;
    }

    if (data.env?.length) {
      container.env = data.env.map((e) => {
        if (e.valueFromSecret) {
          return {
            name: e.name,
            valueFrom: {
              secretKeyRef: e.valueFromSecret,
            },
          };
        }
        return { name: e.name, value: e.value || "" };
      });
    }

    if (data.strategyType === "RollingUpdate" && (data.maxSurge || data.maxUnavailable)) {
      deploymentSpec.strategy.rollingUpdate = {};
      if (data.maxSurge !== undefined)
        (deploymentSpec.strategy.rollingUpdate as Record<string, unknown>).maxSurge = data.maxSurge;
      if (data.maxUnavailable !== undefined)
        (deploymentSpec.strategy.rollingUpdate as Record<string, unknown>).maxUnavailable =
          data.maxUnavailable;
    }

    const probes: Array<"livenessProbe" | "readinessProbe"> = [];
    if (data.livenessProbe?.enabled) probes.push("livenessProbe");
    if (data.readinessProbe?.enabled) probes.push("readinessProbe");

    probes.forEach((probeType) => {
      const probe = data[probeType];
      if (!probe) return;

      const probeConfig: Record<string, unknown> = {};
      probeConfig.initialDelaySeconds = probe.initialDelaySeconds || 0;
      probeConfig.periodSeconds = probe.periodSeconds || 10;
      probeConfig.timeoutSeconds = probe.timeoutSeconds || 1;
      probeConfig.successThreshold = probe.successThreshold || 1;
      probeConfig.failureThreshold = probe.failureThreshold || 3;

      if (probe.type === "httpGet" && probe.path && probe.port) {
        probeConfig.httpGet = { path: probe.path, port: probe.port };
      } else if (probe.type === "tcpSocket" && probe.port) {
        probeConfig.tcpSocket = { port: probe.port };
      } else if (probe.type === "exec" && probe.command?.length) {
        probeConfig.exec = { command: probe.command };
      }

      container[probeType] = probeConfig;
    });

    return JSON.stringify(deployment, null, 2);
  };

  const renderStep = () => {
    const stepComponents = [
      <Step1BasicInfo key="step-1" />,
      <Step2Container key="step-2" />,
      <Step3DeploymentConfig key="step-3" />,
      <Step4PodTemplate key="step-4" />,
      <DeploymentPreview key="step-5" yaml={generateYaml(getValues() as DeploymentFormData)} />,
    ];

    return (
      <Slide active={true} direction={slideDirection}>
        {stepComponents[currentStep]}
      </Slide>
    );
  };

  return (
    <FormProvider {...methods}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            新建 Deployment
          </Title>
          {hasDraft && (
            <Button size="small" danger onClick={clearDraft}>
              清除草稿
            </Button>
          )}
        </div>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        {hasDraft && (
          <Alert
            message="草稿已保存"
            description="您的输入已自动保存到本地，刷新页面后数据不会丢失。"
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        {currentStep === 4 && submitError && (
          <Alert
            message="创建失败"
            description={submitError}
            type="error"
            showIcon
            closable
            onClose={() => setSubmitError(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        {renderStep()}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <Space>
            <Button onClick={() => window.history.back()}>取消</Button>
          </Space>
          <Space>
            {currentStep > 0 && <Button onClick={onPrev}>上一步</Button>}
            {currentStep < 4 && (
              <Button type="primary" onClick={onNext}>
                下一步
              </Button>
            )}
            {currentStep === 4 && (
              <>
                <Button type="primary" onClick={handleSubmit(onSubmit)} loading={submitLoading}>
                  创建
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>
    </FormProvider>
  );
}
