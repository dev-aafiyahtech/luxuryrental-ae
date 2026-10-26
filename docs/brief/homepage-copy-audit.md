# Homepage copy audit and rewrite

**26 Oct 2026.** Scope: every string in `src/messages/en/home.json` (95 keys), which feeds the four chapters, the sections after them and the page title and description. The car taglines in chapter 3 were reviewed but not changed. The facts were checked against `rules.ts`, `zones.ts`, `cars.ts`, `site.ts`, `lib/pricing.ts` and `content/pages/*.ts`.

**Result:** 38 of 95 values changed. Every key and `{placeholder}` is kept, `node qa/scripts/i18n-keys.mjs` passes against the Arabic file, and `npx tsc --noEmit` passes. At 390 px and 1440 px there is no horizontal overflow and no headline ends on a single word.

## 1. Diagnosis

The existing copy had a real voice: calm, factual and specific in most places ("Three steps to the keys", "Ready when you land", "Room for four or five"). So this rewrite restores rather than replaces. Lines that already worked are kept. The changes fix the problems below.

## 2. Findings

### Clarity

- **The chapter eyebrows showed internal concept names.** "Burj by Night", "Velocity Tunnel" and "Kinetic Sculpture" are the design team's scene names. They tell a visitor nothing about the section, and the side rail ("Fleet", "Sculpture") repeated them. The eyebrows and rail now say what each chapter holds: *Luxury car rental in Dubai*, *Three ways to rent*, *Featured cars*, *Send a request*. The scroll story keeps its four chapters, their order and their content, and the code still uses the concept names.
- **The first screen never said what the business does.** "Burj by Night" and "Dubai after dark" are both mood lines, and both are about night. A cold visitor had to reach the lede to learn that this is car rental. The eyebrow now names the category and place, and the H1 names the product: *Supercars, after dark*. It keeps the night scene and the original two-line shape.
- "The kinetic view is a schematic" used internal jargon. It now reads *The 3D view is a schematic.*
- "Keep scrolling to take the car apart, part by part" repeats the sound "apart, part by part". It now ends on the two kinds of part the scene shows (engine to wheels).

### Value proposition

The facts that set the business apart are already in the data: a person confirms every request on WhatsApp, nothing is charged before that, every price includes VAT, the deposit is shown before you ask, and the car comes to you, with collection wherever you finish. The old hero spent its lede on "Comprehensive insurance included", which every rental company says and which needs an excess to be accurate (see Accuracy). The new hero lede names real cars, covers both ways to rent, and puts the strongest risk reducer next to the main button: *nothing is charged before we confirm.*

### Calls to action

