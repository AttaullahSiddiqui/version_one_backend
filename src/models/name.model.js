import mongoose from 'mongoose';

const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
    },
    meaning: {
      type: String,
      required: [true, 'Meaning is required'],
    },
    gender: {
      type: String,
      enum: ['boy', 'girl', 'unisex'],
      required: true,
    },
    numerology: {
      number: Number,
      traits: [String],
    },
    origin: {
      type: String,
      required: true,
    },
    religion: [
      {
        type: String,
      },
    ],
    regions: [
      {
        type: String,
      },
    ],
    popularity: {
      score: {
        type: Number,
        default: 0,
      },
      trend: {
        type: Number,
        default: 0,
      },
    },
    metadata: {
      length: Number,
      firstLetter: String,
      lastLetter: String,
    },
    zodiac: {
      sign: {
        type: String,
        enum: [
          'aries',
          'taurus',
          'gemini',
          'cancer',
          'leo',
          'virgo',
          'libra',
          'scorpio',
          'sagittarius',
          'capricorn',
          'aquarius',
          'pisces',
        ],
      },
      qualities: [String],
      element: {
        type: String,
        enum: ['fire', 'earth', 'air', 'water'],
      },
    },

    letterAnalysis: {
      vowels: Number,
      consonants: Number,
      firstLetter: {
        nature: String,
        element: String,
        ruling: String,
      },
      lastLetter: {
        nature: String,
        element: String,
        ruling: String,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Document middleware
nameSchema.pre('save', function (next) {
  this.metadata = {
    length: this.name.length,
    firstLetter: this.name.charAt(0).toLowerCase(),
    lastLetter: this.name.charAt(this.name.length - 1).toLowerCase(),
  };

  // Calculate letter analysis
  const vowels = (this.name.match(/[aeiou]/gi) || []).length;
  const consonants = this.name.length - vowels;

  this.letterAnalysis = {
    vowels,
    consonants,
    firstLetter: getLetterNature(this.name.charAt(0)),
    lastLetter: getLetterNature(this.name.charAt(this.name.length - 1)),
  };
  next();
});

// Instance methods
nameSchema.methods.isSuitableForGender = function (gender) {
  return this.gender === gender || this.gender === 'unisex';
};

// Static methods
nameSchema.statics.findByNumerology = function (number) {
  return this.find({ 'numerology.number': number }).select(
    'name meaning numerology'
  );
};

nameSchema.statics.findByZodiac = function (sign) {
  return this.find({ 'zodiac.sign': sign }).select(
    'name meaning zodiac letterAnalysis'
  );
};

nameSchema.statics.findByElement = function (element) {
  return this.find({ 'zodiac.element': element }).select('name meaning zodiac');
};

// Indexes
nameSchema.index({ name: 1 }, { unique: true, background: true });

nameSchema.index(
  {
    gender: 1,
    origin: 1,
    'metadata.length': 1,
  },
  { background: true }
);

nameSchema.index(
  {
    name: 'text',
    meaning: 'text',
  },
  {
    background: true,
    weights: {
      name: 2,
      meaning: 1,
    },
  }
);

nameSchema.index(
  {
    religion: 1,
    regions: 1,
  },
  { background: true }
);

nameSchema.index(
  {
    'zodiac.sign': 1,
    'zodiac.element': 1,
  },
  { background: true }
);

function getLetterNature(letter) {
  const letterMap = {
    a: { nature: 'spiritual', element: 'air', ruling: 'sun' },
    b: { nature: 'practical', element: 'earth', ruling: 'mercury' },
    // Add more letter mappings...
  };

  return (
    letterMap[letter.toLowerCase()] || {
      nature: 'unknown',
      element: 'unknown',
      ruling: 'unknown',
    }
  );
}

const Name = mongoose.model('Name', nameSchema);

export default Name;
