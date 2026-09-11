import { expect, test } from "@playwright/test"
import { friendlyDatabaseError } from "@/lib/admin-destination-pages"

test("save errors explain duplicate airport identity fields", () => {
  expect(friendlyDatabaseError({ code: "23505", message: "duplicate key value violates unique constraint destination_pages_slug_key" })).toBe("That Airport Slug is already in use. Choose a different slug.")
  expect(friendlyDatabaseError({ code: "23505", message: "duplicate key value violates unique constraint destination_pages_iata_code_key" })).toBe("That IATA code is already in use. Check the airport code.")
})
