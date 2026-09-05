export type PrivacySection = {
  id: string
  heading: string
  paragraphs: string[]
}

export const PRIVACY_TITLE = "Privacy Policy"
export const PRIVACY_SUBTITLE =
  "How ONE Airport Taxi collects, uses, protects, and shares personal information."

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "information-we-collect",
    heading: "Information We May Collect",
    paragraphs: [
      "When you book a ride with ONE Airport Taxi, we may ask for information to help us organise your trip. This can include your name, phone number, email, pickup and drop-off locations, flight details, travel date and time, any passenger needs, and your booking details.",
      "If you pay through a third-party provider, they will handle your payment details in accordance with their own privacy and security policies.",
      "We also collect some technical details when you visit our website, such as your IP address, browser type, device information, the pages you visit, and general website usage data.",
    ],
  },
  {
    id: "how-we-use-information",
    heading: "How We Use Your Information",
    paragraphs: [
      "We use your personal information only when necessary to run our business, deliver our services, stay in touch with you, or meet our legal obligations.",
      "We may use your information to arrange airport transfers, confirm or update bookings, share important travel details, answer your questions, process payments, maintain business records, improve our website and services, monitor website performance, prevent fraud or misuse, and comply with legal or regulatory requirements.",
    ],
  },
  {
    id: "booking-communications",
    heading: "Booking and Customer Communications",
    paragraphs: [
      "If you provide your contact details when you book or request information, we may use them to contact you about your trip.",
      "For example, we might send you booking confirmations, updates about your booking, pickup details, driver or trip updates, or other messages directly related to the service you asked for.",
    ],
  },
  {
    id: "protecting-information",
    heading: "Protecting Your Personal Information",
    paragraphs: [
      "At ONE Airport Taxi, we take steps to protect the personal information you share with us. We use a range of safeguards to help prevent unauthorised access, loss, misuse, changes, or disclosure of your data.",
      "We take security seriously, but no website or online service can be completely secure. Because of this, we cannot promise that your information will always be fully protected from every possible risk.",
    ],
  },
  {
    id: "sharing-information",
    heading: "When We May Share Information",
    paragraphs: [
      "Sometimes we share relevant information with trusted service providers or business partners when needed to deliver our services.",
      "These partners may include payment providers, technology and website companies, booking or communication platforms, professional service providers, and transportation partners or drivers who help with your journey.",
      "We only share the information needed for each specific purpose. When needed, we expect our service providers to keep your personal information safe and use it only for approved reasons.",
      "We never sell or rent your personal information to third parties for their marketing.",
      "We may also share information when required by law, such as in response to legal requests, court orders, regulatory rules, or requests from authorities.",
    ],
  },
  {
    id: "cookies",
    heading: "Cookies and Website Technologies",
    paragraphs: [
      "We use cookies and similar tools to keep our website running smoothly and to understand how people use our online services.",
      "Cookies help us remember your preferences, make the website work better, measure traffic, understand how visitors use the site, and support advertising or marketing when needed.",
      "You can control or turn off cookies in your browser or device settings. If you block certain cookies, some parts of our website might not work as expected or may be unavailable.",
    ],
  },
  {
    id: "other-websites",
    heading: "Links to Other Websites",
    paragraphs: [
      "Sometimes, our website includes links to other websites, platforms, or services run by different organisations.",
      "These third-party websites have their own privacy policies and terms. ONE Airport Taxi does not control how they collect or use your information. Before you share any personal details on another website, we suggest reading its privacy policy.",
    ],
  },
  {
    id: "children",
    heading: "Privacy of Children",
    paragraphs: [
      "Our services and website are intended for people aged 18 or older. We do not knowingly ask for or collect personal information from children.",
      "If you think a child has shared personal information with us without the right permission, please get in touch with us. We will look into it and remove the information if needed.",
    ],
  },
  {
    id: "data-protection-rights",
    heading: "Your Data Protection Rights",
    paragraphs: [
      "Your rights regarding the personal information we hold about you may vary depending on your situation and the applicable data protection laws.",
      "These rights can include asking to see your personal information, requesting corrections to any inaccurate or incomplete details, asking us to delete information when possible, limiting how we use your data, objecting to certain uses, or requesting a copy of your information in a suitable format.",
      "If you want to use any of these rights or have questions about how we handle your personal information, please get in touch with ONE Airport Taxi through the details on our website.",
    ],
  },
  {
    id: "retention",
    heading: "How Long We Keep Information",
    paragraphs: [
      "We keep personal information only as long as we need it for the purposes for which it was collected. Sometimes we may need to retain certain information longer if it is required for accounting, legal, regulatory, dispute resolution, fraud prevention, or other valid business purposes.",
      "When we no longer need information, we will take reasonable steps to delete or anonymise it securely.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to This Privacy Policy",
    paragraphs: [
      "ONE Airport Taxi may update this Privacy Policy as needed to reflect changes to our services, website, legal requirements, or our data handling practices.",
      "When we make important changes, we will post the updated policy on our website. Please check this page occasionally to stay up to date on how we use your personal information.",
    ],
  },
]
