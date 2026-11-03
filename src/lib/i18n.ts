export type Lang = "en" | "hi" | "kn";

export const LANGUAGES: { value: Lang; label: string; speech: string }[] = [
  { value: "en", label: "English", speech: "en-IN" },
  { value: "hi", label: "हिंदी (Hindi)", speech: "hi-IN" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)", speech: "kn-IN" },
];

export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  hi: "Hindi",
  kn: "Kannada",
};

export function speechLocale(lang: Lang) {
  return LANGUAGES.find((l) => l.value === lang)?.speech ?? "en-IN";
}

type Dict = {
  greeting: string;
  statsLine: (checked: number, scams: number) => string;
  checkInTitle: string;
  checkInBody: string;
  checkInButton: string;
  checkInDone: string;
  checkInDoneBody: string;
  checkerTitle: string;
  checkerBody: string;
  checkerPlaceholder: string;
  checkerButton: string;
  checkerWorking: string;
  attachImage: string;
  removeImage: string;
  redFlags: string;
  whatToDo: string;
  checkAnother: string;
  voiceTitle: string;
  voiceBody: string;
  voiceStart: string;
  voiceListening: string;
  voiceThinking: string;
  voiceUnsupported: string;
  safetyCodeLabel: string;
  safetyCodeHelp: string;
  signOut: string;
  verdictScam: string;
  verdictSafe: string;
  verdictUnsure: string;
};

