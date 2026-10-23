import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { transformSync } from "@esbuild-kit/core-utils";
import remarkFrontmatter from "remark-frontmatter";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { evaluate } from "@mdx-js/mdx";
import test from "node:test";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));

async function loadTypeScript(relativePath, globals = {}) {
  const url = new URL(relativePath, import.meta.url);
  const { code } = transformSync(await readFile(url, "utf8"), fileURLToPath(url));
  const module = { exports: {} };
  runInNewContext(code, { module, exports: module.exports, require: createRequire(url), ...globals });
  return module.exports;
}

test("the MDX frontmatter plugin compiles TOML metadata with its patched parser", async () => {
  const source = `+++
title = "Invoice & receipt"
slug = "invoice-without-limits"
summary = "Create a professional invoice."
thumbnail = "/blogs/invoice.png"
tags = ["invoices", "freelancers"]
+++

# Invoice & receipt
`;
  const compiled = await evaluate(source, {
    ...webRequire("react/jsx-runtime"),
    remarkPlugins: [[remarkFrontmatter, ["yaml", "toml"]], remarkMdxFrontmatter],
  });

  assert.deepEqual(
    { ...compiled.frontmatter },
    {
      title: "Invoice & receipt",
      slug: "invoice-without-limits",
      summary: "Create a professional invoice.",
      thumbnail: "/blogs/invoice.png",
      tags: ["invoices", "freelancers"],
    },
  );
  const { createElement } = webRequire("react");
  const { renderToStaticMarkup } = webRequire("react-dom/server");
  assert.equal(renderToStaticMarkup(createElement(compiled.default)), "<h1>Invoice &amp; receipt</h1>");
});

test("authentication callback URLs stay inside protected application routes", async () => {
  const { createCallbackUrl, getSafeCallbackUrl } = await loadTypeScript("../apps/web/src/lib/auth-callback.ts", {
    URL,
    URLSearchParams,
  });

  assert.equal(
    getSafeCallbackUrl("/edit/5b38e1cc-d9bd-4dab-9009-b874792a561c?mode=preview#invoice"),
    "/edit/5b38e1cc-d9bd-4dab-9009-b874792a561c?mode=preview#invoice",
  );
  assert.equal(getSafeCallbackUrl(["/assets", "https://evil.example/dashboard"]), "/assets");
  assert.equal(getSafeCallbackUrl("https://evil.example/dashboard"), "/dashboard");
  assert.equal(getSafeCallbackUrl("//evil.example/invoices"), "/dashboard");
  assert.equal(getSafeCallbackUrl("javascript:alert(1)"), "/dashboard");
  assert.equal(getSafeCallbackUrl("/blogs"), "/dashboard");
  assert.equal(getSafeCallbackUrl(undefined), "/dashboard");
  assert.equal(
    createCallbackUrl("/invoices", { status: "pending", client: ["Acme & Co", "Example"] }),
    "/invoices?status=pending&client=Acme+%26+Co&client=Example",
  );
});

test("Drizzle's legacy TypeScript loader accepts the app config with patched esbuild", async () => {
  const databaseUrl = "postgresql://test:test@localhost:5432/security_test";
  const config = await loadTypeScript("../packages/db/drizzle.config.ts", {
    process: { env: { DATABASE_URL: databaseUrl } },
    require: (specifier) => {
      // The test supplies its own environment and must not read local .env files.
      assert.equal(specifier, "dotenv/config");
      return {};
    },
  });

  assert.equal(config.default.dialect, "postgresql");
  assert.equal(config.default.schema, "./src/schema/index.ts");
  assert.equal(config.default.dbCredentials.url, databaseUrl);
});

test("S3 image listings deserialize XML with the SDK's supported parser", async (t) => {
  const requests = [];
  const client = new S3Client({
    endpoint: "https://r2.example.invalid",
    region: "auto",
    forcePathStyle: true,
    maxAttempts: 1,
    credentials: { accessKeyId: "test-access-key", secretAccessKey: "test-secret-key" },
    requestHandler: {
      handle: async (request) => {
        requests.push(request);
        return {
          response: {
            statusCode: 200,
            headers: { "content-type": "application/xml" },
            body: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>images</Name><Prefix>user-123/</Prefix><KeyCount>2</KeyCount><IsTruncated>false</IsTruncated>
  <Contents><Key>user-123/logo&amp;signature.png</Key><LastModified>2026-10-05T08:30:00.000Z</LastModified><Size>1234</Size></Contents>
  <Contents><Key>user-123/logo.png</Key><LastModified>2026-10-04T08:30:00.000Z</LastModified><Size>5678</Size></Contents>
</ListBucketResult>`),
          },
        };
      },
    },
  });
  t.after(() => client.destroy());

  const result = await client.send(new ListObjectsV2Command({ Bucket: "images", Prefix: "user-123/" }));

  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "GET");
  assert.equal(requests[0].query.prefix, "user-123/");
  assert.equal(result.IsTruncated, false);
  assert.equal(result.KeyCount, 2);
  assert.equal(result.Contents.length, 2);
  assert.equal(result.Contents[0].Key, "user-123/logo&signature.png");
  assert.equal(result.Contents[0].Size, 1234);
  assert.ok(result.Contents[0].LastModified instanceof Date);
  assert.equal(result.Contents[0].LastModified.toISOString(), "2026-10-05T08:30:00.000Z");
});
