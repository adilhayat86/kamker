export type WorkerGuide = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  sections: { heading: string; paragraphs?: string[]; items?: string[] }[];
};

export const workerGuides: WorkerGuide[] = [
  {
    slug: "create-worker-profile",
    title: "How to register as a worker on Kamker",
    description: "A step-by-step guide to free worker registration in Pakistan: choose your profession and city, create an account and complete your Kamker profile.",
    intro: "A Kamker profile gives customers a place to learn about your services and find your contact details. Registration for individual workers is free, and Kamker does not take commission from workers. Creating a profile does not guarantee enquiries, work or earnings.",
    sections: [
      {
        heading: "1. Have your basic details ready",
        paragraphs: ["Use your own name and an active Pakistan mobile number. Choose a password you can remember and keep it private. You will use your account to update your profile later."],
        items: ["Choose the city where you actually offer your services.", "Choose the profession customers should search for first. Select the closest accurate category rather than an unrelated popular service.", "Decide your usual work time, work days and expected hourly rate."],
      },
      {
        heading: "2. Fill in the worker registration form",
        paragraphs: ["Open Free Worker Registration and enter your name, phone number, city, profession, gender and age. Then choose your work time and days, enter your hourly rate and set your password. The form explains the allowed age and rate ranges beside those fields.", "Select Register and Open Account. If a field needs attention, follow the message beside it and correct the information. If your number already has a Kamker account, use Log in instead of creating another profile."],
      },
      {
        heading: "3. Complete your profile after registration",
        paragraphs: ["Open your account and use Complete Profile to add your area, experience, photo and other available details. A photo and CNIC are not required to start registration. Share only accurate information, and use the account's verification fields if you choose to provide verification documents."],
        items: ["Describe the services you can actually provide in simple words.", "Check the public phone or WhatsApp details you choose to share.", "Review your profile and correct spelling, location and availability before sharing its link."],
      },
      {
        heading: "4. Keep your details current",
        paragraphs: ["Update your account when your area, rate or available hours change. Customers may compare several profiles, so clear and current details help them decide whether to contact you. You and the customer agree the work, timing and payment directly.", "If you cannot register or access your account, contact Kamker by email at adilhayatkamker@gmail.com. Never send your password in a support message."],
      },
    ],
  },
  {
    slug: "profile-details-checklist",
    title: "What to include in your worker profile",
    description: "Make your Kamker worker profile useful with an accurate profession, service area, availability, experience and rate. Use this practical profile checklist.",
    intro: "Customers need enough information to decide whether your service matches their need. A useful profile answers practical questions about what you do, where you work and when you are available. Accurate details matter more than long descriptions.",
    sections: [
      {
        heading: "Explain your service clearly",
        paragraphs: ["Start with your main profession. In your description, name the tasks you can do and any relevant limits. For example, a tutor can list subjects and class levels; a driver can describe the vehicles they can drive; a cleaner can describe the cleaning tasks they offer. Only include skills and qualifications you actually have."],
        items: ["Use your own words instead of copying another worker's profile.", "Describe relevant experience honestly, including if you are starting out.", "Do not call yourself verified or certified unless the claim is supported by the appropriate status or qualification."],
      },
      {
        heading: "Choose the right city and area",
        paragraphs: ["Choose the city where customers should find you. Add the neighbourhood or service area in your profile so people can judge travel distance. If you can travel to nearby areas, explain that in your description without listing places you cannot reliably serve.", "A city and service area are usually more useful publicly than your full home address. Keep identity documents and other private information out of your public description."],
      },
      {
        heading: "Make availability and pricing understandable",
        paragraphs: ["Keep your work days and work time up to date. Your registration rate is an expected hourly rate; check that the amount you enter uses that unit. Explain any relevant limits in your description, and agree the final scope and payment with the customer before starting."],
        items: ["Avoid marking yourself available at times you cannot accept work.", "Discuss travel, materials or additional tasks with the customer before agreeing a price.", "Update your profile when your usual rate or schedule changes."],
      },
      {
        heading: "Check your photo and contact details",
        paragraphs: ["If you add a photo, use a clear image you have permission to use. Do not upload someone else's face, certificate or identity document as your public profile photo. Check that the contact number you share belongs to you and can receive enquiries."],
      },
      {
        heading: "Review your public profile",
        items: ["Does your name, profession and city look correct?", "Can a customer understand your main service without guessing?", "Are your area, hours, experience and hourly rate accurate?", "Have you kept passwords, CNIC numbers and private documents out of the public text?", "Does the profile link open the profile you intended to share?"],
        paragraphs: ["You can improve your profile over time through your account. Completing more fields can help customers understand your services, but it does not promise a particular Google position or a certain number of enquiries."],
      },
    ],
  },
  {
    slug: "customer-contact-and-work-arrangements",
    title: "How customers contact workers on Kamker",
    description: "Understand how customers find Kamker profiles, use the worker contact details provided and agree services, timing and payment directly with workers.",
    intro: "Kamker is a worker directory and requirement marketplace. Customers browse by profession and city, review profiles and use the contact options a worker provides. It is not a job board, and a profile does not mean Kamker has employed you or promised you work.",
    sections: [
      {
        heading: "How a customer can find your profile",
        paragraphs: ["A customer may browse a category, filter workers by city or open a direct profile link. Your profession, city, area and service description help them decide whether you match their need. A public profile may also appear in search engines, but search engines decide which pages to show and when."],
      },
      {
        heading: "Which contact details are shown",
        paragraphs: ["Profiles offer call or WhatsApp actions where those details are available. These are the worker's shared contact details. They are different from Kamker support, which uses email at adilhayatkamker@gmail.com.", "Check the public details on your own profile and update them through your account when they change. Do not put a password, identity document or private customer information in your profile description."],
      },
      {
        heading: "What to clarify before accepting work",
        paragraphs: ["Ask enough questions to understand the request before agreeing to it. A profile's displayed rate does not describe every possible task, journey or material cost. Confirm the arrangement directly with the customer."],
        items: ["The exact service and tasks required, including anything outside your skills.", "The work location, date, start time and expected duration.", "The agreed rate or total price, who supplies materials and any travel costs.", "When and how payment will be made, and how either person can report a change in plans."],
      },
      {
        heading: "What Send Requirement means",
        paragraphs: ["Customers can also submit a requirement to Kamker for review. This is a separate customer outreach process, and paid broadcast options may apply. It is not a promise that every worker will receive the request or be selected. Individual worker registration remains free, with no commission from workers."],
      },
      {
        heading: "Protect your account and ask for help",
        paragraphs: ["Keep your password and login codes private. Be careful with anyone who asks you to reveal account details or pay for guaranteed work. Kamker does not guarantee work or earnings from registration.", "For an account or website problem, email adilhayatkamker@gmail.com with a short description and the page link. Leave passwords and identity documents out of the message unless a specific secure process is provided."],
      },
    ],
  },
];
