import { Injectable, Logger, BadGatewayException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import COS from "cos-nodejs-sdk-v5";

/** 超过该大小时走分片并发上传（跨境链路单流受限，并发分片可提速一倍以上） */
const MULTIPART_THRESHOLD_BYTES = 1024 * 1024;
/** 分片大小（与跨境 RTT/带宽匹配，实测 1MB 最优） */
const SLICE_SIZE_BYTES = 1024 * 1024;

export interface AuditResult {
  passed: boolean; // 是否通过内容审核
  label: string; // Normal 或命中的维度标签
  score: number; // 命中维度的最大置信度 0-100
}

/**
 * 腾讯云 COS 封装：对象上传、同步内容审核、公有读切换、删除
 * 桶默认私有读；上传后先同步审核，通过才公开——避免"上传成功但图被冻结裂图"
 */
@Injectable()
export class CosService {
  private readonly logger = new Logger(CosService.name);
  private readonly cos: COS;
  private readonly bucket = process.env.COS_BUCKET!;
  private readonly region = process.env.COS_REGION!;
  private readonly publicBase = process.env.COS_PUBLIC_BASE!;

  constructor() {
    this.cos = new COS({
      SecretId: process.env.COS_SECRET_ID!,
      SecretKey: process.env.COS_SECRET_KEY!,
      ChunkParallelLimit: 8,
    });
  }

  /** 上传对象（桶默认私有读，外部不可访问）；contentDisposition 用于下载场景强制附件头 */
  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
    contentDisposition?: string,
  ): Promise<void> {
    const base = {
      Bucket: this.bucket,
      Region: this.region,
      Key: key,
      ContentType: contentType,
      ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
    };
    if (body.length <= MULTIPART_THRESHOLD_BYTES) {
      await this.cos.putObject({ ...base, Body: body });
      return;
    }
    // 大文件：落临时文件走分片并发上传，完成后清理
    const tmpPath = join(tmpdir(), `cos-upload-${randomUUID()}`);
    try {
      await fs.writeFile(tmpPath, body);
      await this.cos.uploadFile({
        ...base,
        FilePath: tmpPath,
        SliceSize: SLICE_SIZE_BYTES,
      });
    } catch (err) {
      // SDK 的 uploadFile 错误路径不会自动中止 multipart 会话，
      // 残留 UploadId 与已传分片会一直占用存储计费——显式中止
      await new Promise<void>((resolve) => {
        this.cos.abortUploadTask(
          { Bucket: this.bucket, Region: this.region, Key: key, Level: "file" },
          (abortErr) => {
            if (abortErr) {
              this.logger.warn(
                `中止 COS 分片会话失败（对象可能残留分片）: ${key} - ${abortErr.message}`,
              );
            }
            resolve();
          },
        );
      });
      throw err;
    } finally {
      await fs.rm(tmpPath, { force: true });
    }
  }

  /** 审核通过后把对象设为公有读 */
  async setPublicRead(key: string): Promise<void> {
    await this.cos.putObjectAcl({
      Bucket: this.bucket,
      Region: this.region,
      Key: key,
      ACL: "public-read",
    });
  }

  /**
   * 同步内容审核：命中任一维度（HitFlag!=0，含疑似）则视为违规
   * 任一维度 Code!=0 视为审核服务异常，抛 BadGatewayException 让调用方兜底
   * 注意：ci-process 值是 sensitive-content-recognition（连字符，下划线会 Action mismatch）
   * fileSize > 5MB 时必须带 large-image-detect=1（压缩后审核，收取图片基础处理费），否则接口报错
   */
  async auditImage(key: string, fileSize?: number): Promise<AuditResult> {
    const query: Record<string, string> = {
      "ci-process": "sensitive-content-recognition",
    };
    // 自定义审核策略：配了 BizType 就走它（覆盖桶默认策略），留空回落默认策略
    const bizType = process.env.COS_AUDIT_BIZ_TYPE?.trim();
    if (bizType) query["biz-type"] = bizType;
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      query["large-image-detect"] = "1";
    }
    const res = (await this.cos.request({
      Method: "GET",
      Bucket: this.bucket,
      Region: this.region,
      Key: key,
      Query: query,
    })) as Record<string, unknown>;

    const result = (res as { RecognitionResult?: Record<string, unknown> })
      ?.RecognitionResult;
    if (!result) {
      throw new BadGatewayException("图片审核结果解析失败");
    }

    let passed = true;
    let label = "Normal";
    let maxScore = 0;
    // 各审核场景块（PornInfo / AdsInfo / PoliticsInfo 等），动态遍历兼容新增维度
    for (const [blockName, block] of Object.entries(result)) {
      if (!blockName.endsWith("Info")) continue;
      const info = block as
        | { Code?: string; HitFlag?: string; Score?: string; Label?: string }
        | undefined;
      if (!info) continue;
      const score = Number(info.Score ?? 0);
      if (score > maxScore) maxScore = score;
      if (String(info.Code ?? "0") !== "0") {
        throw new BadGatewayException(`审核服务异常: ${blockName}`);
      }
      // HitFlag: 0=正常 1=违规 2=疑似；疑似也拒绝（保守）
      if (String(info.HitFlag ?? "0") !== "0") {
        passed = false;
        label = info.Label || blockName;
      }
    }
    return { passed, label, score: maxScore };
  }

  /**
   * 删除对象（幂等）。失败不抛错但返回 false 并记 error 级日志——
   * 调用方的"不留孤儿对象"承诺依赖这里至少留下痕迹。
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      await this.cos.deleteObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `COS 删除失败(对象可能残留): ${key} - ${(err as Error).message}`,
      );
      return false;
    }
  }

  /** 从完整公开 URL 提取 COS key */
  keyFromUrl(url: string): string {
    return url.replace(new RegExp(`^${this.publicBase}/`), "");
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}
