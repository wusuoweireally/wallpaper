import assert from "node:assert/strict"
import {
  buildChangePasswordPayload,
  buildLoginPayload,
  buildRegisterPayload,
  isPasswordLengthValid,
  PASSWORD_MIN_LENGTH,
} from "./authPayload.ts"

function testLoginUsesAccount() {
  const payload = buildLoginPayload("  alice@example.com ", "secret")
  assert.deepEqual(payload, { account: "alice@example.com", password: "secret" })
  assert.ok(!("id" in payload))
}

function testRegisterOmitsId() {
  const payload = buildRegisterPayload("  bob ", "password12")
  assert.deepEqual(payload, { username: "bob", password: "password12" })
  assert.ok(!("id" in payload))

  const withEmail = buildRegisterPayload("bob", "password12", " bob@x.com ")
  assert.deepEqual(withEmail, {
    username: "bob",
    password: "password12",
    email: "bob@x.com",
  })
}

function testChangePasswordShape() {
  const payload = buildChangePasswordPayload("old-pass-1", "new-pass-99")
  assert.deepEqual(payload, {
    currentPassword: "old-pass-1",
    newPassword: "new-pass-99",
  })
}

function testPasswordLength() {
  assert.equal(isPasswordLengthValid("short"), false)
  assert.equal(isPasswordLengthValid("a".repeat(PASSWORD_MIN_LENGTH)), true)
  assert.equal(isPasswordLengthValid("a".repeat(65)), false)
}

function main() {
  testLoginUsesAccount()
  testRegisterOmitsId()
  testChangePasswordShape()
  testPasswordLength()
  process.stdout.write("authPayload tests passed\n")
}

main()
