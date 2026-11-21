/* ============================================================
   credentials.js: every certificate and record on the page.

   Data rule: each entry was read from a certificate file on
   James's computer (path in `file`) on 21 November 2026. IDs,
   dates and wording are copied from the certificate. If a field
   is not printed on the certificate, it is left out, not guessed.
   ============================================================ */

/**
 * @typedef {"certification"|"competition"|"academic"} CredentialGroup
 *
 * @typedef {Object} Provider
 * @property {string} name        Shown in type when there is no logo
 * @property {string} [logo]      Local SVG, only where the licence is clear
 * @property {string} [logoAlt]   e.g. "HackerRank logo"
 *
 * @typedef {Object} Credential
 * @property {string} title
 * @property {CredentialGroup} group
 * @property {Provider} provider
 * @property {string} [issuer]    Who signed or issued it, if not the provider
 * @property {string} [date]      As printed: "23 Aug 2026", "Feb 2025"
 * @property {string} [datetime]  Machine-readable date for <time>
 * @property {string} [id]        Credential or certificate number
 * @property {string[]} [ids]     Several IDs (one entry, several certificates)
 * @property {string} [verify]    Public verification URL
 * @property {string} summary     One line on what it covers
 * @property {string} file        Where the certificate lives locally
 */

/** @type {Credential[]} */
export const CREDENTIALS = [
  // ── Certifications ──────────────────────────────────────────
  {
    title: "Python (Basic)",
    group: "certification",
    provider: { name: "HackerRank", logo: "./Assets/logos/hackerrank.svg", logoAlt: "HackerRank logo" },
    date: "23 Aug 2026",
    datetime: "2026-08-23",
    id: "73DA1347AEC3",
    verify: "https://www.hackerrank.com/certificates/73da1347aec3",
    summary: "Passed HackerRank's timed Python skill certification test.",
    file: "James T/Certificate/python_certif.pdf",
  },
  {
    title: "Azure AI Fundamentals (AI-900T00-A)",
    group: "certification",
    provider: { name: "Microsoft Elevate" },
    issuer: "GreatNusa and BINUS University, with Microsoft Indonesia",
    date: "27 Mar 2026",
    datetime: "2026-03-27",
    id: "111541121815667/GreatNusa/III/2026",
    summary: "Fifteen hours of instructor-led Azure AI training, completed with a demonstration of learning.",
    file: "James T/Sem 4/ML/Microsoft Azure AI 900 Certificate - LT01 - James Tiono - 2802544406.pdf",
  },
  {
    title: "Self-Paced Azure AI Basic Fundamental",
    group: "certification",
    provider: { name: "Microsoft elevAIte" },
    issuer: "GreatNusa, with Microsoft and Komdigi",
    date: "23 Mar 2026",
    datetime: "2026-03-23",
    id: "6c73044e-582e-4876-a8c7-0e11c6f5747d",
    summary: "Self-paced introduction to Azure AI services, taken before the instructor-led course.",
    file: "James T/Sem 4/ML/Microsoft Azure Certificate - LT01 - James Tiono - 2802544406.pdf",
  },
  {
    title: "Databases for Developers",
    group: "certification",
    provider: { name: "Oracle Dev Gym" },
    issuer: "Oracle Corporation",
    summary: "Foundations and Next Level, both passed at 98%, taught by Chris Saxon; and Get Started with PL/SQL Table Functions at 100%, taught by Steven Feuerstein.",
    file: "James T/Certificate/SQL .pdf, SQL2.pdf, SQL3.pdf",
  },
  {
    title: "Beelingua English, CEFR C1.1 to C2.2",
    group: "certification",
    provider: { name: "Beelingua" },
    issuer: "BINUS University",
    date: "Feb 2025",
    datetime: "2025-02",
    ids: ["2025-C-NQ9RcqmmdyOOB", "2025-C-YccWT91SI03Nd", "2025-C-7U29e6zASwIVZ", "2025-C-c1ZS2totUeXCP"],
    summary: "Four verified certificates: Creative Writing (C1.1), Professional Office (C1.2), Advanced English (C2.1), and Market Research and Business Communication (C2.2).",
    file: "James T/Beelingua certificates/",
  },

  // ── Competitions and recognition ─────────────────────────────
  {
    title: "ASA DataFest BINUS 2026",
    group: "competition",
    provider: { name: "ASA DataFest" },
    issuer: "BINUS School of Computer Science",
    date: "6 May 2026",
    datetime: "2026-05-06",
    summary: "Certificate of participation, team PenjelajahSejarah, for a final project submitted before the deadline.",
    file: "Downloads/Certificate of Participation for PenjelajahSejarah - James Tiono.pdf",
  },
  {
    title: "Study2Challenge 2025, finalist",
    group: "competition",
    provider: { name: "BINUS Student Learning Community" },
    date: "Aug to Oct 2025",
    datetime: "2025-10",
    summary: "Finalist in “Bridging Global Problems: Tech for a Better Tomorrow”, a national competition for school and university students.",
    file: "James T/Certificate/James Tiono.png",
  },
  {
    title: "Duta Bahasa BINUS 2026, finalist",
    group: "competition",
    provider: { name: "BINUS University" },
    issuer: "Character Building Development Center",
    date: "12 Feb 2026",
    datetime: "2026-02-12",
    summary: "Finalist in the university’s language ambassador selection.",
    file: "James T/Certificate/Duta Bahasa.pdf",
  },

  // ── Academic record ─────────────────────────────────────────
  {
    title: "B.S. Computer Science",
    group: "academic",
    provider: { name: "BINUS University" },
    date: "In progress",
    summary: "Undergraduate, School of Computer Science. Coursework behind the projects above includes Machine Learning, Deep Learning and Text Mining.",
    file: "Existing site content; course codes in the project folders (Sem 4, Sem 5)",
  },
];

export const GROUPS = {
  certification: "Certifications",
  competition: "Competitions and recognition",
  academic: "Academic record",
};
