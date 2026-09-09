import { z } from "zod"

export const destinationPageEditorSchema = z.object({
  officialName: z.string().trim().min(1, "Official airport name is required."),
  displayName: z.string().trim().min(1, "Display name is required."),
  iataCode: z.string().regex(/^[A-Z]{3}$/, "IATA code must be exactly three uppercase letters."),
  serviceArea: z.string().trim().min(1, "Service area is required."),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-airport-taxi$/, "Use lowercase words separated by hyphens and ending in -airport-taxi."),
  googlePlaceId: z.string().trim().min(1, "Select the airport from Google Places."),
  address: z.string().trim().min(1, "Select the airport address from Google Places."),
  latitude: z.number().finite().min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90."),
  longitude: z.number().finite().min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180."),
})

export type DestinationPageEditorValues = z.infer<typeof destinationPageEditorSchema>
