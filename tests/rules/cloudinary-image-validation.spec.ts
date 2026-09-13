import { expect, test } from "@playwright/test"
import { createCloudinarySignature } from "@/lib/cloudinary"
import { CLOUDINARY_MAX_IMAGE_BYTES, validateCloudinaryImage } from "@/lib/cloudinary-validation"

const valid = { kind: "hero" as const, format: "jpg", width: 1600, height: 900, bytes: 1000, altText: "Heathrow terminal", sourceOwner: "ONE Airport Taxi", licenseNote: "Owned image", rightsConfirmed: true }

test("accepts a compliant hero image and signs stable Cloudinary parameters", () => {
  expect(validateCloudinaryImage(valid)).toBeNull()
  expect(createCloudinarySignature({ timestamp: 1700000000, folder: "airport-pages/hero" }, "secret")).toBe("adcafd1db379d524562158b264934d6cb6d55130")
})

test("rejects unsupported formats, oversize files, and invalid hero dimensions", () => {
  expect(validateCloudinaryImage({ ...valid, format: "gif" })).toContain("JPG")
  expect(validateCloudinaryImage({ ...valid, bytes: CLOUDINARY_MAX_IMAGE_BYTES + 1 })).toContain("8 MB")
  expect(validateCloudinaryImage({ ...valid, width: 1200, height: 675 })).toBeNull()
  expect(validateCloudinaryImage({ ...valid, height: 800 })).toContain("16:9")
})

test("requires rights and accessibility metadata for content images", () => {
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1200, height: 900, altText: "", rightsConfirmed: false })).toContain("Alt text")
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1200, height: 900, sourceOwner: "" })).toContain("source")
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1200, height: 900, licenseNote: "" })).toContain("licence")
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1200, height: 900, rightsConfirmed: false })).toContain("right")
})

test("accepts only the approved content shapes", () => {
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1200, height: 900 })).toBeNull()
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1600, height: 900 })).toBeNull()
  expect(validateCloudinaryImage({ ...valid, kind: "content", width: 1400, height: 800 })).toContain("4:3 or 16:9")
})
