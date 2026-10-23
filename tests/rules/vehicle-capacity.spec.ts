import { expect, test } from "@playwright/test"
import { getVehicle, maxBags, maxPassengers, seatCount } from "@/lib/fleet"

test("fleet cards carry the published passenger and luggage limits", () => {
  const limits = (id: string) => { const v = getVehicle(id)!; return [v.capacity, v.luggage, v.handLuggage ?? 0] }
  expect(limits("standard")).toEqual([4, 2, 2])
  expect(limits("executive")).toEqual([3, 2, 2])
  expect(limits("estate")).toEqual([4, 3, 1])
  expect(limits("mpv_4seater")).toEqual([4, 4, 2])
  expect(limits("mpv")).toEqual([5, 5, 0])
  expect(limits("minibus_8seater")).toEqual([8, 8, 0])
  expect(getVehicle("minibus_8seater")!.luggageNote).toBe("23kg max")
})

test("the 6 seater MPV takes a sixth passenger only with hand luggage", () => {
  const mpv = getVehicle("mpv")!
  expect(seatCount(mpv)).toBe(6)
  expect(maxPassengers(mpv, 0)).toBe(6)
  expect(maxPassengers(mpv, 1)).toBe(5)
  expect(maxBags(mpv, 5)).toBe(5)
  expect(maxBags(mpv, 6)).toBe(0)
})

test("vehicles without hand-luggage seats keep their normal limits", () => {
  const saloon = getVehicle("standard")!
  expect(seatCount(saloon)).toBe(4)
  expect(maxPassengers(saloon, 0)).toBe(4)
  expect(maxBags(saloon, 4)).toBe(2)
})
