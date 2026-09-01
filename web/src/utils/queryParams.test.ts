import assert from "node:assert/strict"
import { serializeQueryParams } from "./queryParams.ts"
import { buildApiListQuery, defaultBrowseFilters } from "./wallpaperBrowse.ts"

/** 证明不会产出 Nest 会拒的 resolutions[] / tags[] 括号形式 */
function testNoBracketArrayKeys() {
  const qs = serializeQueryParams({
    resolutions: ["1920x1080"],
    tags: ["anime", "sky"],
    page: 1,
  })
  assert.equal(qs.includes("resolutions[]"), false)
  assert.equal(qs.includes("tags[]"), false)
  assert.ok(qs.includes("resolutions=1920x1080"))
  assert.ok(qs.includes("tags=anime"))
  assert.ok(qs.includes("tags=sky"))
  assert.ok(qs.includes("page=1"))
}

/** 与列表页 exact 分辨率同一路径：browse helper → serialize（即 axios paramsSerializer） */
function testExactResolutionPipeline() {
  const f = defaultBrowseFilters()
  f.resolutionMode = "exact"
  f.exactResolution = "1920x1080"
  const apiParams = buildApiListQuery(f, 1, 20)
  assert.deepEqual(apiParams.resolutions, ["1920x1080"])

  const qs = serializeQueryParams(apiParams as unknown as Record<string, unknown>)
  assert.equal(qs.includes("resolutions[]"), false)
  assert.match(qs, /resolutions=1920x1080/)
  // 可直接拼到后端
  assert.ok(!/%5B%5D/.test(qs), "must not URL-encode empty brackets for arrays")
}

function testTagsPipeline() {
  const f = defaultBrowseFilters()
  f.tags = "foo,bar"
  const apiParams = buildApiListQuery(f, 1, 20)
  assert.deepEqual(apiParams.tags, ["foo", "bar"])
  const qs = serializeQueryParams(apiParams as unknown as Record<string, unknown>)
  assert.equal(qs.includes("tags[]"), false)
  assert.ok(qs.includes("tags=foo"))
  assert.ok(qs.includes("tags=bar"))
}

function testEmptyAndNullSkipped() {
  const qs = serializeQueryParams({ a: undefined, b: null, c: "", d: 0 })
  assert.equal(qs.includes("a="), false)
  assert.equal(qs.includes("b="), false)
  assert.ok(qs.includes("c="))
  assert.ok(qs.includes("d=0"))
}

testNoBracketArrayKeys()
testExactResolutionPipeline()
testTagsPipeline()
testEmptyAndNullSkipped()
