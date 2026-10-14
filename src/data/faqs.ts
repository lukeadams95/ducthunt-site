export interface Faq {
  q: string;
  a: string;
  /** Optional follow-up link shown under the answer */
  link?: { href: string; label: string };
}

export const homeFaqs: Faq[] = [
  { q: 'How do I know if my ducts need cleaning?', a: 'Common signs are visible dust around vents, musty smells, more allergy symptoms at home, and dryers that take too long. Call us and we can talk through what you are seeing.' },
  { q: 'What does NADCA standards mean?', a: 'NADCA is the National Air Duct Cleaners Association. Our air duct cleaning is performed to its standards.' },
  { q: 'How much does it cost?', a: 'It depends on your home and system. Call (816) 655-8105 or use the form for a free quote.' },
  { q: 'Do you work with builders, remodelers and flippers?', a: 'Yes. We handle pre-sale and post-construction duct cleaning with fast turnaround. Call to schedule.' },
  { q: 'Is the work guaranteed?', a: 'Yes. All of our work is guaranteed.' },
  { q: 'What areas do you serve?', a: 'The Kansas City metro. If you are unsure whether we cover your address, give us a call.' },
];

export const servicesFaqs: Faq[] = [
  { q: 'How much does air duct cleaning cost?', a: 'Pricing is based on the number of vents and the size of your home. Call (816) 655-8105 for an upfront quote, often without an in-home estimate.' },
  { q: 'How long does it take?', a: 'Most homes take about 2 hours.' },
  { q: 'How often should ducts be cleaned?', a: 'Generally every 3–5 years, and sooner after a remodel or if you have pets or allergies.' },
  { q: 'Do you clean dryer vents and air ducts in the same visit?', a: 'Yes. We can do both in one visit.' },
  { q: 'Should I clean my ducts before or after a remodel?', a: 'After the dusty work is finished, so the dust does not just come back.' },
  { q: 'What areas do you serve?', a: "The Kansas City metro, including Kansas City, North Kansas City, Overland Park, Olathe, Lee's Summit, Independence, Shawnee, Lenexa, Blue Springs, Liberty, Raytown and Gladstone. Not sure about your address? Give us a call." },
];

export const ductFaqs: Faq[] = [
  { q: 'How much does air duct cleaning cost?', a: 'Pricing is based on the number of vents and the size of your home. Call (816) 655-8105 for an upfront quote.' },
  { q: 'How long does it take?', a: 'Most homes take about 2 hours.' },
  { q: 'How often should I have my ducts cleaned?', a: 'Generally every 3–5 years, sooner after a remodel or with pets or allergies.' },
  { q: 'Do I need to be home?', a: 'Yes, for access and the walkthrough.' },
  { q: 'Will it be messy?', a: 'No. The work area is cleaned up when the job is done.' },
  { q: 'Can you clean my dryer vent at the same time?', a: 'Yes.', link: { href: '/services/dryer-vent-cleaning/', label: 'See Dryer Vent Cleaning' } },
  { q: 'Should I clean ducts before or after a remodel?', a: 'After the dusty work is finished.' },
];

export const dryerFaqs: Faq[] = [
  { q: 'How much does dryer vent cleaning cost?', a: 'Dryer vent cleaning is flat-fee. Call (816) 655-8105 for a quote.' },
  { q: 'How often should I clean my dryer vent?', a: 'Generally once a year, more often for large families or long vent runs.' },
  { q: 'How long does it take?', a: 'Most dryer vent cleanings are quick, usually under an hour.' },
  { q: 'Can you clean my air ducts at the same time?', a: 'Yes.', link: { href: '/services/air-duct-cleaning/', label: 'See Air Duct Cleaning' } },
  { q: 'Do you clean roof-exit dryer vents?', a: 'Call (816) 655-8105 and tell us where your vent exits. We will confirm with you.' },
  { q: 'Why is my dryer taking so long to dry clothes?', a: 'A clogged vent is one of the most common causes.' },
];

export const areaFaqs: Faq[] = [
  { q: 'What areas do you serve?', a: 'The Kansas City metro on both the Missouri and Kansas sides. See the city list above, and call if yours is not listed.' },
  { q: 'Do you charge a trip fee?', a: 'Call (816) 655-8105 and we will confirm for your address.' },
  { q: 'How fast can you get to me?', a: 'Often next day, depending on the schedule.' },
  { q: 'Do you work with builders and remodelers across the metro?', a: 'Yes.' },
];

export interface FaqCategory {
  id: string;
  title: string;
  items: Faq[];
}

