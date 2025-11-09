import mongoose from 'mongoose';

const nameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
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
    religion: {
      type: [{ type: String }],
      default: [],
      validate: {
        validator: function (arr) {
          return arr === undefined || (Array.isArray(arr) && arr.length <= 10);
        },
        message: 'Religion array cannot have more than 10 items',
      },
    },
    regions: {
      type: [{ type: String }],
      default: [],
      validate: {
        validator: function (arr) {
          return arr === undefined || (Array.isArray(arr) && arr.length <= 10);
        },
        message: 'Regions array cannot have more than 10 items',
      },
    },
    popularity: {
      score: {
        type: Number,
        default: 0,
      },
      trend: {
        type: Number,
        default: 0,
      },
      views: {
        type: Number,
        default: 0,
      },
      searchAppearances: {
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

function calculateNumerology(name) {
  const numerologyMap = {
    a: 1,
    j: 1,
    s: 1,
    b: 2,
    k: 2,
    t: 2,
    c: 3,
    l: 3,
    u: 3,
    d: 4,
    m: 4,
    v: 4,
    e: 5,
    n: 5,
    w: 5,
    f: 6,
    o: 6,
    x: 6,
    g: 7,
    p: 7,
    y: 7,
    h: 8,
    q: 8,
    z: 8,
    i: 9,
    r: 9,
  };

  const numerologyTraits = {
    1: ['leader', 'independent', 'ambitious', 'original', 'confident'],
    2: ['diplomatic', 'cooperative', 'sensitive', 'peaceful', 'adaptable'],
    3: ['creative', 'expressive', 'social', 'optimistic', 'artistic'],
    4: ['practical', 'reliable', 'stable', 'organized', 'determined'],
    5: ['adventurous', 'freedom-loving', 'versatile', 'curious', 'energetic'],
    6: ['nurturing', 'responsible', 'loving', 'harmonious', 'supportive'],
    7: ['analytical', 'spiritual', 'intelligent', 'mysterious', 'intuitive'],
    8: ['powerful', 'successful', 'ambitious', 'material', 'authoritative'],
    9: ['compassionate', 'humanitarian', 'generous', 'wise', 'artistic'],
  };

  let sum = 0;
  name
    .toLowerCase()
    .split('')
    .forEach(letter => {
      if (numerologyMap[letter]) {
        sum += numerologyMap[letter];
      }
    });

  // Reduce to single digit (except 11, 22, 33 which are master numbers)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum)
      .split('')
      .reduce((a, b) => Number(a) + Number(b), 0);
  }

  return {
    number: sum,
    traits: numerologyTraits[sum] || [],
  };
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

nameSchema.pre('save', function (next) {
  try {
    // Validate name
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }

    // Remove extra spaces and special characters
    const cleanName = this.name.trim().replace(/\s+/g, ' ');

    // Generate slug
    this.slug = generateSlug(cleanName);

    this.metadata = {
      length: cleanName.length,
      firstLetter: cleanName.charAt(0).toLowerCase(),
      lastLetter: cleanName.charAt(cleanName.length - 1).toLowerCase(),
    };

    // Calculate letter analysis
    const vowels = (cleanName.match(/[aeiou]/gi) || []).length;
    const consonants = cleanName.length - vowels;

    this.letterAnalysis = {
      vowels,
      consonants,
      firstLetter: getLetterNature(cleanName.charAt(0)),
      lastLetter: getLetterNature(cleanName.charAt(cleanName.length - 1)),
    };

    // Calculate numerology
    this.numerology = calculateNumerology(cleanName);

    next();
  } catch (error) {
    next(error);
  }
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

// Using sparse indexes for the array fields
nameSchema.index({ religion: 1 }, { sparse: true, background: true });
nameSchema.index({ regions: 1 }, { sparse: true, background: true });

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
    c: { nature: 'emotional', element: 'water', ruling: 'moon' },
    d: { nature: 'practical', element: 'earth', ruling: 'mars' },
    e: { nature: 'intellectual', element: 'air', ruling: 'venus' },
    f: { nature: 'adaptable', element: 'fire', ruling: 'mercury' },
    g: { nature: 'mysterious', element: 'water', ruling: 'neptune' },
    h: { nature: 'material', element: 'earth', ruling: 'saturn' },
    i: { nature: 'spiritual', element: 'fire', ruling: 'sun' },
    j: { nature: 'powerful', element: 'fire', ruling: 'jupiter' },
    k: { nature: 'dramatic', element: 'fire', ruling: 'mars' },
    l: { nature: 'artistic', element: 'air', ruling: 'venus' },
    m: { nature: 'emotional', element: 'water', ruling: 'moon' },
    n: { nature: 'creative', element: 'water', ruling: 'neptune' },
    o: { nature: 'practical', element: 'earth', ruling: 'saturn' },
    p: { nature: 'mental', element: 'air', ruling: 'uranus' },
    q: { nature: 'mysterious', element: 'water', ruling: 'pluto' },
    r: { nature: 'dynamic', element: 'fire', ruling: 'sun' },
    s: { nature: 'emotional', element: 'water', ruling: 'moon' },
    t: { nature: 'creative', element: 'earth', ruling: 'mars' },
    u: { nature: 'intuitive', element: 'water', ruling: 'jupiter' },
    v: { nature: 'spiritual', element: 'air', ruling: 'mercury' },
    w: { nature: 'sensitive', element: 'water', ruling: 'uranus' },
    x: { nature: 'magnetic', element: 'fire', ruling: 'uranus' },
    y: { nature: 'intuitive', element: 'air', ruling: 'venus' },
    z: { nature: 'mystical', element: 'water', ruling: 'pluto' },
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
