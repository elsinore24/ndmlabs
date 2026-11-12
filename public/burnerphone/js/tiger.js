// Burner Phone No. 002: "The Other Bag." A fictional second phone on the night
// before Tiger Woods's public scandal broke. The crash and the affair scandal are
// public record; the phone, its messages and D. are invented for the parody.
(function () {
  "use strict";

  const TIGER = {
    id: 2,
    owner: "Tiger Woods",
    model: "punch",
    ground: "mat",
    time: "1:07",
    dateLine: "Thursday, 26 November",
    cal: { dow: "FRI", day: "27" },
    badge: { drafts: 6, voicemail: 5, pay: 2 },
    lock: [
      { tile: "game", title: "You found this phone in a hotel lost-and-found.", text: "It isn’t locked, and nothing on it is real. Work out whose it is before the battery dies. Opening an app costs 1%. So does a wrong name.", when: "now" },
      { tile: "phone", title: "If found, call E. Daniels", text: "Reward. No questions.", when: "now" },
      { tile: "voicemail", title: "Voicemail", text: "5 deleted messages, still here", when: "12:42 AM" },
      { tile: "pay", title: "Payments", text: "2 people want their money back", when: "11:30 PM" },
      { tile: "calendar", title: "Tomorrow: flight home", text: "7:30 AM, private hangar", when: "now" },
    ],
    widget: { dow: "FRIDAY", day: "27", title: "Flight home", time: "7:30 AM, private hangar", where: "First: delete the room", note: "She has the key" },

    drafts: [
      { to: "Fixer", text: "I need a mulligan on Thanksgiving.", when: "12:58 AM" },
      { to: "Agent", text: "Tell the tour I’m sick. Tell the sponsor I’m sorry. Tell D. I’m on my way.", when: "12:41 AM" },
      { to: "D.", text: "Do not call the house phone. Do not call the house.", when: "12:15 AM" },
      { to: "Caddie", text: "The only thing I’m faithful to is my putter.", when: "11:58 PM" },
      { to: "Me", text: "If anyone asks, I was asleep. I was not asleep.", when: "11:44 PM" },
      { to: "Fixer", text: "I’ll pay for the room. Delete the reservation.", when: "11:30 PM" },
    ],

    payTop: { label: "Gone in one weekend", amt: "$33,000", note: "Thanksgiving through Sunday. His own number." },
    pay: [
      { initial: "C", who: "Crisis Mgmt", amt: "$18,000", memo: "Thanksgiving. No paper trail.", kind: "Sent", when: "Thursday", dir: "out" },
      { initial: "T", who: "The Lodge", amt: "$2,400", memo: "Room 214. Late checkout.", kind: "Sent", when: "Thursday", dir: "out" },
      { initial: "D", who: "D.", amt: "$600", memo: "For your silence 🙂", kind: "Sent", when: "Thursday", dir: "out" },
      { initial: "B", who: "BurnerApp", amt: "$9.99", memo: "Best $9.99 I ever spent.", kind: "Sent", when: "Wednesday", dir: "out" },
      { initial: "V", who: "Valet", amt: "$75", memo: "You didn’t see the bag.", kind: "Sent", when: "Thursday", dir: "out" },
      { initial: "S", who: "Sponsor Relations", amt: "$12,000", memo: "Morality clause. Annual review.", kind: "Received", when: "October", dir: "in" },
    ],

    vmNote: "The bin has not been emptied since the gala.",
    voicemails: [
      { from: "Agent", meta: "Today, 6:12 AM, 0:19", text: "“The tabloid has a voicemail. We need a story by noon. Something with a charity.”" },
      { from: "Fixer", meta: "Today, 5:58 AM, 0:27", text: "“The sponsor wants a statement. The tour wants a photo op. Pick one.”" },
      { from: "Caddie", meta: "Yesterday, 11:52 PM, 0:22", text: "“I have your bag. And your other bag. And the bag with the phones.”" },
      { from: "D.", meta: "Yesterday, 11:47 PM, 0:14", text: "“You said the 19th hole was just a joke. You said you’d leave her.”" },
      { from: "Sponsor", meta: "Yesterday, 9:30 PM, 0:31", text: "“We need to talk about the holiday campaign. And the word ‘family.’”" },
    ],

    placesNote: "Places this phone has been. History is on.",
    places: [
      { when: "26 November 2009", where: "A gated house, Florida", len: "Thanksgiving dinner. 11 people. 9:40 PM.", saidLabel: "Posted", said: "“happy thanksgiving”" },
      { when: "26 November 2009", where: "The Lodge, room 214", len: "11:15 PM to 2:15 AM. Late checkout.", said: "visiting a friend" },
      { when: "26 November 2009", where: "The hotel bar", len: "One more. 1:47 AM.", said: "just one drink" },
      { when: "27 November 2009", where: "Private hangar", len: "7:00 AM. Flight home.", said: "home by eight" },
    ],

    photo: {
      src: "img/t-shirt.svg", px: "img/t-shirt-px.svg", w: 900, h: 900,
      from: "D.", sub: "Sent today. Opens once.",
      alt: "A red polo shirt with a Stanford tag, a hotel key card marked 214, a champagne glass and a lipstick-marked napkin on a hotel desk.",
      goneAlt: "The photo has disappeared. Only a blur of red, white and cream squares is left.",
      caption: "The red shirt, the Stanford tag and the room key. Taken at 1:47 AM.",
    },

    live: [
      { at: 2, kind: "text", from: "Agent", text: "The tabloid called. Do not talk to anyone." },
      { at: 4, kind: "call", from: "Caddie", sub: "mobile" },
    ],

    reply: {
      you: "I found your burner.",
      open: {
        5: "wrong guy. i don’t even own a second phone",
        4: "i have a lot of phones. none of them are mine",
        3: "you opened three things. none of them were mine. all of them were private",
        2: "the hotel has a great gym. the room was for the gym",
        1: "you went through nearly all of it. fine. it’s mine",
        0: "you used the whole battery. yes. it’s mine",
      },
      saw: {
        drafts: "those were notes for a speech",
        pay: "those were gifts to charity",
        voicemail: "i delete voicemails for privacy",
        places: "the hotel has a great gym",
        photo: "that photo is from a commercial",
      },
      guessed: {
        "E. Daniels": "that’s not even a real name",
        "Steve Williams": "my caddie? he carries the bag, not the blame",
        "Mark Steinberg": "my agent? he bills by the hour",
        "Phil Mickelson": "wrong golfer. right decade",
        "Michael Jordan": "wrong sport. same glare",
        "Barack Obama": "wrong kind of famous",
        "David Beckham": "wrong football",
      },
      misses: {
        1: "one wrong name. i’ve had worse",
        2: "two wrong names. you’d fit right in at the tabloid",
        3: "three wrong names. were you even trying to catch me",
      },
      close: ["keep it. i’m getting a new one", "tell the tabloid i said happy thanksgiving", "put it back in the bag", "i’m sorry you don’t believe in my short game"],
    },

    story: {
      parody: "This phone is a parody. Tiger Woods had nothing to do with it, and neither did anyone in its contacts. Every draft, payment note and voicemail on it is invented. What they point at is real, and is listed under “What is real” below.",
      headline: "Tiger Woods, the night before the driveway",
      dateline: "Thursday, 26 November 2009, Florida",
      lead: { src: "img/t-course.svg", w: 1200, h: 675, alt: "A golf course at dawn, with a flag on the green.", cap: "The course was the easy part." },
      side: { src: "img/t-key.svg", w: 960, h: 540, wide: true, alt: "A hotel key card, a champagne glass and a lipstick-marked napkin.", cap: "Room 214. The key was in the bag." },
      paras: [
        "On Thanksgiving night in 2009, Tiger Woods was the most famous athlete in the world. He was the first Black golfer to win the Masters, the face of a dozen sponsors, and the man who had built a public brand around discipline, family and control.",
        "Just after 2:25 the next morning, his SUV hit a fire hydrant and a tree outside his home in Isleworth, Florida. He was taken to hospital. The police report, the tabloids and the televised apology that followed turned a private life into a global story. He admitted infidelity. Sponsors left. He stepped away from golf, then came back.",
        "The phone is invented. The second phone, the hotel room, the fixer, the hostess called D. and the red shirt with the Stanford tag are all made up. The crash, the affairs and the apology are public record. D. is a fictional composite, not a real person.",
        "The joke is not the women. It is the machine around him: the agent with the statement, the fixer with the tabloid, the caddie with the bag, the sponsor with the morality clause, and a man who could win the Masters but not a game of “whose phone is this?”",
      ],
      invented: "Everything on the phone is made up: the drafts, the notes on the payments, the voicemails, the hotel room and the idea that he had a second phone at all. The contacts are roles, not people. The crash and the affair scandal are public record.",
      sources: [
        { what: "The crash and the first police report.", where: "ESPN", url: "https://www.espn.com/golf/news/story?id=4694523" },
        { what: "Woods’s statement and apology.", where: "BBC News", url: "https://news.bbc.co.uk/2/hi/americas/8373927.stm" },
        { what: "The sponsors who left.", where: "CNN Money", url: "https://money.cnn.com/2009/12/13/news/companies/tiger_woods_accenture/index.htm" },
        { what: "The public record.", where: "Wikipedia", url: "https://en.wikipedia.org/wiki/Tiger_Woods" },
      ],
    },

    rebut: {
      "E. Daniels": "That’s the name on the lost-phone card. It’s a fake.",
      "Steve Williams": "The caddie carries the bag. He doesn’t sign the checks.",
      "Mark Steinberg": "The agent handles the statement. He doesn’t wear the red shirt.",
      "Phil Mickelson": "Wrong golfer. This phone has a Stanford tag and a morality clause.",
      "Michael Jordan": "Wrong sport. Same glare.",
      "David Beckham": "Wrong football.",
      "Barack Obama": "Wrong kind of famous.",
    },
  };

  window.BURNER_CASES = [TIGER];
})();