export const T: Record<Lang, Dict> = {
  en: {
    greeting: "Hello",
    statsLine: (checked, scams) =>
      `So far: ${checked} ${checked === 1 ? "message" : "messages"} checked · ${scams} ${scams === 1 ? "scam" : "scams"} caught`,
    checkInTitle: "Today",
    checkInBody: "Let your family know your day is going fine.",
    checkInButton: "I'm okay today",
    checkInDone: "Thank you.",
    checkInDoneBody: "Your family can see you're doing okay today.",
    checkerTitle: "Is this message real?",
    checkerBody: "Paste a message you received, or add a picture of it. Nothing is shared with anyone.",
    checkerPlaceholder: "Paste the message here…",
    checkerButton: "Check this message",
    checkerWorking: "Reading the message…",
    attachImage: "Add a picture instead",
    removeImage: "Remove picture",
    redFlags: "What looks wrong",
    whatToDo: "What to do",
    checkAnother: "Check another message",
    voiceTitle: "Ask a question out loud",
    voiceBody: "Press the button and speak. You'll get a short answer, read aloud.",
    voiceStart: "Press and speak",
    voiceListening: "Listening…",
    voiceThinking: "Thinking…",
    voiceUnsupported: "Speaking isn't available in this browser. You can still type your question.",
    safetyCodeLabel: "Your safety code",
    safetyCodeHelp: "Read this out to family so they can watch over your account.",
    signOut: "Sign out",
    verdictScam: "This looks like a scam",
    verdictSafe: "This looks safe",
    verdictUnsure: "Not certain about this one",
  },
  hi: {
    greeting: "नमस्ते",
    statsLine: (checked, scams) => `अब तक: ${checked} संदेश जाँचे · ${scams} धोखे पकड़े गए`,
    checkInTitle: "आज",
    checkInBody: "परिवार को बता दें कि आपका दिन ठीक चल रहा है।",
    checkInButton: "मैं आज ठीक हूँ",
    checkInDone: "धन्यवाद।",
    checkInDoneBody: "आपका परिवार देख सकता है कि आज आप ठीक हैं।",
    checkerTitle: "क्या यह संदेश असली है?",
    checkerBody: "मिला हुआ संदेश यहाँ चिपकाएँ, या उसकी तस्वीर जोड़ें। यह किसी को नहीं दिखाया जाता।",
    checkerPlaceholder: "संदेश यहाँ चिपकाएँ…",
    checkerButton: "यह संदेश जाँचें",
    checkerWorking: "संदेश पढ़ा जा रहा है…",
    attachImage: "इसके बजाय तस्वीर जोड़ें",
    removeImage: "तस्वीर हटाएँ",
    redFlags: "क्या गलत लग रहा है",
    whatToDo: "क्या करें",
    checkAnother: "दूसरा संदेश जाँचें",
    voiceTitle: "बोलकर सवाल पूछें",
    voiceBody: "बटन दबाएँ और बोलें। छोटा जवाब मिलेगा, जो पढ़कर सुनाया जाएगा।",
    voiceStart: "दबाएँ और बोलें",
    voiceListening: "सुन रहे हैं…",
    voiceThinking: "सोच रहे हैं…",
    voiceUnsupported: "इस ब्राउज़र में बोलना उपलब्ध नहीं है। आप सवाल लिख भी सकते हैं।",
    safetyCodeLabel: "आपका सुरक्षा कोड",
    safetyCodeHelp: "यह परिवार को बता दें, जिससे वे आपके खाते का ध्यान रख सकें।",
    signOut: "साइन आउट",
    verdictScam: "यह धोखा लगता है",
    verdictSafe: "यह सुरक्षित लगता है",
    verdictUnsure: "इसके बारे में पक्का नहीं है",
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ",
    statsLine: (checked, scams) => `ಇದುವರೆಗೆ: ${checked} ಸಂದೇಶ ಪರಿಶೀಲಿಸಲಾಗಿದೆ · ${scams} ವಂಚನೆ ಪತ್ತೆಯಾಗಿದೆ`,
    checkInTitle: "ಇಂದು",
    checkInBody: "ನಿಮ್ಮ ದಿನ ಚೆನ್ನಾಗಿದೆ ಎಂದು ಕುಟುಂಬಕ್ಕೆ ತಿಳಿಸಿ.",
    checkInButton: "ನಾನು ಇಂದು ಚೆನ್ನಾಗಿದ್ದೇನೆ",
    checkInDone: "ಧನ್ಯವಾದ.",
    checkInDoneBody: "ಇಂದು ನೀವು ಚೆನ್ನಾಗಿದ್ದೀರಿ ಎಂದು ಕುಟುಂಬ ನೋಡಬಹುದು.",
    checkerTitle: "ಈ ಸಂದೇಶ ನಿಜವೇ?",
    checkerBody: "ಬಂದ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ, ಅಥವಾ ಅದರ ಚಿತ್ರ ಸೇರಿಸಿ. ಇದನ್ನು ಯಾರಿಗೂ ತೋರಿಸುವುದಿಲ್ಲ.",
    checkerPlaceholder: "ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಅಂಟಿಸಿ…",
    checkerButton: "ಈ ಸಂದೇಶವನ್ನು ಪರಿಶೀಲಿಸಿ",
    checkerWorking: "ಸಂದೇಶ ಓದುತ್ತಿದ್ದೇವೆ…",
    attachImage: "ಬದಲಿಗೆ ಚಿತ್ರ ಸೇರಿಸಿ",
    removeImage: "ಚಿತ್ರ ತೆಗೆದುಹಾಕಿ",
    redFlags: "ಏನು ತಪ್ಪಾಗಿ ಕಾಣುತ್ತಿದೆ",
    whatToDo: "ಏನು ಮಾಡಬೇಕು",
    checkAnother: "ಇನ್ನೊಂದು ಸಂದೇಶ ಪರಿಶೀಲಿಸಿ",
    voiceTitle: "ಮಾತನಾಡಿ ಪ್ರಶ್ನೆ ಕೇಳಿ",
    voiceBody: "ಬಟನ್ ಒತ್ತಿ ಮಾತನಾಡಿ. ಸಣ್ಣ ಉತ್ತರ ಸಿಗುತ್ತದೆ, ಓದಿ ಹೇಳಲಾಗುತ್ತದೆ.",
    voiceStart: "ಒತ್ತಿ ಮಾತನಾಡಿ",
    voiceListening: "ಕೇಳುತ್ತಿದ್ದೇವೆ…",
    voiceThinking: "ಯೋಚಿಸುತ್ತಿದ್ದೇವೆ…",
    voiceUnsupported: "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾತನಾಡುವ ಸೌಲಭ್ಯ ಇಲ್ಲ. ನೀವು ಪ್ರಶ್ನೆ ಬರೆಯಬಹುದು.",
    safetyCodeLabel: "ನಿಮ್ಮ ಸುರಕ್ಷತಾ ಕೋಡ್",
    safetyCodeHelp: "ಇದನ್ನು ಕುಟುಂಬಕ್ಕೆ ಹೇಳಿ, ಅವರು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಗಮನಿಸಬಹುದು.",
    signOut: "ಸೈನ್ ಔಟ್",
    verdictScam: "ಇದು ವಂಚನೆ ಎನಿಸುತ್ತದೆ",
    verdictSafe: "ಇದು ಸುರಕ್ಷಿತ ಎನಿಸುತ್ತದೆ",
    verdictUnsure: "ಇದರ ಬಗ್ಗೆ ಖಚಿತವಿಲ್ಲ",
  },
};

export function t(lang: Lang) {
  return T[lang] ?? T.en;
}
