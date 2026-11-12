// Burner Phone No. 002: "The Green Jacket." A fictional burner from the week
// after the 2008 Masters. The phone, J., the editor, the fixer and every message
// on it are invented; the career facts and the 2009 public record are real.
(function () {
  "use strict";

  const TIGER = {
    id: 2,
    owner: "Tiger Woods",
    model: "punch",
    ground: "mat",
    time: "1:07",
    dateLine: "Monday, 14 April",
    cal: { dow: "TUE", day: "15" },
    badge: { drafts: 6, voicemail: 4, pay: 5 },
    meta: { carrier: "Burner Mobile", account: "Burner •• 4417", synced: "1:02 AM", timezone: "ET" },
    appNotes: {
      drafts: "Burner account • 6 unsent • last edit 12:58 AM",
      pay: "Burner Cash • •• 4417 • updated 1:02 AM",
      voicemail: "Visual voicemail • 4 deleted • restored 1:02 AM",
      places: "Location History • On • 13–14 April",
      photo: "Messages • J. • received 12:58 AM • expires in 8s",
    },
    lock: [
      { tile: "game", title: "You found this phone in a hotel lost-and-found.", text: "It isn’t locked, and nothing on it is real. Work out whose it is before the battery dies. Opening an app costs 1%. So does a wrong name.", when: "now" },
      { tile: "phone", title: "If found, call J.", text: "Reward. No questions.", when: "now" },
      { tile: "voicemail", title: "Voicemail", text: "4 deleted messages, still here", when: "12:42 AM" },
      { tile: "pay", title: "Payments", text: "5 payments sent this week", when: "11:30 PM" },
      { tile: "calendar", title: "Tomorrow: flight home", text: "7:30 AM, private hangar", when: "now" },
    ],
    widget: { dow: "TUESDAY", day: "15", title: "Flight home", time: "7:30 AM, private hangar", where: "First: call J.", note: "She has the key" },

    drafts: [
      { to: "J.", handle: "+1 (706) ••• 2214", subject: "Tonight", text: "I can’t do dinner. Tell them I’m in New York.", date: "Apr 14", when: "12:58 AM", ref: "D-1042", status: "Not sent" },
      { to: "J.", handle: "+1 (706) ••• 2214", subject: "(no subject)", text: "Do not call the house phone. Use this one.", date: "Apr 14", when: "12:41 AM", ref: "D-1041", status: "Not sent" },
      { to: "Agent", handle: "+1 (212) ••• 0198", subject: "The photo", text: "The magazine has the photo. Fix it before the next event.", date: "Apr 14", when: "12:18 AM", ref: "D-1040", status: "Not sent" },
      { to: "Me", handle: "Drafts", subject: "(no subject)", text: "I can still smell your perfume on the collar. I’ll have it cleaned before I go home.", date: "Apr 14", when: "12:04 AM", ref: "D-1039", status: "Not sent" },
      { to: "J.", handle: "+1 (706) ••• 2214", subject: "After", text: "I’ll tell her after the tournament. I mean it this time.", date: "Apr 13", when: "11:52 PM", ref: "D-1038", status: "Not sent" },
      { to: "Fixer", handle: "+1 (212) ••• 7731", subject: "The story", text: "The story is dead if we don’t feed it. Give them the foundation.", date: "Apr 13", when: "11:44 PM", ref: "D-1037", status: "Not sent" },
    ],

    payTop: { label: "April outflow", amt: "$15,129.99", note: "Five sent. One received. April." },
    pay: [
      { initial: "C", who: "Crisis Mgmt", amt: "$12,000.00", memo: "April retainer. Media.", kind: "Sent", date: "Apr 3", time: "4:12 PM", reference: "PMT-8841", method: "Burner Cash", status: "Completed", dir: "out" },
      { initial: "L", who: "The Lodge", amt: "$1,850.00", memo: "Room 214. Incidentals.", kind: "Sent", date: "Apr 13", time: "9:10 PM", reference: "PMT-8842", method: "Burner Cash", status: "Completed", dir: "out" },
      { initial: "J", who: "J.", amt: "$850.00", memo: "Birthday. Don’t put my name on it.", kind: "Sent", date: "Apr 13", time: "6:40 PM", reference: "PMT-8843", method: "Burner Cash", status: "Completed", dir: "out" },
      { initial: "B", who: "BurnerApp", amt: "$9.99", memo: "Burner number, monthly.", kind: "Sent", date: "Apr 1", time: "8:00 AM", reference: "PMT-8844", method: "Burner Cash", status: "Completed", dir: "out" },
      { initial: "P", who: "Private car", amt: "$420.00", memo: "Airport pickup. No name.", kind: "Sent", date: "Apr 13", time: "8:30 PM", reference: "PMT-8845", method: "Burner Cash", status: "Completed", dir: "out" },
      { initial: "S", who: "Sponsor Relations", amt: "+$250,000.00", memo: "Q2 retainer.", kind: "Received", date: "Apr 2", time: "10:00 AM", reference: "PMT-8840", method: "Bank transfer", status: "Completed", dir: "in" },
    ],

    vmNote: "Deleted from the bin. Restored by the carrier.",
    voicemails: [
      { from: "Agent", number: "+1 (212) ••• 0198", date: "Apr 13", time: "11:58 PM", duration: "0:19", deleted: true, text: "“The magazine has the photo. We need a statement before the next event. Something with the foundation.”" },
      { from: "J.", number: "+1 (706) ••• 2214", date: "Apr 13", time: "11:47 PM", duration: "0:14", deleted: true, text: "“You said you’d tell her after the tournament. I’m not going to be your secret forever.”" },
      { from: "Editor", number: "+1 (212) ••• 7731", date: "Apr 13", time: "9:30 PM", duration: "0:31", deleted: true, text: "“The photo is real. We’re running it Friday. You have until then to comment.”" },
      { from: "Caddie", number: "+1 (407) ••• 6642", date: "Apr 13", time: "8:52 PM", duration: "0:22", deleted: true, text: "“I have your bag for tomorrow. And the other bag. The one you didn’t want in the car.”" },
      { from: "Sponsor", number: "+1 (212) ••• 4400", date: "Apr 13", time: "7:30 PM", duration: "0:27", deleted: false, text: "“The family campaign is due Monday. Are we still doing the dinner?”" },
    ],

    placesNote: "Places this phone has been. History is on.",
    places: [
      { date: "Apr 13", time: "7:40 PM", where: "Augusta National, clubhouse", address: "Augusta, Georgia", len: "After the final round. 20 minutes.", source: "GPS", ref: "LOC-2031", saidLabel: "Said", said: "heading home" },
      { date: "Apr 13", time: "9:10 PM", where: "The Lodge", address: "Augusta, Georgia", len: "Room 214. Checked in.", source: "GPS", ref: "LOC-2032", said: "a quiet dinner" },
      { date: "Apr 13", time: "11:47 PM", where: "The Lodge bar", address: "Augusta, Georgia", len: "One drink. Two glasses.", source: "GPS", ref: "LOC-2033", said: "just one drink" },
      { date: "Apr 14", time: "12:58 AM", where: "The Lodge, room 214", address: "Augusta, Georgia", len: "Do not disturb.", source: "GPS", ref: "LOC-2034", said: "working" },
    ],

    photo: {
      src: "img/t-evidence.svg", px: "img/t-evidence-px.svg", w: 900, h: 900,
      from: "J.", handle: "+1 (706) ••• 2214", received: "12:58 AM", expires: "8 seconds", bytes: "2.4 MB", ref: "IMG-2214",
      alt: "A green jacket on a hotel closet rail with a small Stanford pin, a room key marked 214, a handwritten note and a champagne glass.",
      goneAlt: "The photo has disappeared. Only a blur of green, cream and dark squares is left.",
      caption: "The green jacket, the Stanford pin and the room key. Taken at 12:58 AM.",
    },

    live: [
      { at: 2, kind: "text", from: "Agent", text: "The magazine called again. Do not talk to anyone." },
      { at: 4, kind: "call", from: "J.", sub: "mobile" },
    ],

    reply: {
      name: "Burner voicemail",
      you: "I found your burner.",
      open: {
        5: "Message delivered. The owner has not replied.",
        4: "Mailbox full. No new messages.",
        3: "The owner has seen this message.",
        2: "Message delivered. No reply.",
        1: "Message delivered.",
        0: "The mailbox is still open. One message.",
      },
      saw: {
        drafts: "The owner has seen the draft folder.",
        pay: "The owner has seen the payment history.",
        voicemail: "The owner has replayed the voicemail.",
        places: "The owner has seen the location history.",
        photo: "The owner has opened the photo.",
      },
      guessed: {
        "Steve Williams": "No mailbox by that name.",
        "Mark Steinberg": "No mailbox by that name.",
        "Phil Mickelson": "No mailbox by that name.",
        "J. Miller": "That is the name on the lost-phone card. It is not the owner.",
      },
      misses: {
        1: "One wrong name. The mailbox is still open.",
        2: "Two wrong names. The mailbox is filling up.",
        3: "Three wrong names. The owner is not answering.",
      },
      close: ["No further messages.", "This mailbox will close in 24 hours.", "The phone has been reported found.", "End of messages."],
    },

    story: {
      parody: "This phone is a fictional object. Tiger Woods had nothing to do with it, and neither did anyone in its contacts. Every message, payment, hotel detail and photograph on it is invented. What the story points at is real, and is listed under “What is real” below.",
      headline: "The green jacket in room 214",
      dateline: "Monday, 14 April 2008, Augusta, Georgia",
      lead: { src: "img/t-course.svg", w: 1200, h: 675, alt: "A golf course at dawn, with a flag on the green.", cap: "Augusta, the week after the Masters." },
      side: { src: "img/t-key.svg", w: 960, h: 540, wide: true, alt: "A hotel key card, a champagne glass and a lipstick-marked napkin.", cap: "Room 214. The key was in the bag." },
      paras: [
        "In April 2008, Tiger Woods was the biggest name in golf. He had won the Masters four times, held the world No. 1 ranking, and built a public identity around discipline, family and control. That week he was at Augusta National for the Masters; the tournament ended on Sunday. He did not win it.",
        "The phone is invented. The hotel room, J., the editor, the fixer and the messages are fictional. The green jacket, the Stanford pin, the Augusta timeline and the tournament are public record, and the 2009 scandal — the crash, the admitted infidelity and the televised apology — is public record too.",
        "What is real is the double life the public would later learn about, and the machinery that surrounded it: agents, sponsors, a foundation, a caddie, a hotel key. What is invented is this particular phone, and the idea that it was left in a lost-and-found on the Monday after the Masters.",
        "The owner is the man whose career is written in green jackets and whose private life became a global story later that year. The phone did not create the scandal. It just made the room number visible.",
      ],
      invented: "Everything on the phone is made up: the drafts, the payment notes, the voicemails, the hotel room and the idea that he had a second phone at all. J. is a fictional composite, not a real person. No real private people are characters here. The career facts and the 2009 public record are real.",
      sources: [
        { what: "Woods's career and the 2009 scandal.", where: "Wikipedia", url: "https://en.wikipedia.org/wiki/Tiger_Woods" },
        { what: "Woods's televised statement and apology.", where: "BBC News", url: "https://news.bbc.co.uk/2/hi/americas/8373927.stm" },
        { what: "The 2009 crash and the public record.", where: "ESPN", url: "https://www.espn.com/golf/news/story?id=4694523" },
      ],
    },

    rebut: {
      "J. Miller": "That is the name on the lost-phone card. It is not the owner.",
      "Steve Williams": "The caddie carries the bag. He doesn’t live in the house.",
      "Mark Steinberg": "The agent handles statements. He doesn’t wear the green jacket.",
      "Phil Mickelson": "Wrong golfer. This phone is from Augusta, and the jacket is green.",
      "Michael Jordan": "Wrong sport. Same glare.",
      "David Beckham": "Wrong football.",
      "Barack Obama": "Wrong kind of famous.",
    },
  };

  window.BURNER_CASES = [TIGER];
})();
