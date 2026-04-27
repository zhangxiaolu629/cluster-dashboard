import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export function formatTime(value: string, format: "relative" | "absolute" = "relative") {
  if (format === "relative") {
    return dayjs(value).fromNow();
  }
  return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
}

export function getStatusTag(ready: number, total: number) {
  if (total === 0) {
    return { color: "gray", text: "无副本" };
  }
  if (ready === total) {
    return { color: "green", text: "就绪" };
  }
  if (ready > 0) {
    return { color: "orange", text: "部分就绪" };
  }
  return { color: "red", text: "未就绪" };
}