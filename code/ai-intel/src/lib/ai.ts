// 薄壳：把统一 AI 能力从 @mi/ai-core 重新导出，业务代码不用改
// 真正的实现在 packages/ai-core/src/index.ts
export {
  askJSON,
  askText,
  createAIClient,
  currentProvider,
  resetDefaultClient,
  AIClient,
  extractJSON,
  DEFAULT_PRICING,
} from "@mi/ai-core";

export type {
  AskOptions,
  AskResult,
  AIClientOptions,
  Provider,
  Usage,
} from "@mi/ai-core";
