import assert from "node:assert/strict"
import {
  isAuthPath,
  isSafeInternalPath,
  resolvePostLoginRedirect,
  sanitizeStoredRedirect,
} from "./safeRedirect.ts"

function testRejectsOpenRedirect() {
  assert.equal(isSafeInternalPath("/upload"), true)
  assert.equal(isSafeInternalPath("/forums/new"), true)
  assert.equal(isSafeInternalPath("//evil.com"), false)
  assert.equal(isSafeInternalPath("https://evil.com"), false)
  assert.equal(isSafeInternalPath("/\\evil.com"), false)
}

function testAuthPaths() {
  assert.equal(isAuthPath("/auth/login"), true)
  assert.equal(isAuthPath("/auth/login?redirect=/upload"), true)
  assert.equal(isAuthPath("/auth/github/success"), true)
  assert.equal(isAuthPath("/upload"), false)
}

function testResolvePrefersQueryRedirect() {
  assert.equal(resolvePostLoginRedirect("/upload", "/auth/login?redirect=/upload"), "/upload")
  assert.equal(resolvePostLoginRedirect(undefined, "/auth/login?redirect=/upload"), "/")
  assert.equal(resolvePostLoginRedirect(undefined, "/forums/new"), "/forums/new")
  assert.equal(resolvePostLoginRedirect("//evil.com", "/auth/login"), "/")
}

function testSanitizeStored() {
  assert.equal(sanitizeStoredRedirect("/auth/login?redirect=/upload"), "/")
  assert.equal(sanitizeStoredRedirect("/wallpaper/12"), "/wallpaper/12")
  assert.equal(sanitizeStoredRedirect(null), "/")
}

testRejectsOpenRedirect()
testAuthPaths()
testResolvePrefersQueryRedirect()
testSanitizeStored()
