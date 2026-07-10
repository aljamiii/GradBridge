// RAG knowledge base: curated destination guides for Bangladeshi students.
// Each entry becomes ONE chunk (embedded + stored by scripts/seedKnowledge.js).
// Keep chunks focused on a single topic — retrieval works best that way.
// To expand coverage: add entries here and re-run the seed script.

const knowledgeBase = [
  // ---------------- Toronto, Canada ----------------
  {
    city: "Toronto", country: "Canada", topic: "safety",
    text: `Toronto is generally very safe for international students, consistently ranking among the safest large cities in North America. Violent crime affecting students is rare; the main practical concerns are phone snatching on transit and petty theft in crowded areas like Yonge-Dundas Square. Most student neighbourhoods (North York, Scarborough, Mississauga) are safe to walk in the evening, though standard city awareness applies after midnight downtown. Emergency number is 911. Campus security at UofT, TMU and York offer free walk-safe escort programs at night. Racism against South Asians is uncommon in daily life; Toronto is one of the most diverse cities in the world with over half its residents born outside Canada.`,
  },
  {
    city: "Toronto", country: "Canada", topic: "climate",
    text: `Toronto winters are a real adjustment for Bangladeshi students: December to March typically ranges from -10°C to 0°C with occasional -20°C cold snaps and significant snow. Buildings, buses and the subway are all well heated, so the cold is mainly felt outdoors. Budget around CAD 200-350 for a proper winter jacket, boots, and layers — buy during November sales rather than at premium stores. Summers (June-August) are warm and humid, 22-30°C, similar to a mild Dhaka. Spring and fall are short and pleasant. Seasonal depression from short winter days affects some students; vitamin D supplements and staying socially active help.`,
  },
  {
    city: "Toronto", country: "Canada", topic: "halal-community",
    text: `Toronto has one of North America's largest Bangladeshi communities, centred on Danforth Avenue (known as "Bangla Town" around Victoria Park), with Bangladeshi groceries, restaurants serving bhuna khichuri and kacchi, and Eid events. Halal food is everywhere: hundreds of halal restaurants, halal sections in major supermarkets like FreshCo and Walmart, and halal butchers in most neighbourhoods. There are over 100 mosques in the Greater Toronto Area including the Islamic Foundation of Toronto in Scarborough and Jame Masjid. Most universities have Muslim Students' Associations with Friday jummah on campus and iftar programs during Ramadan. Finding a Bangladeshi community group for festivals like Pohela Boishakh is easy through Facebook groups like "Bangladeshis in Toronto".`,
  },
  {
    city: "Toronto", country: "Canada", topic: "living-work",
    text: `Toronto rent is the biggest budget item: a shared room in a student house costs CAD 700-1000/month, a basement studio 1200-1600, downtown condos 2200+. Many Bangladeshi students start in Scarborough or North York for lower rent and take the TTC subway (student monthly pass around CAD 128). International students in Canada can work up to 24 hours/week off-campus during semesters and full-time during breaks; typical student jobs (retail, food service, campus roles) pay the Ontario minimum wage of about CAD 17/hour. A realistic part-time income of CAD 1200-1500/month covers food and transport but NOT full rent and tuition — do not plan to fund your degree from part-time work. Open a no-fee student bank account (RBC, TD and Scotiabank all have newcomer offers) and get a SIN number in your first week to be able to work.`,
  },

  // ---------------- London, United Kingdom ----------------
  {
    city: "London", country: "United Kingdom", topic: "safety",
    text: `London is broadly safe for students but requires more street awareness than most Canadian or Nordic cities. The main risk is phone theft — thieves on e-bikes snatch phones from pedestrians' hands, especially in central boroughs; keep your phone away near roads. Violent crime rarely affects students. Areas popular with Bangladeshi students like Whitechapel, Mile End and Ilford are lively and generally safe, though like anywhere in London, stay aware late at night. Emergency number is 999. Universities run late-night safety buses and campus security escorts. London's East End has one of the largest Bangladeshi populations outside Bangladesh, so cultural familiarity and community support are exceptional.`,
  },
  {
    city: "London", country: "United Kingdom", topic: "climate",
    text: `London's climate is milder than most Bangladeshi students expect: winters hover between 2-8°C with rain and grey skies but very little snow — a good coat and waterproof shoes matter more than extreme-cold gear. The real adjustment is the darkness: in December the sun sets around 3:50pm, which combined with frequent drizzle affects mood; students combat this with vitamin D and indoor social activities. Summers are pleasant, 18-25°C, with occasional heatwaves above 30°C (note: most housing has no air conditioning). It rains lightly year-round, so a compact umbrella lives in every Londoner's bag.`,
  },
  {
    city: "London", country: "United Kingdom", topic: "halal-community",
    text: `For Bangladeshi students, London — especially East London — feels like a second home. Whitechapel Road and Brick Lane are historic centres of the British-Bangladeshi community: Bengali is visible on street signs, and you'll find kacchi, fuchka, and Bangladeshi sweets shops. The East London Mosque on Whitechapel Road is one of Europe's largest, and halal food is standard across the city — most fried chicken shops, many chain restaurants, and all major supermarkets stock halal meat. Every London university has an active Islamic Society (ISoc) running jummah, iftars, and charity weeks, plus Bangladeshi societies celebrating Pohela Boishakh and Victory Day. Community groups in Tower Hamlets offer everything from Bangla classes to career networking.`,
  },
  {
    city: "London", country: "United Kingdom", topic: "living-work",
    text: `London is expensive: a room in a shared flat costs £700-950/month in Zone 2-3 (Whitechapel, Stratford, Ilford), student halls £800-1400. Most students live with flatmates found via SpareRoom or university groups. Transport with the 18+ Student Oyster discount costs roughly £90-120/month depending on zones; cycling is increasingly popular. UK student visas allow 20 hours/week of work during term time and full-time in vacations; typical student jobs pay the national living wage around £11.50-12.50/hour. That yields roughly £900-1000/month part-time — helpful for living costs, but plan your funding so rent and tuition never depend on it. The NHS covers healthcare after you pay the immigration health surcharge with your visa, so doctor visits are free once registered with a local GP.`,
  },

  // ---------------- Berlin, Germany ----------------
  {
    city: "Berlin", country: "Germany", topic: "safety",
    text: `Berlin is a safe capital by global standards; students mainly encounter pickpocketing on the U-Bahn and around tourist spots like Alexanderplatz, plus occasional bike theft (always use two locks). Violent crime affecting students is rare. Some outer eastern districts feel less welcoming late at night, but central student areas — Wedding, Neukölln, Kreuzberg, Friedrichshain — are lively into the early hours. Emergency number is 112. Germany is generally respectful toward international students; overt racism is uncommon in Berlin though occasional incidents are reported more in small towns than in the capital. Register with the police (Anmeldung) is not about safety — it's the mandatory address registration everyone must do within two weeks of moving.`,
  },
  {
    city: "Berlin", country: "Germany", topic: "climate",
    text: `Berlin winters are cold and grey rather than extreme: December-February averages -2 to 4°C with occasional snow and long stretches of overcast skies. The darkness (sunset before 4pm in December) bothers students more than the temperature. A warm jacket, gloves and waterproof shoes from stores like Decathlon (budget €150-250 total) are enough. Summers are lovely: 20-27°C, long evenings with sunset after 9pm, and the whole city lives outdoors in parks like Tempelhofer Feld. Homes have excellent heating but almost never air conditioning; brief summer heatwaves above 32°C can make top-floor flats uncomfortable for a week or two.`,
  },
  {
    city: "Berlin", country: "Germany", topic: "halal-community",
    text: `Berlin's Muslim community is large (over 300,000, historically Turkish and Arab), so halal infrastructure is excellent: halal butchers and döner shops in every district, halal sections in many supermarkets, and mosques across the city including the Şehitlik Mosque near Tempelhof. The Bangladeshi community is smaller than in London or Toronto but growing and well organised — groups like "Bangladeshis in Berlin" on Facebook organise Eid gatherings, Pohela Boishakh, and newcomer help. Universities have Muslim student groups, and several campuses provide prayer rooms. South Asian groceries around Neukölln and Wedding stock Bangladeshi essentials like puffed rice, mustard oil, and frozen fish including hilsa (imported, so pricier than home).`,
  },
  {
    city: "Berlin", country: "Germany", topic: "living-work",
    text: `Berlin's killer advantage is cost: public universities charge no tuition (only a ~€300/semester fee that includes a transit pass), and rent, while rising, is below London/Toronto — a room in a shared flat (WG) costs €450-700/month. The catch: finding a WG room is competitive; start searching on wg-gesucht.de months early and be wary of deposit scams. Students from Bangladesh need a blocked account (Sperrkonto) of about €11,900 to get the visa, releasing ~€990/month to you. Student jobs are regulated at 140 full days per year; typical pay is €13-15/hour for working-student (Werkstudent) roles in tech, which CSE students should target — they pay better than café work and build a German CV. Many Master's programs are in English, but everyday life (Anmeldung, contracts, doctors) goes far smoother with basic German — start Duolingo before you fly.`,
  },

  // ---------------- Melbourne, Australia ----------------
  {
    city: "Melbourne", country: "Australia", topic: "safety",
    text: `Melbourne is very safe for international students and regularly tops liveability rankings. Late-night safety in the CBD on weekends requires standard awareness (alcohol-related rowdiness), and there have been isolated incidents around some suburban train stations at night — students living in Clayton (near Monash) or Footscray generally report feeling safe. Emergency number is 000. Australia has strict laws and visible policing; scams targeting international students (fake visa calls demanding payment) are actually a bigger financial risk than street crime — no real authority will ever demand payment by phone or gift card. Universities run free after-dark security shuttles and the free Night Network transport runs all night on weekends.`,
  },
  {
    city: "Melbourne", country: "Australia", topic: "climate",
    text: `Melbourne's weather is famously changeable — locals joke about "four seasons in one day." Winters (June-August, remember seasons are flipped) are mild by Canadian standards: 6-14°C, rainy and windy but no snow; a warm jacket and layers suffice. Summers (December-February) are warm, 25-35°C, with occasional extreme heat days above 40°C. The UV index is severe — sunscreen is a health necessity, not a cosmetic choice, as Australia has the world's highest skin cancer rates. For Bangladeshi students the climate adjustment is mostly the flipped calendar: Christmas is mid-summer, and the academic year starts in February-March.`,
  },
  {
    city: "Melbourne", country: "Australia", topic: "halal-community",
    text: `Melbourne has a well-established Bangladeshi community, concentrated in suburbs like Dandenong, Clayton, and Footscray, with Bangladeshi restaurants and groceries stocking deshi fish, spices, and sweets. Halal food is easy: hundreds of halal-certified restaurants, halal butchers in most suburbs, and halal options in major supermarket chains. Mosques serve every region — including the Islamic Council of Victoria network — and universities like Melbourne, Monash and RMIT have active Islamic societies with campus prayer rooms and jummah. The Bangladesh Students' Association chapters organise Pohela Boishakh in Federation Square, Eid reunions, and airport pickup + first-week hosting for newcomers — join their Facebook groups before you fly.`,
  },
  {
    city: "Melbourne", country: "Australia", topic: "living-work",
    text: `Melbourne rent: a room in a shared house costs AUD 800-1200/month (often quoted weekly: 185-280/week); Clayton, Brunswick and Footscray are student-budget suburbs. Transport with a concession myki costs about AUD 100/month. Student visas allow 48 hours of work per fortnight during study periods and unlimited hours during breaks; the national minimum wage is around AUD 24/hour — the highest of the major destinations — and casual roles often pay 25-30/hour with weekend loading. This makes part-time work genuinely helpful in Melbourne: 20 hours/week can realistically bring in AUD 1900-2300/month. Still, visa rules require you to show funds upfront (roughly AUD 29,700/year living costs) and tuition must not depend on casual income. Overseas Student Health Cover (OSHC) is mandatory and arranged with your visa.`,
  },

  // ---------------- Kuala Lumpur, Malaysia ----------------
  {
    city: "Kuala Lumpur", country: "Malaysia", topic: "safety",
    text: `Kuala Lumpur is generally safe for students, with the main risks being snatch theft (bags grabbed by motorbike riders — carry bags on the side away from the road) and taxi overcharging (always use Grab instead of street taxis). Violent crime against students is rare. Areas around major universities and student hubs like Bukit Jalil, Cyberjaya, and Subang Jaya are safe and full of international students. Emergency number is 999. As a Muslim-majority country, Malaysia feels culturally comfortable and welcoming for Bangladeshi students; the shared food culture, prayer infrastructure and festive calendar remove much of the culture shock experienced in Western destinations.`,
  },
  {
    city: "Kuala Lumpur", country: "Malaysia", topic: "climate",
    text: `Kuala Lumpur's climate is the easiest adjustment possible for Bangladeshi students — it's essentially Dhaka's weather: hot and humid year-round at 24-34°C with afternoon thunderstorms, heavier during the monsoon months (April-May and October-December). There is no winter and no need for any cold-weather shopping. Air conditioning is universal in malls, campuses and most student housing. The haze season (usually August-October, from regional forest fires) occasionally pushes air quality to unhealthy levels for a few weeks — an N95 mask and indoor days handle it, familiar practice for anyone from Dhaka.`,
  },
  {
    city: "Kuala Lumpur", country: "Malaysia", topic: "halal-community",
    text: `Malaysia is a Muslim-majority country, so halal is the default: virtually all local restaurants, food courts and supermarket meat are halal-certified by JAKIM, and every mall, campus and petrol station has a surau (prayer room). Mosques are everywhere, including the National Mosque and thousands of neighbourhood masjids with Bangla-speaking congregants in areas with Bangladeshi workers. The Bangladeshi community in KL is one of the largest abroad — Bangladeshi restaurants around Kotaraya serve authentic deshi food, and groceries stock everything from hilsa to panta rice ingredients. Universities have Bangladeshi student associations, and Ramadan in Malaysia — with its bazaars and community iftars — is an experience students consistently rate as a highlight.`,
  },
  {
    city: "Kuala Lumpur", country: "Malaysia", topic: "living-work",
    text: `Kuala Lumpur is the budget-friendly option: total first-year costs often run 60-70% below Australia/Canada/UK. A room in a shared condo (often with pool and gym) costs RM 600-1200/month (about USD 130-260); tuition at private universities like Taylor's, Sunway or APU runs USD 4,000-8,000/year, and public universities like UM even less. Food is cheap — a full meal at a mamak costs RM 8-15. The major constraint: international students in Malaysia may only work 20 hours/week during semester breaks and holidays (not during term), and enforcement is strict, so budget as if you will earn nothing. Grab rides are affordable, and the LRT/MRT network covers the main student corridors. Many students use KL as a high-quality, low-cost stepping stone: strong grades there open PhD funding doors in Australia, Japan and Europe.`,
  },

  // ---------------- Stockholm, Sweden ----------------
  {
    city: "Stockholm", country: "Sweden", topic: "safety",
    text: `Stockholm is one of Europe's safest capitals for students; walking alone at night in central areas and university districts like Frescati or Kista feels normal, including for women. Petty theft exists in tourist spots (Gamla Stan, central station) but is low by European standards. Emergency number is 112. Media reports about gang violence in Sweden concern specific suburbs and criminal networks — they essentially never touch student life, though it's fair to research neighbourhoods before renting far from the centre. Swedes are reserved but respectful; discrimination against students is rare, and English is spoken almost universally, which makes handling any incident straightforward.`,
  },
  {
    city: "Stockholm", country: "Sweden", topic: "climate",
    text: `Stockholm's challenge is darkness more than cold: in December the sun rises at 8:45am and sets at 2:45pm, and weeks of grey skies affect mood — students swear by vitamin D supplements, bright "daylight" lamps, and keeping a routine. Winters average -5 to 2°C with snow that usually stays manageable; proper boots, thermal layers and a real winter coat (budget SEK 2000-3500) are essential. The flip side is magical: June brings near-endless daylight with sunsets after 10pm, and summer at 18-25°C is spectacular. Buildings are superbly insulated and heated — Swedes joke that you're never cold indoors in Sweden, only outdoors.`,
  },
  {
    city: "Stockholm", country: "Sweden", topic: "halal-community",
    text: `Stockholm's Muslim community (roughly 150,000) supports solid halal infrastructure: halal butchers and restaurants concentrate in areas like Rinkeby, Tensta and Södermalm, and mainstream supermarkets increasingly stock halal-labelled meat. The Stockholm Mosque (Zayed's Mosque) on Södermalm anchors the community, with several other mosques and prayer spaces including rooms at KTH and Stockholm University via Muslim student associations. The Bangladeshi community is small but tight-knit — a few hundred families plus students — organised through the Bangladesh Association in Sweden, which runs Eid gatherings, Pohela Boishakh, and an informal newcomer-help network. Bangladeshi groceries are limited; students stock up at pan-Asian stores in Rinkeby or during trips to bigger diaspora hubs.`,
  },
  {
    city: "Stockholm", country: "Sweden", topic: "living-work",
    text: `Stockholm has a housing shortage that hits students hard: start applying for student housing (SSSB queue) the moment you're admitted, because queue days determine everything. A student corridor room costs SEK 4500-7000/month; private sublets run 7000-12,000 and scams target desperate searchers — never pay before a video tour and contract. There is no legal limit on work hours for international students in Sweden, but coursework pace and the Swedish-language job market mean most students realistically manage 10-15 hours/week; English-speaking roles exist in tech, delivery and hospitality at roughly SEK 130-160/hour. EU-standard perks help: student unions (join one) unlock discounts on transport (SL card ~SEK 690/month at student rate), and healthcare for students on residence permits is subsidised. Non-EU Master's tuition runs SEK 130,000-190,000/year, though generous scholarships (SI Scholarship, university waivers) specifically target Bangladeshi applicants.`,
  },
];

export default knowledgeBase;
