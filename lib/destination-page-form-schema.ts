import { z } from "zod"

export const destinationPageEditorSchema = z.object({
  officialName: z.string().trim(),
  displayName: z.string().trim(),
  iataCode: z.string().refine((value) => !value || /^[A-Z]{3}$/.test(value), "IATA code must be exactly three uppercase letters."),
  serviceArea: z.string().trim(),
  slug: z.string().refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/.test(value), "Use lowercase words separated by hyphens and ending in -airport-taxi."),
  googlePlaceId: z.string().trim(),
  address: z.string().trim(),
  latitude: z.number().finite().min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90."),
  longitude: z.number().finite().min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180."),
})

export type DestinationPageEditorValues = z.infer<typeof destinationPageEditorSchema>
