import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

describe("Encryption Utils", () => {
  const testData = "Hello, this is a test message!";
  const sensitiveData = "access_token_12345";

  describe("encrypt", () => {
    it("should encrypt a string successfully", () => {
      const encrypted = encrypt(testData);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(testData);
      expect(encrypted.split(":")).toHaveLength(3); // iv:authTag:encrypted format
    });

    it("should produce different outputs for same input", () => {
      const encrypted1 = encrypt(testData);
      const encrypted2 = encrypt(testData);

      expect(encrypted1).not.toBe(encrypted2); // Different IVs
    });

    it("should handle empty string", () => {
      const encrypted = encrypt("");

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted.split(":")).toHaveLength(3);
    });

    it("should handle special characters", () => {
      const specialText = "éàç!@#$%^&*(){}[]|\\:;\"'<>?/~`";
      const encrypted = encrypt(specialText);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
    });
  });

  describe("decrypt", () => {
    it("should decrypt encrypted data back to original", () => {
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(testData);
    });

    it("should handle empty string encryption/decryption", () => {
      const encrypted = encrypt("");
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe("");
    });

    it("should handle special characters", () => {
      const specialText = "éàç!@#$%^&*(){}[]|\\:;\"'<>?/~`";
      const encrypted = encrypt(specialText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(specialText);
    });

    it("should throw error for invalid encrypted data format", () => {
      const invalidData = "invalid:format";

      expect(() => decrypt(invalidData)).toThrow("Decryption failed");
    });

    it("should throw error for malformed encrypted data", () => {
      const malformedData = "not:encrypted:data:format";

      expect(() => decrypt(malformedData)).toThrow("Decryption failed");
    });

    it("should throw error for completely invalid data", () => {
      const invalidData = "this-is-not-encrypted-data";

      expect(() => decrypt(invalidData)).toThrow("Decryption failed");
    });
  });

  describe("round-trip encryption", () => {
    it("should maintain data integrity through encrypt/decrypt cycle", () => {
      const originalData = sensitiveData;
      const encrypted = encrypt(originalData);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalData);
      expect(encrypted).not.toBe(originalData);
    });

    it("should handle multiple round trips", () => {
      let data = testData;

      // Encrypt and decrypt multiple times
      for (let i = 0; i < 5; i++) {
        const encrypted = encrypt(data);
        data = decrypt(encrypted);
      }

      expect(data).toBe(testData);
    });

    it("should handle long strings", () => {
      const longString = "a".repeat(1000);
      const encrypted = encrypt(longString);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longString);
      expect(decrypted.length).toBe(1000);
    });

    it("should handle JSON data", () => {
      const jsonData = JSON.stringify({
        accessToken: "token123",
        refreshToken: "refresh456",
        expiresAt: Date.now(),
      });

      const encrypted = encrypt(jsonData);
      const decrypted = decrypt(encrypted);
      const parsed = JSON.parse(decrypted);

      expect(parsed.accessToken).toBe("token123");
      expect(parsed.refreshToken).toBe("refresh456");
    });
  });
});
