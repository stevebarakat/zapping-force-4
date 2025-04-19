export interface DrumPattern {
  name: string;
  pattern: {
    [key: string]: boolean[];
  };
  bpm: number;
  shuffle?: number; // Shuffle amount (0-1)
  timeSignature?: "4/4" | "12/8" | "3/4";
  disableShuffle?: boolean; // Flag to disable shuffle
}

export const drumPatterns: DrumPattern[] = [
  {
    name: "Rock",
    bpm: 80,
    pattern: {
      kick: [true, false, true, false, true, false, true, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Funk",
    bpm: 100,
    pattern: {
      kick: [true, true, false, false, false, true, false, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "House",
    bpm: 123,
    pattern: {
      kick: [true, false, false, false, true, false, false, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, true, false, true, false, true, false, true],
    },
  },
  {
    name: "Trap",
    bpm: 130,
    pattern: {
      kick: [true, false, false, true, false, false, true, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, true, false, true, false, true, false, true],
    },
  },
  {
    name: "Shuffle",
    bpm: 90,
    timeSignature: "12/8",
    pattern: {
      kick: [
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
      ],
      snare: [
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
      ],
      hh: [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ],
      clap: [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ],
    },
  },
  {
    name: "Waltz",
    bpm: 80,
    timeSignature: "3/4",
    pattern: {
      kick: [true, false, false, true, false, false, true, false, false],
      snare: [false, true, true, false, true, true, false, true, true],
      hh: [true, true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false, false],
    },
    disableShuffle: true,
  },
  {
    name: "Rhumba",
    bpm: 120,
    pattern: {
      kick: [true, false, false, false, true, false, false, false],
      snare: [false, false, true, false, false, false, true, false],
      hh: [true, false, true, false, true, false, true, false],
      clap: [false, true, false, true, false, true, false, true],
    },
  },

  {
    name: "Tango",
    bpm: 120,
    pattern: {
      kick: [true, false, false, true, false, false, true, false],
      snare: [false, true, true, false, true, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Beguine",
    bpm: 110,
    pattern: {
      kick: [true, false, false, true, true, false, false, true],
      snare: [false, true, true, false, false, true, true, false],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, true, false, false, false, true, false],
    },
  },
  {
    name: "Calypso",
    bpm: 128,
    pattern: {
      kick: [true, false, false, true, false, false, true, false],
      snare: [false, true, false, false, true, false, false, true],
      hh: [true, false, true, false, true, false, true, false],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Mambo",
    bpm: 180,
    pattern: {
      kick: [true, false, false, true, true, false, true, false],
      snare: [false, true, true, false, false, true, false, true],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Merengue",
    bpm: 130,
    pattern: {
      kick: [true, false, false, true, false, false, true, true],
      snare: [false, true, true, false, true, true, false, false],
      hh: [true, false, true, false, true, false, true, false],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Bossanova",
    bpm: 140,
    pattern: {
      kick: [true, false, true, false, true, false, true, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, true, false, true, true, false, true, true],
      clap: [false, false, true, false, false, true, false, false],
    },
  },
  {
    name: "Cha Cha Cha",
    bpm: 120,
    pattern: {
      kick: [true, false, true, false, true, false, true, false],
      snare: [false, true, false, true, false, true, false, true],
      hh: [true, false, false, true, true, false, false, true],
      clap: [false, false, false, false, false, false, false, false],
    },
  },
  {
    name: "Brazilian Samba",
    bpm: 100,
    pattern: {
      kick: [true, false, false, false, true, false, false, false],
      snare: [true, false, false, true, false, true, false, false],
      hh: [true, true, true, true, true, true, true, true],
      clap: [false, false, true, false, false, false, true, false],
    },
  },
  {
    name: "Traditional Samba",
    bpm: 108,
    pattern: {
      kick: [true, false, false, true, false, false, true, false],
      snare: [false, true, false, false, true, false, false, true],
      hh: [true, true, false, true, true, false, true, true],
      clap: [false, false, true, false, false, true, false, false],
    },
  },
];