/** Full FAQ page. Every answer here is rendered verbatim and mirrored in FAQPage schema, so never publish placeholder text. */
export const faqCategories: FaqCategory[] = [
  {
    id: 'faq-pricing',
    title: 'Pricing',
    items: [
      { q: 'How much does air duct cleaning cost?', a: 'Pricing is based on the number of vents and the size of your home. Call (816) 655-8105 and Derek can usually give you an upfront price over the phone, with no in-home estimate needed.' },
      { q: 'How much does dryer vent cleaning cost?', a: 'Dryer vent cleaning is a flat fee. Call for a quote.' },
      { q: 'Are there any hidden fees?', a: "No. The price you're quoted is the price you pay." },
      { q: 'Will you try to upsell me?', a: "No. If there are optional add-ons that might help your home, Derek will explain them and let you decide. There's never any pressure." },
      { q: 'Is your work guaranteed?', a: "Yes, all work is guaranteed. If something isn't right, Derek will make it right." },
    ],
  },
  {
    id: 'faq-air-duct',
    title: 'Air Duct Cleaning',
    items: [
      { q: 'How often should I have my air ducts cleaned?', a: "Generally every 3–5 years. Sooner if you've remodeled, have pets, or have allergy sufferers in the home." },
      { q: 'How long does air duct cleaning take?', a: 'Most homes take about 2 hours, depending on size and number of vents.' },
      { q: "What's included in an air duct cleaning?", a: 'Supply and return vents, main trunk lines, and the blower area, plus before & after photos and cleanup of the work area.' },
      { q: 'Do you follow industry standards?', a: 'Yes. Air duct cleaning is performed to NADCA standards.' },
      { q: 'How do I know if my ducts need cleaning?', a: 'Common signs: dust building up quickly, musty smells when the system runs, weak airflow, a recent remodel, or not knowing when they were last cleaned.' },
      { q: 'Will I see a difference?', a: "Many customers notice less dust and fresher-smelling air. You'll also get before & after photos so you can see exactly what was removed." },
    ],
  },
  {
    id: 'faq-dryer-vent',
    title: 'Dryer Vent Cleaning',
    items: [
      { q: 'How often should I clean my dryer vent?', a: 'Generally once a year. More often for large households or long vent runs.' },
      { q: 'Why is my dryer taking so long to dry clothes?', a: 'A clogged dryer vent is one of the most common causes. Lint buildup restricts airflow, so the dryer runs longer and hotter.' },
      { q: 'Is a clogged dryer vent dangerous?', a: 'Yes. Lint is highly flammable, and a clogged vent traps heat. Regular cleaning is one of the simplest ways to reduce fire risk.' },
      { q: 'Do you clean roof-exit dryer vents?', a: 'Call (816) 655-8105 and tell us where your vent exits. We will confirm with you.' },
      { q: 'Can you clean my dryer vent and air ducts in the same visit?', a: 'Yes, and many customers do both at once.' },
    ],
  },
  {
    id: 'faq-duct-repair',
    title: 'Duct Repair',
    items: [
      { q: 'How do I know if my ducts are leaking or damaged?', a: 'Uneven temperatures between rooms, weak airflow from certain vents, higher energy bills, or visible gaps and loose sections in exposed ductwork.' },
      { q: 'How much does duct repair cost?', a: "It depends on the damage. You'll get an upfront quote before any work begins." },
      { q: 'Can you fix problems found during a cleaning?', a: "Often, yes. If Derek spots damage, he'll show you photos, explain the issue, and give you a price." },
    ],
  },
  {
    id: 'faq-scheduling',
    title: 'Scheduling & Your Visit',
    items: [
      { q: 'How soon can you come out?', a: 'Often the next day, depending on the schedule. Call to check availability.' },
      { q: 'Do I need to be home?', a: 'Yes, for access to the home and a quick walkthrough when the job is done.' },
      { q: 'Who will be doing the work?', a: 'Derek Craig, the owner. No subcontractors or rotating crews.' },
      { q: 'Will you remind me before the appointment?', a: "Yes. You'll get a reminder before your appointment with an arrival time." },
      { q: 'Will it be messy?', a: 'No. The work area is cleaned up before Derek leaves.' },
      { q: 'How do I prepare for my appointment?', a: 'Clear a path to your vents, furnace, and dryer, and secure pets if possible.' },
    ],
  },
  {
    id: 'faq-service-area',
    title: 'Service Area',
    items: [
      { q: 'What areas do you serve?', a: 'The Kansas City metro on both the Missouri and Kansas sides. See the Service Area page for the full list.', link: { href: '/service-area/', label: 'See the Service Area page' } },
      { q: 'Do you charge a trip fee?', a: 'Call (816) 655-8105 and we will confirm for your address.' },
    ],
  },
  {
    id: 'faq-builders',
    title: 'Builders, Remodelers & Real Estate',
    items: [
      { q: 'Do you work with builders, remodelers, and house flippers?', a: 'Yes. Duct Hunt handles post-construction, post-remodel, and pre-sale duct cleaning with fast turnaround for project timelines.' },
      { q: 'Should I clean ducts before or after a remodel?', a: 'After the dusty work, such as drywall and floor sanding, is finished. Cleaning before that means the dust will just end up back in the ducts.' },
      { q: 'Do you work with real estate agents?', a: 'Yes. Many local agents refer Duct Hunt to their buyers and sellers.' },
    ],
  },
];

export const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
