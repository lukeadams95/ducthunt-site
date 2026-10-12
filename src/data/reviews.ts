import all from './reviews.json';

export interface Review {
  name: string;
  text: string;
}

/** All Google reviews, most recent first. */
export const allReviews: Review[] = all;

export const initials = (name: string) => name.replace(/[^A-Z]/g, '').slice(0, 2);

const r = (name: string, text: string): Review => ({ name, text });

export const servicesReviews = [
  r('John S.', 'The price he quoted me was the price I paid. No hidden fees like the big name companies. He showed me the before, during process and after photos.'),
  r('Brock B.', 'Next day service! It was very quick, very professional. Dryer works like a champ now.'),
  r('Romond H.', 'He noticed I was still installing some drywall and needed to sand the floors. He turned my money down and recommended that I finish first, then get my duct work cleaned. I appreciate the up front honesty.'),
];

export const ductReviews = [
  r('Angela T.', 'I could instantly tell a difference while he was cleaning out vents because the air smelled so clean. Duct Hunt is a fair and honest priced company. He does not push or pressure you to buy any additional products.'),
  r('Kyle L.', 'There were no surprise fees involved, the previously agreed upon price was what I paid! He was able to get all the air ducts/returns in our 3,000 sq ft home cleaned in under 2 hours!'),
  r('Ron S.', 'We can already tell a difference with our dust factor and furnace does not seem to be working as hard. I was given some good advice about filters. He cleaned up thoroughly.'),
];

export const dryerReviews = [
  r('Brock B.', 'Next day service! It was very quick, very professional. Seeing how much nasty stuff was in the vent was very surprising. Dryer works like a champ now.'),
  r('Molly B.', 'Derek was super helpful in helping us understand our system and came by the very next day and took care of cleaning our dryer vent and dryer duct all together for a flat fee. He was very professional and kind!'),
  r('Cathy J.', 'His price was very reasonable and he did a fantastic job cleaning all of the ducts and the dryer vent. I would definitely recommend him and will call him again when needed.'),
];

export const repairReviews = [
  r('Romond H.', "You're talking about a person with integrity... He turned my money down and recommended that I finish first, then get my duct work cleaned. I appreciate the up front honesty."),
  r('Noah U.', "Phenomenal work. Professional, considerate, efficient, timely, and honest. Not to mention beating all local competitors and larger HVAC/specialty companies' price by hundreds of dollars."),
  r('John S.', 'We spoke often during his work and he answered my questions without hesitation and was very knowledgeable.'),
];

export const whyWall = [
  r('Noah U.', 'Phenomenal work. Professional, considerate, efficient, timely, and honest.'),
  r('Rachel B.', 'Derek is great! Communicates well and prompt. I recommend him to my real estate clients, friends, and family!'),
  r('Sharon A.', 'We have used them exclusively for the last 4 years... Derek is honest, thorough, knowledgeable and has an excellent work ethic.'),
  r('Kristina J.', 'I would 100% recommend Duct Hunt to anyone! Derek was professional, kind, respectful, clean, and awesome!'),
  r('Wes S.', "It was great to find this is a small local business and not have to use the big 'brand names.'"),
  r('Joanna L.', 'He sent me a reminder the day before our appointment. He was on time, knowledgeable, and kind.'),
];

export const areaReviews = [
  r('Elena G.', 'Highly recommend this local small business owner! Returned my call within 15 min & scheduled at my convenience.'),
  r('Wes S.', "It was great to find this is a small local business and not have to use the big 'brand names.'"),
  r('Rachel B.', 'Derek is great! Communicates well and prompt. I recommend him to my real estate clients, friends, and family!'),
];

export const faqReviews = [
  r('Angela T.', 'He was able to tell me how the process works and the pricing. Other companies I called said they would have to come out and estimate the home.'),
  r('John S.', 'He answered my questions without hesitation and was very knowledgeable.'),
];