| Where | Before | After | Why |
|---|---|---|---|
| Hero, primary | Check availability | Check availability (kept) | Matches the dock button it opens |
| Hero, secondary | Skip intro | **See prices** | Same anchor (#fleet), but it gives a reason to click and answers the first question a researcher has |
| Chapter 2 | See the featured cars | (kept) | Matches the new "Featured" rail label and eyebrow |
| Chapter 3 | See this car | **See prices and dates** | Says what the car page adds: the price and the calendar |
| How it works | Start a request | (kept) | Uses the same "request" verb as the rest of the page |
| Fleet, delivery, FAQ | Browse and filter the fleet / Delivery zones and fees / Read all FAQs | (kept) | Clear and specific |

The chapter 4 eyebrow and rail label said "Reserve". The content rules say "request" until ops confirm, so both now say *Send a request* / *Request*. The same word survives outside this file (see §5).

### Accuracy against the data

| Claim | Finding | Action |
|---|---|---|
| "Comprehensive insurance included" | **Accurate but incomplete.** Every rental includes comprehensive insurance (the booking flow calls it *Standard cover*), with an excess per claim of AED 5,000 (Luxury), AED 10,000 (Supercar) or AED 50,000 (Bugatti). Full Cover (AED 150 / 350 / 1,500 a day) cuts it to AED 0, or AED 15,000 on a Bugatti, and adds tyres, rims and glass. As a hero line with no excess, it reads as "fully covered". | Removed from the hero. Kept as the short "Comprehensive insurance" trust item, and the FAQ now says claims carry an excess that optional Full Cover lowers |
| "What's included: Delivered across Dubai" | **Misleading.** Delivery inside Dubai is AED 150 each way under 2 days and free from 2 days. The label "What's included" implied it is always free. (The Founding Client offer waives it until 31 Dec 2026, but the homepage can't rely on that.) | List label now *Key facts*; item now *Delivery anywhere in Dubai* |
| "VAT included, no hidden fees" | "No hidden fees" can't be proven, and it's a negation. The provable fact is that every fee is listed on the pricing page and appears in the quote before you send. | *VAT included, every fee listed* |
| SUVs: "dinner out in Al Qudra" | **Risky.** Al Qudra is desert, and the insurance excludes off-road and sand driving. | Replaced with family airport runs and the drive to Hatta |
| Supercars: "Mid-engine coupés and spiders" | The supercars filter also holds the Purosangue (a four-door). The line also wrapped to 3 lines at 1440 px. | *Mid-engine, V6 to V12*, which is true of all six cars on that filter |
| Chauffeur: "with a professional chauffeur" | Adds nothing ("professional" is puffery). | Body now says what you book: *by the hour or the day* |
| FAQ deposit | Didn't say **credit** card, which matters because debit cards and cash aren't accepted. Didn't say tolls and fines come off it. | Now: credit card in the main driver's name; released *{days}* days after return, less tolls or fines |
| FAQ age | "years' driving" is looser than the rule (licence held). It also left out that under-25s can still travel with a chauffeur. | Uses "licence held"; adds *Chauffeur bookings have no age rule for passengers* (from `requirements.ts`) |
| FAQ daily rate | Hard-coded "5% VAT" and "AED 4 to AED 6" (both figures the data provides). "{kmFrom} to {kmTo} km" was presented as the full range, but the Bugattis have 150 km. No mention of the excess. | Figures removed; *(less on the Bugattis)*; excess and Full Cover named; Salik *extra, at the published rate per crossing plus an AED {salik} admin fee* |
| Fleet lede "5% VAT" | Hard-coded rate (`site.vatRate`). | *Daily rates include VAT* |
| Reply time, Salik, "booked" wording, charging | Checked every string. The reply promise only comes in through `{reply}`. No string says Salik is included, uses "booked" or "reserved" as a status, or says anything is charged online. | No action needed |
| Chauffeur minimum, delivery fees, free-delivery threshold, airport fee, deposits, release days, km, ages | All arrive through placeholders from `rules.ts`, `zones.ts` and `cars.ts`. | Kept as placeholders |

### Tone and AI tells

- Gone: the negation "no hidden fees", the stacked comma clauses in the airport FAQ, "professional", and the pair "clean, insured and ready to drive", which any competitor could write.
- There are no em dashes, no "it's not X, it's Y" contrasts and no self-answered questions. Each section has at most one list of three.
- Verbs vary across neighbouring lines: Pick / Choose / Send.

### Length and fit

- Headlines are Syncopate, uppercase and very wide. A display headline line holds about 10 characters at 1440 px, and a card title about 13. The H1 component puts the first word on line 1 and the rest on line 2, so after the first word the H1 must stay at or under about 10 characters.
- Three headlines used to leave one word alone on the last line: "Driven, by / appointment" (both widths), "Confirm on / WhatsApp" (1440) and "Mid-engine / coupés / and spiders" (3 lines at 1440). All are fixed.
- Body copy was also checked for a single word on the last line at both widths (hero lede, tunnel lede, sculpture lede, step bodies, fleet lede, reserve lede, FAQ answers). None remain.
- The meta description was **182 characters**, so search results would cut it off. It is now **142**. The title is unchanged at **56** characters with the site name.

## 3. Before and after (all 38 changed keys)

| Key | Before | After | Reason |
|---|---|---|---|
| `meta.description` | Supercars, luxury SUVs and chauffeur cars from Lamborghini, Ferrari, Rolls-Royce, Bugatti and more, delivered across Dubai including DXB and DWC. Request online, confirm on WhatsApp. | Rent a Lamborghini, Ferrari or Bugatti in Dubai, or a Rolls-Royce with a chauffeur. Delivered to your hotel, villa or DXB. Prices include VAT. | 182 to 142 characters, so it fits in search results; names the brands and both ways to rent |
| `rail.fleet` | Fleet | Ways to rent | The chapter holds the three ways to rent; "Fleet" clashed with the real fleet section below |
| `rail.sculpture` | Sculpture | Featured | Says what the chapter shows |
| `rail.reserve` | Reserve | Request | Content rule: "request", not "reserve" |
| `sky.eyebrow` | Burj by Night | Luxury car rental in Dubai | Says what the business is in the first 5 seconds; it also repeated the H1's "night" idea |
| `sky.title` | Dubai after dark | Supercars, after dark | Names the product and keeps the night scene; fits the two-line H1 at both widths |
| `sky.lede` | Supercars, luxury SUVs and chauffeur cars, delivered to your door anywhere in Dubai. Comprehensive insurance included. | Drive a Lamborghini, Ferrari or Bugatti, or be driven in a Rolls-Royce. We bring it to your door, and nothing is charged before we confirm. | Real cars instead of categories; risk reducer next to the CTA; drops the insurance claim that needed an excess |
| `sky.skip` | Skip intro | See prices | Same anchor; gives a reason to click |
| `sky.noteTitle` | Your car comes to you | Hotel, villa or arrivals | Shows the actual handover places; the lede already says "to your door" |
| `sky.noteBody` | Delivery to hotels, villas and DXB or DWC arrivals. Keys handed over in person, with late handovers by arrangement. | Someone from our team meets you with the car and walks round it with you. At the end, we collect it from wherever you finish. | Describes the handover and the collection; "late handovers by arrangement" hid an AED 300 fee |
| `tunnel.eyebrow` | Velocity Tunnel | Three ways to rent | Internal scene name became a visitor label |
| `tunnel.lede` | Three ways to drive Dubai. Every car is delivered clean, insured and ready to drive. | Today's lowest rates, VAT included. Open a card to see every car in it. | Explains the "From" prices (they follow the season) and that the cards are links; the old line was generic and said "drive" twice |
| `tunnel.supercars.title` | Mid-engine coupés and spiders | Mid-engine, V6 to V12 | True of every car on the filter (incl. Purosangue); 2 lines instead of 3 at 1440 |
| `tunnel.supercars.body` | …for the Jumeirah coast road and the climb up Jebel Jais. | …for Jumeirah Beach Road and the climb up Jebel Jais. | A real road name |
| `tunnel.suvs.body` | Hatta day trips, family airport runs and dinner out in Al Qudra. | Rolls-Royce, Bentley, Lamborghini, Ferrari and Aston Martin, for family airport runs and the drive to Hatta. | Removes a desert (sand-driving) suggestion; names the brands like the other two cards |
| `tunnel.chauffeur.title` | Driven, by appointment | The rear seat is yours | Fixes the one-word last line at both widths; states the benefit |
| `tunnel.chauffeur.body` | Airport transfers, city hours and evening events in a Rolls-Royce or Bentley, with a professional chauffeur. | Airport transfers, weddings and business days in a Rolls-Royce or Bentley, by the hour or the day. | Drops puffery; says how it's priced (hourly, half and full day) |
| `sculpture.eyebrow` | Kinetic Sculpture | Featured cars | Internal scene name became a visitor label; matches the tab list name |
| `sculpture.lede` | Keep scrolling to take the car apart, part by part. Then watch it come back together. | Keep scrolling to take the car apart, from engine to wheels, and watch it rebuild. | Removes the "apart, part" echo; fixes a one-word last line |
| `sculpture.schematic` | The kinetic view is a schematic. | The 3D view is a schematic. | Removes jargon |
| `sculpture.see` | See this car | See prices and dates | Says what the click gives |
| `reserve.eyebrow` | Reserve | Send a request | Content rule; action-led |
| `reserve.lede` | Send a request now and we bring the car to your door. {reply} Nothing is charged on this website. | Choose your dates and where we should meet you, then send the request. {reply} | Tells the visitor what to do with the card beside it; the card already says "Nothing is charged online" |
| `reserve.trustLabel` | What's included | Key facts | Delivery isn't always included (screen-reader label for the list) |
| `reserve.trust.vat` | VAT included, no hidden fees | VAT included, every fee listed | Replaces an unprovable negation with a checkable fact |
| `reserve.trust.delivery` | Delivered across Dubai | Delivery anywhere in Dubai | Doesn't imply free; no longer repeats the delivery section title |
| `fleet.lede` | Every car we rent, grouped by marque. Prices are per day and include 5% VAT. | Daily rates include VAT. Each car's page lists its deposit, kilometres and minimum age. | Drops the hard-coded 5% and the repeat of the title; tells people what they'll find on a car page |
| `how.steps.request.title` | Send a request, nothing is charged | Send a request | Fits one line; the body already says nothing is charged |
| `how.steps.request.body` | Add your details and send the request. Nothing is charged on this website. | Add your details and where your licence was issued, then send it. Nothing is charged on this website. | Prepares visitors for the licence-country question the form asks |
| `how.steps.confirm.title` | Confirm on WhatsApp | We confirm on WhatsApp | Our team confirms, not the customer; fixes the one-word last line at 1440 |
| `how.steps.confirm.body` | {reply} Once we confirm, pay at handover or by secure link. | {reply} After we confirm, you pay at handover or by secure link. | Complete sentence; fixes a one-word last line |
| `delivery.lede` | We're based in Dubai Silicon Oasis and bring the car to you, wherever you're staying. | Choose the handover place in your request. Any delivery fee shows in your quote before you send it. | Answers "what does delivery cost?"; DSO was already in the card below and the trust row |
| `faq.age.a` | …Bugatti drivers must be {hyperAge} or older with {hyperYears} years' driving. | …For a Bugatti, you need to be {hyperAge} or older with a licence held for {hyperYears} years. Chauffeur bookings have no age rule for passengers. | Matches the licence rule; adds the under-25 option |
| `faq.deposit.a` | …is placed on your card at handover… We release it {days} days after the rental ends. | …goes on a credit card in the main driver's name at handover. We release it {days} days after you return the car, less any tolls or fines. | Credit card only; tolls and fines come off the hold |
| `faq.deposit.hyper` | Bugatti: from {amount}, released after {days} days. | For a Bugatti, the hold starts at {amount} and is released after {days} days. | Full sentence |
| `faq.airport.q` | Can you deliver to the airport? | Can you meet me at the airport? | The visitor's words; matches the FAQ page |
| `faq.airport.a` | …airport parking included, and we track your flight in case it's late. | Yes, at DXB or DWC, for {fee} each way including airport parking. Add your flight number to the request and we track the flight, then meet you in the arrivals hall. | Says what the visitor does; no longer just repeats the delivery card |
| `faq.included.a` | 5% VAT, comprehensive insurance and {kmFrom} to {kmTo} km a day, depending on the car. Salik tolls are passed on at AED 4 to AED 6 per crossing, plus AED {salik} each. | VAT, comprehensive insurance and {kmFrom} to {kmTo} km a day (less on the Bugattis). Insurance claims carry an excess, which optional Full Cover lowers. Salik tolls are extra, at the published rate per crossing plus an AED {salik} admin fee. | Removes hard-coded figures; covers Bugatti km; names the excess and Full Cover |

**Kept on purpose:** the page title, "Check availability", "Scroll to descend", "Choose your speed", "Room for four or five", "Every part on display", "Ready when you land", "{cars} cars, {brands} marques", "Three steps to the keys", "Pick a car and dates", "Delivered across Dubai", the three delivery cards, "Before you book", "Comprehensive insurance" (trust item) and all labels and aria strings. Each is clear, true and fits the layout.

## 4. Claims not made

| Claim | Why not | What would allow it |
|---|---|---|
| Reviews, ratings, "trusted by" or customer counts | None exist yet (About page says so) | An export of real reviews (Google Business) with names and dates |
| "Confirmed within 15 minutes" or any reply time beyond `{reply}` | Content rule | An ops service level, measured, then a change to `site.replyPromise` |
| "Salik included" | False for self-drive (charged per crossing + AED 1). It *is* true for chauffeur bookings, but repeating it on the homepage risks confusion | n/a |
| "Free delivery" as a headline | Free only from 2 days (or under the Founding Client offer until 31 Dec 2026) | A component that reads the offer from `rules.ts` with its end date |
| "Fully insured" / "zero excess" | An excess applies unless Full Cover is added | n/a |

## 5. For the lead: hard-coded strings and component notes

None of these were changed, because they are component code or belong to other workstreams.

1. **H1 split** (`Chapters.tsx:27`): `t("sky.title").split(" ")` puts the first word on its own line. The H1's second part must stay at or under about 10 characters at 1440 px. The Arabic title is split the same way, so the translator should know this.
2. **Hard-coded full stop** (`Chapters.tsx:47`): `{car.name}.` adds an English full stop between the car name and its tagline in chapter 3 (also on Arabic pages).
3. **Salik fee not formatted** (`AfterChapters.tsx:37`): `salik: rules.tollAdminFee` passes the bare number 1, so the copy has to hard-code "AED". Passing `aed(rules.tollAdminFee)` and the tariff (`rules.tolls.salikOffPeak` / `salikPeak`) as placeholders would let the FAQ state the AED 4 to 6 range without hard-coding it. This needs a matching Arabic change.
4. **VAT rate**: the FAQ and fleet lede no longer say "5%". If you want it back, pass `site.vatRate` as a placeholder.
5. **Delivery fallback** (`AfterChapters.tsx:49`): `city.freeFromDays ?? 2` hard-codes a figure that is already in `zones.ts`.
6. **"Reserve" outside this file conflicts with the request rule:** the header button "Reserve", the fleet card button (`common.json` `car.reserve`), and the reserve card (`booking.json` `reserve.reserve` "Reserve", `reserve.eyebrow` "Your reservation"). On the homepage the card now sits under *Send a request*, but its button still says *Reserve* (and *Request* for Bugattis). Suggest "Request" throughout.
7. **Same one-word-last-line risk elsewhere:** `fleet.json` line 74 also uses "Driven, by appointment".
8. **Reduced motion:** the sculpture lede tells people to keep scrolling, but with reduced motion the car doesn't come apart. The component could hide the lede in that mode (it already hides it on short phone screens).
9. **SEO:** the H1 has no "rental" keyword. The eyebrow above it says *Luxury car rental in Dubai* but is a `<p>`. The page title carries the keyword. If organic search matters more than the art line, render the eyebrow inside the `<h1>`.
10. Stale code comment: `HomeExperience.tsx:267` mentions "Skip intro" (the anchor is the same; only the label changed).

## 6. Car taglines (chapter 3 and other pages, not changed)

Chapter 3 shows the name and tagline of the five featured cars (desktop only).

| Car | Tagline | Note | Suggestion |
|---|---|---|---|
| Lamborghini Revuelto | The V12 flagship, with scissor doors and 1,001 hp. | Good. The hp figure is typed in, duplicating `specs.hp` | Keep, or build the hp from data |
| Rolls-Royce Cullinan Series II | The lit grille that owns the night. Self-drive or with a chauffeur. | "Owns the night" is hype | *An illuminated grille and a Starlight Headliner. Self-drive or with a chauffeur.* (both in the car's equipment list) |
| Bugatti Chiron Super Sport | The final Chiron. 1,578 hp from a quad-turbo W16. | "The final Chiron" claims more than the data supports: this is a 2023 car, and one particular Super Sport was the last Chiron built | *The long-tail Chiron. 1,578 hp from a quad-turbo W16.*, or keep it if the car's papers show it is that last one |
| Ferrari 296 GTS | A hybrid V6 spider with the roof down in 14 seconds. | Good, specific | Keep |
| McLaren 750S Spider | Dihedral doors, a carbon tub and an open sky. | Good | Keep |

Other cars, for the data owner:

- **Urus SE.** "Dubai's favourite super-SUV" can't be proven. Suggest *A five-seat super-SUV, now a plug-in hybrid.*
- **MCPura Cielo.** The tagline says the roof "turns clear", but the equipment list says "turns opaque". Both describe the same switchable glass; pick one wording.
- **DB12 Volante ("for the Hatta road") and the SUV card ("the drive to Hatta").** Ops should confirm the insurer's position on the Dubai to Hatta road. The insurance excludes leaving the UAE, and some routes to Hatta are reported to cross a short stretch of Omani territory without a border post. We deliver to Hatta (AED 500), so the trip itself is offered.
- **Jebel Jais (supercars card).** A day trip there and back from central Dubai is roughly 300 km. That is more than the daily allowance (200 km on the Revuelto, 250 on most cars), so extra-km charges are likely on a one-day rental. The line is still fair; the FAQ states the allowance.

## 7. Test ideas

1. **Hero secondary button:** *See prices* vs *Skip intro*. Metric: clicks into a category or car from chapter 2. Expect *See prices* to win.
2. **H1:** *Supercars, after dark* vs *Supercars, on arrival*. Metric: hero "Check availability" clicks. *On arrival* states the delivery promise. If it wins, change the chapter 4 title so it doesn't repeat "Ready when you land".
3. **Founding Client offer in the trust row** (needs a new key and component work): "Free delivery in Dubai until 31 Dec". Metric: requests sent.

## 8. Verification

- `node qa/scripts/i18n-keys.mjs`: "Keys and placeholders match." The Arabic file is unchanged; another agent updates it from the changed-key list above.
- `npx tsc --noEmit`: passes.
- Screenshots of every chapter and section at 390×844 and 1440×900, taken with Chromium (SwiftShader WebGL) against the shared dev server, before and after the change. Each run measured line breaks for every headline and body paragraph, element overflow, page-level horizontal overflow and console errors. Final run: 0 px overflow, 0 console errors, no single word on the last line of any headline or paragraph from this file. The only one-word last line left on the page is the car name "GranTurismo / Trofeo" in the fleet strip, which comes from car data.

## Round 2 (client feedback, 26 Oct)

Zubair raised four points. This round used the copywriting, copy-editing and cro skills.

**Result:** 7 keys changed in `src/messages/en/home.json`. There is no component change. `fleet.title` no longer uses `{cars}` or `{brands}` (see R2.4).

### R2.1 Hero headline (`sky.title`)

**Diagnosis.** "Supercars, after dark" names the product, but the second half is mood only. It doesn't say what the visitor gets, and "after dark" can read as night-only rental. Once the test branch puts a recognisable Burj Khalifa in the scene, the picture is about Dubai and arriving there more than about the night.

**Constraint.** The component puts the first word on line 1 and the rest on line 2. At 1440 px the second line holds about 10 characters of Syncopate (measured in the page), so "Dubai, by supercar" breaks to three lines there.

| Option | Lines at 390 / 1440 | Reader can picture it | Can be proved | Hard for a competitor to copy | Notes |
|---|---|---|---|---|---|
| **A. Supercars, on arrival** (shipped) | 2 / 2 | Yes: you arrive, the car is there | Yes: delivery anywhere in Dubai, meet-and-greet at DXB and DWC | Partly: the phrase is ours, the service isn't unique | Works with the night skyline and with the Burj Khalifa |
| B. Land, then drive | 2 / 2 | Strongly | Yes | Yes | Leaves out residents and chauffeur guests; "LAND," alone on line 1 reads oddly |
| C. Supercars in Dubai | 2 / 2 | Weakly | Yes | No | Best for search, but plain, and it repeats the eyebrow's "in Dubai" |

Also considered: "Dubai, by supercar" (three lines at 1440 px), "Drive the night" (mood only, and it excludes chauffeur guests), and the current "Supercars, after dark".

**Why A.**
- It gives the product and the promise in three words, and the lede directly below explains it: *We bring it to your door*.
- "On arrival" echoes a phrase every UAE visitor knows ("visa on arrival").
- It is true for residents too, because the car arrives wherever they are.
- It names no landmark and no time of day, so it works with either scene.
- It bookends the request chapter's title, "Ready when you land", which repeats the promise beside the request form. That echo is deliberate.

### R2.2 The panel after the hero (`sky.noteEyebrow`, `sky.noteTitle`, `sky.noteBody`)

**What the visitor has at this moment.** They have read the eyebrow, the headline, the lede and two buttons. They then scroll through about two screens of animation with no text: the city, a car forming from gold dust, and the car landing on a rooftop helipad. The panel appears beside the landed car, and chapter 2 (ways to rent and today's prices) follows one screen later.

**What they should learn here.** By now the hero has answered "what is it?" and "do they bring it to me?". Two questions remain:
- *What does it cost?* Chapter 2 answers this one screen later.
- *Can I trust a company with no reviews yet?* Nothing on screen answers this until the trust row and FAQ, far below.

The panel has no button, and it sits at the payoff of the animation. Its job is one trust point that the picture beside it already shows.

**Why the round 1 panel didn't make sense:**
- "Door-to-door handover" is trade jargon.
- The title listed three places (hotel, villa, arrivals), and none of them is what's on screen, a rooftop.
- The body described a procedure.
- All of it repeated the delivery section further down and the hero lede ("We bring it to your door").

It read like a line from an ops manual dropped into the middle of the film.

**Does it earn its place?** Only if it says something new that the picture illustrates. Without it, two screens of animation carry no message between the promise and the prices. Removing it would mean editing `Chapters.tsx` and the GSAP timeline in `HomeExperience.tsx`, which targets `[data-sky-b]`, and the animation's payoff would lose its meaning. **Decision: keep the panel and give it a new job. No component change.**

**The new message is the specific-car promise:**
- Each model in the fleet is a single car, and a request names that car.
- The cancellation terms (`faq.ts`, "What if you cannot provide my car?") already set the remedy: a full refund or a comparable or better car, at no extra cost.
- It is the strongest trust point we can prove today, and rental sites that book "or similar" can't make it.
- It is what the scene shows: one particular car arriving.

**Checks:**
- It names no landmark, so it works with the Burj Al Arab helipad on the test branch.
- It does not suggest a rooftop handover (content rule).
- It repeats no delivery detail.

**Flow now:**
1. Hero: what it is, the promise, and that nothing is charged before we confirm.
2. Panel: the car that arrives is the one you asked for.
3. Chapter 2: the three ways to rent and today's prices.

### R2.3 Chapter 3 (`sculpture.title`, `sculpture.lede`)

**Diagnosis.** The title described the animation ("Every part on display") and the lede told people to scroll. Neither said why the section exists: to choose between the featured cars and compare their key specs. With reduced motion the scroll instruction was also untrue (round 1, §5 item 8). Copy now resolves that.

| Option | Lines at 390 / 1440 | Notes |
|---|---|---|
| **Compare the specs** (shipped) | 2 / 2 | States the purpose; under the eyebrow *Featured cars* it reads as "compare the featured cars' specs" without repeating "cars" |
| The cars, up close | 2 / 2 | Clear, but repeats "cars" from the eyebrow and doesn't mention comparing |
| Which one is yours? | 2 / 2 | Invites the choice, but leaves the specs to the lede |

**Lede:** *Choose a car to see its engine, power, acceleration and seats.* It names what each car's panel and 3D labels show (Powertrain, Performance, Cabin). "0–100 time" was dropped because it broke across lines as "0–100 / time".

**Scroll effect: not mentioned.** On desktop the section is a long sticky scroll, so visitors are already scrolling when the car comes apart and the labels appear. Copy that depends on motion is wrong under reduced motion.

**Other `sculpture.*` strings, all kept:**
- eyebrow *Featured cars*
- tab-list label *Featured cars*
- *The 3D view is a schematic.*
- *See prices and dates* (the natural next step after comparing)
- the spec labels Powertrain / Performance / Cabin / Drive, which match the 3D labels

The tagline issue in §6 ("The final Chiron") still stands.

### R2.4 Fleet headline (`fleet.title`)

**Diagnosis.** "16 cars, 8 marques" is a count. "Marques" is enthusiast jargon, and the line doesn't say why the section matters. The section shows every car, grouped by brand, each with today's daily rate (Bugattis show "On request · from").

| Option | Placeholders | Lines at 390 / 1440 | Notes |
|---|---|---|---|
| **Every car, every price** (shipped) | none | 2 / 2 | Says what's below and states the brand's point of view: prices in the open, VAT included (About page) |
| {cars} cars, known in detail | `{cars}` | 2 / 2 | Borrows the About page's line. "Known in detail" is soft and hard to prove |
| Every car we rent | none | 2 / 1 | Plain and accurate, but a competitor could write it |

The count still appears on the page ("Choose from {cars} cars" in How it works).

**Placeholder change.** `fleet.title` drops **both** `{cars}` and `{brands}`.
- `AfterChapters.tsx` still passes `{ cars, brands }`. `translate()` (`src/i18n/translate.ts`) fills only placeholders present in the string, so no component change is needed and the extra values are ignored.
- The Arabic `fleet.title` (`{cars} سيارة من {brands} علامات`) must drop both too.
- Until it does, `node qa/scripts/i18n-keys.mjs` reports one problem: "placeholders differ at fleet.title". A run on a scratch copy with the Arabic placeholders removed reports "Keys and placeholders match", so this is the only mismatch.
- The Arabic page keeps rendering correctly in the meantime.

### R2 before and after (7 keys)

| Key | Before (round 1) | After | Reason |
|---|---|---|---|
| `sky.title` | Supercars, after dark | Supercars, on arrival | Product and promise; works with either skyline (R2.1) |
| `sky.noteEyebrow` | Door-to-door handover | Your car | Plain label; drops the trade term "handover" |
| `sky.noteTitle` | Hotel, villa or arrivals | The one you asked for | Captions the car on screen as the visitor's own car |
| `sky.noteBody` | Someone from our team meets you with the car and walks round it with you. At the end, we collect it from wherever you finish. | You request a specific car, and that is the car that arrives. If it's ever unavailable, you choose a full refund or a comparable car at no extra cost. | A new, provable trust point in place of delivery details that repeat later sections (R2.2) |
| `sculpture.title` | Every part on display | Compare the specs | Says the purpose of the section (R2.3) |
| `sculpture.lede` | Keep scrolling to take the car apart, from engine to wheels, and watch it rebuild. | Choose a car to see its engine, power, acceleration and seats. | Tells visitors what to do and what they'll see; true with reduced motion |
| `fleet.title` | {cars} cars, {brands} marques | Every car, every price | Explains the section and the pricing stance; **placeholders removed** (R2.4) |

### R2 test ideas (these replace §7 item 2)

1. **Hero headline:** *Supercars, on arrival* vs *Supercars, after dark*. Metric: hero "Check availability" clicks and scroll into chapter 2.
2. **Panel:** the specific-car promise vs no panel. This needs the `[data-sky-b]` block made optional in `Chapters.tsx`. Metric: scroll from the hero into chapter 2 and clicks on a category card.

### R2 verification

- `npx tsc --noEmit` passes.
- `node qa/scripts/i18n-keys.mjs` reports one expected problem, "placeholders differ at fleet.title", until the Arabic drops `{cars}` and `{brands}`. With that applied in a scratch copy it reports "Keys and placeholders match".
- Before writing, each candidate headline and body was injected into the live page at 390 and 1440 px and its line breaks measured.
- Final screenshots of every chapter and section at 390×844 and 1440×900 (Chromium with SwiftShader WebGL, shared dev server):
  - 0 px horizontal overflow and 0 console errors.
  - No single word on the last line of any headline or paragraph from this file.
  - The car name "GranTurismo / Trofeo" in the fleet strip still breaks with one word on its last line. It comes from car data.
