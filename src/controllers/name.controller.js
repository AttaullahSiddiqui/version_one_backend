import Name from '../models/name.model.js';
import httpError from '#utils/httpError.js';
import httpResponse from '#utils/httpResponse.js';

export default {
  getTrendingNames: async (req, res, next) => {
    try {
      const { limit = 20, gender, origin } = req.query;

      const query = {};
      if (gender) query.gender = gender;
      if (origin) query.origin = origin;

      const names = await Name.find(query)
        .sort({ 'popularity.trend': -1, 'popularity.score': -1 })
        .limit(Number(limit))
        .select('name meaning gender origin popularity');

      if (!names.length) {
        httpError(next, 'No trending names found', req, 404);
        return;
      }

      httpResponse(
        req,
        res,
        200,
        'Trending names retrieved successfully',
        names
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  searchNames: async (req, res, next) => {
    try {
      const {
        query,
        type = 'prefix',
        gender,
        origin,
        religion,
        minLength,
        maxLength,
        page = 1,
        limit = 20,
        sortBy = 'popularity',
      } = req.query;

      if (!query || query.length < 2) {
        httpError(next, 'Search query must be at least 2 characters', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      let searchQuery = {};

      // Build search query based on parameters
      if (type === 'prefix') {
        searchQuery.name = new RegExp(`^${query}`, 'i');
      } else if (type === 'suffix') {
        searchQuery.name = new RegExp(`${query}$`, 'i');
      } else if (type === 'contains') {
        searchQuery.name = new RegExp(query, 'i');
      } else {
        searchQuery.$text = { $search: query };
      }

      if (gender) searchQuery.gender = gender;
      if (origin) searchQuery.origin = origin;
      if (religion) searchQuery.religion = religion;
      if (minLength)
        searchQuery['metadata.length'] = { $gte: Number(minLength) };
      if (maxLength)
        searchQuery['metadata.length'] = {
          ...searchQuery['metadata.length'],
          $lte: Number(maxLength),
        };

      const sortOptions = {
        popularity: { 'popularity.score': -1 },
        name: { name: 1 },
        length: { 'metadata.length': 1 },
      };

      const [names, total] = await Promise.all([
        Name.find(searchQuery)
          .select('name meaning gender origin popularity metadata')
          .sort(sortOptions[sortBy] || sortOptions.popularity)
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(searchQuery),
      ]);

      if (!names.length) {
        httpError(next, 'No names found matching your criteria', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Search results retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  generateNames: async (req, res, next) => {
    try {
      const {
        parentNames,
        gender,
        religion,
        origin,
        characteristics,
        preferredLength,
        avoidLetters,
      } = req.body;

      // Complex name generation logic here
      const query = {
        gender: gender || { $in: ['boy', 'girl', 'unisex'] },
      };

      if (religion) query.religion = religion;
      if (origin) query.origin = origin;
      if (preferredLength) {
        query['metadata.length'] = {
          $gte: preferredLength - 1,
          $lte: preferredLength + 1,
        };
      }
      if (avoidLetters) {
        query.name = {
          $not: new RegExp(`^[${avoidLetters.join('')}]`),
        };
      }
      if (characteristics?.length) {
        query.characteristics = {
          $in: characteristics,
        };
      }

      const names = await Name.aggregate([
        { $match: query },
        { $sample: { size: 10 } },
        {
          $project: {
            name: 1,
            meaning: 1,
            gender: 1,
            origin: 1,
            characteristics: 1,
            score: { $add: ['$popularity.score', '$popularity.trend'] },
          },
        },
        { $sort: { score: -1 } },
      ]);

      httpResponse(
        req,
        res,
        200,
        'Name suggestions generated successfully',
        names
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getTopNames: async (req, res, next) => {
    try {
      const { gender, year = new Date().getFullYear() - 1 } = req.query;

      const query = gender ? { gender } : {};
      const names = await Name.find(query)
        .sort({ 'popularity.yearlyRanks': -1 })
        .limit(100)
        .select('name meaning gender popularity');

      if (!names.length) {
        httpError(next, 'No top names found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Top names retrieved successfully', names);
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByRegion: async (req, res, next) => {
    try {
      const { region } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!region) {
        httpError(next, 'Region is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { regions: region };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin regions')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by region retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByReligion: async (req, res, next) => {
    try {
      const { religion } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!religion) {
        httpError(next, 'Religion is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { religion };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin religion')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by religion retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNameMeaning: async (req, res, next) => {
    try {
      const { name } = req.params;

      if (!name) {
        httpError(next, 'Name is required', req, 400);
        return;
      }

      const nameData = await Name.findOne({
        name: new RegExp(`^${name}$`, 'i'),
      }).select('-popularity.yearlyRanks');

      if (!nameData) {
        httpError(next, 'Name not found', req, 404);
        return;
      }

      httpResponse(
        req,
        res,
        200,
        'Name meaning retrieved successfully',
        nameData
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByParents: async (req, res, next) => {
    try {
      const { motherName, fatherName, gender } = req.query;

      if (!motherName && !fatherName) {
        httpError(next, 'At least one parent name is required', req, 400);
        return;
      }

      const query = gender ? { gender } : {};
      let suggestedNames;

      if (motherName && fatherName) {
        // Complex logic for both parents' names
        const parentLetters = new Set([
          ...motherName.toLowerCase(),
          ...fatherName.toLowerCase(),
        ]);
        suggestedNames = await Name.find({
          ...query,
          name: {
            $regex: new RegExp(`[${Array.from(parentLetters).join('')}]`, 'i'),
          },
        }).limit(20);
      } else {
        // Logic for single parent name
        const parentName = motherName || fatherName;
        const firstLetter = parentName.charAt(0);
        suggestedNames = await Name.find({
          ...query,
          'metadata.firstLetter': new RegExp(firstLetter, 'i'),
        }).limit(20);
      }

      httpResponse(
        req,
        res,
        200,
        'Names suggestions retrieved successfully',
        suggestedNames
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByGender: async (req, res, next) => {
    try {
      const { gender } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!['boy', 'girl', 'unisex'].includes(gender)) {
        httpError(next, 'Invalid gender specified', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { gender };

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin popularity metadata')
          .sort('name')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      // Using model's instance method to verify suitability
      names.forEach(name => {
        name.isSuitableForGender(gender);
      });

      httpResponse(req, res, 200, 'Names by gender retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
  getNamesByLetter: async (req, res, next) => {
    try {
      const { letter } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!letter || letter.length !== 1) {
        httpError(next, 'Single letter is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { 'metadata.firstLetter': letter.toLowerCase() };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin')
          .sort('name')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by letter retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByLength: async (req, res, next) => {
    try {
      const { length } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!length || isNaN(length)) {
        httpError(next, 'Valid length number is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { 'metadata.length': Number(length) };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin')
          .sort('name')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by length retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByPopularity: async (req, res, next) => {
    try {
      const { year } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!year || isNaN(year)) {
        httpError(next, 'Valid year is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { 'popularity.yearlyRanks.year': Number(year) };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender popularity')
          .sort({ 'popularity.yearlyRanks.$': 1 })
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(
        req,
        res,
        200,
        'Names by popularity retrieved successfully',
        {
          names,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            hasMore: skip + names.length < total,
          },
        }
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByOrigin: async (req, res, next) => {
    try {
      const { origin } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (!origin) {
        httpError(next, 'Origin is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { origin: new RegExp(origin, 'i') };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select('name meaning gender origin')
          .sort('name')
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by origin retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  getNamesByNumerology: async (req, res, next) => {
    try {
      const { number } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!number || isNaN(number) || number < 1 || number > 9) {
        httpError(next, 'Valid numerology number (1-9) is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Using model's static method for numerology search
      const names = await Name.findByNumerology(number)
        .skip(skip)
        .limit(Number(limit));

      const total = await Name.countDocuments({
        'numerology.number': Number(number),
      });

      httpResponse(
        req,
        res,
        200,
        'Names by numerology retrieved successfully',
        {
          names,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            hasMore: skip + names.length < total,
          },
        }
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  // Admin routes
  getAllNames: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        order = 'desc',
        gender,
        origin,
        religion,
        searchQuery,
      } = req.query;

      const query = {};

      // Apply filters if provided
      if (gender) query.gender = gender;
      if (origin) query.origin = new RegExp(origin, 'i');
      if (religion) query.religion = religion;
      if (searchQuery) {
        query.$or = [
          { name: new RegExp(searchQuery, 'i') },
          { meaning: new RegExp(searchQuery, 'i') },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Determine sort order
      const sortOrder = {};
      sortOrder[sortBy] = order === 'desc' ? -1 : 1;

      const [names, total] = await Promise.all([
        Name.find(query)
          .select(
            'name meaning gender origin religion regions popularity createdAt'
          )
          .sort(sortOrder)
          .skip(skip)
          .limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  createName: async (req, res, next) => {
    try {
      const nameData = req.body;
      console.log(nameData);

      if (
        !nameData.name ||
        !nameData.meaning ||
        !nameData.gender ||
        !nameData.origin
      ) {
        httpError(next, 'Please provide required fields', req, 400);
        return;
      }

      try {
        const name = await Name.create(nameData);
        httpResponse(req, res, 201, 'Name created successfully', name);
      } catch (err) {
        if (err && err.code === 11000) {
          httpError(next, 'Name already exists', req, 409);
        } else {
          httpError(next, err, req, 400);
        }
      }
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  updateName: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If the name string is being changed, we must recalculate fields
      if (updateData.name) {
        // compute metadata
        const nameStr = updateData.name;
        updateData.metadata = {
          length: nameStr.length,
          firstLetter: nameStr.charAt(0).toLowerCase(),
          lastLetter: nameStr.charAt(nameStr.length - 1).toLowerCase(),
        };

        // compute letterAnalysis
        const vowels = (nameStr.match(/[aeiou]/gi) || []).length;
        const consonants = nameStr.length - vowels;

        // reuse small helper for letter nature (duplicate of model mapping)
        const letterNatureMap = {
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

        const getNature = ch =>
          letterNatureMap[ch.toLowerCase()] || {
            nature: 'unknown',
            element: 'unknown',
            ruling: 'unknown',
          };

        updateData.letterAnalysis = {
          vowels,
          consonants,
          firstLetter: getNature(nameStr.charAt(0)),
          lastLetter: getNature(nameStr.charAt(nameStr.length - 1)),
        };

        // calculate numerology
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

        let sum = 0;
        nameStr
          .toLowerCase()
          .split('')
          .forEach(letter => {
            if (numerologyMap[letter]) sum += numerologyMap[letter];
          });
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
          sum = String(sum)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0);
        }
        const numerologyTraits = {
          1: ['leader', 'independent', 'ambitious', 'original', 'confident'],
          2: [
            'diplomatic',
            'cooperative',
            'sensitive',
            'peaceful',
            'adaptable',
          ],
          3: ['creative', 'expressive', 'social', 'optimistic', 'artistic'],
          4: ['practical', 'reliable', 'stable', 'organized', 'determined'],
          5: [
            'adventurous',
            'freedom-loving',
            'versatile',
            'curious',
            'energetic',
          ],
          6: ['nurturing', 'responsible', 'loving', 'harmonious', 'supportive'],
          7: [
            'analytical',
            'spiritual',
            'intelligent',
            'mysterious',
            'intuitive',
          ],
          8: [
            'powerful',
            'successful',
            'ambitious',
            'material',
            'authoritative',
          ],
          9: ['compassionate', 'humanitarian', 'generous', 'wise', 'artistic'],
        };

        updateData.numerology = {
          number: sum,
          traits: numerologyTraits[sum] || [],
        };
      }

      // run update (validators on)
      const name = await Name.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!name) {
        httpError(next, 'Name not found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Name updated successfully', name);
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  deleteName: async (req, res, next) => {
    try {
      const { id } = req.params;
      const name = await Name.findByIdAndDelete(id);

      if (!name) {
        httpError(next, 'Name not found', req, 404);
        return;
      }

      httpResponse(req, res, 200, 'Name deleted successfully');
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  importNames: async (req, res, next) => {
    try {
      const { names } = req.body;

      if (!Array.isArray(names) || !names.length) {
        httpError(next, 'Valid names array is required', req, 400);
        return;
      }

      // Prepare documents with metadata, letterAnalysis and numerology because insertMany bypasses save hooks
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
        5: [
          'adventurous',
          'freedom-loving',
          'versatile',
          'curious',
          'energetic',
        ],
        6: ['nurturing', 'responsible', 'loving', 'harmonious', 'supportive'],
        7: [
          'analytical',
          'spiritual',
          'intelligent',
          'mysterious',
          'intuitive',
        ],
        8: ['powerful', 'successful', 'ambitious', 'material', 'authoritative'],
        9: ['compassionate', 'humanitarian', 'generous', 'wise', 'artistic'],
      };

      const letterNatureMap = {
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

      const processed = names.map(n => {
        const nameStr = (n.name || '').trim();
        const metadata = {
          length: nameStr.length,
          firstLetter: nameStr.charAt(0).toLowerCase(),
          lastLetter: nameStr.charAt(nameStr.length - 1).toLowerCase(),
        };

        const vowels = (nameStr.match(/[aeiou]/gi) || []).length;
        const consonants = nameStr.length - vowels;

        const firstLetterNature = letterNatureMap[metadata.firstLetter] || {
          nature: 'unknown',
          element: 'unknown',
          ruling: 'unknown',
        };
        const lastLetterNature = letterNatureMap[metadata.lastLetter] || {
          nature: 'unknown',
          element: 'unknown',
          ruling: 'unknown',
        };

        let sum = 0;
        nameStr
          .toLowerCase()
          .split('')
          .forEach(ch => {
            if (numerologyMap[ch]) sum += numerologyMap[ch];
          });
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
          sum = String(sum)
            .split('')
            .reduce((a, b) => Number(a) + Number(b), 0);
        }

        return {
          ...n,
          metadata,
          letterAnalysis: {
            vowels,
            consonants,
            firstLetter: firstLetterNature,
            lastLetter: lastLetterNature,
          },
          numerology: { number: sum, traits: numerologyTraits[sum] || [] },
        };
      });

      const result = await Name.insertMany(processed, { ordered: false });

      httpResponse(req, res, 201, 'Names imported successfully', {
        imported: result.length,
        total: names.length,
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  updateTrendingNames: async (req, res, next) => {
    try {
      const { trends } = req.body;

      if (!Array.isArray(trends)) {
        httpError(next, 'Valid trends array is required', req, 400);
        return;
      }

      const updates = trends.map(({ nameId, trend }) => ({
        updateOne: {
          filter: { _id: nameId },
          update: { $set: { 'popularity.trend': trend } },
        },
      }));

      const result = await Name.bulkWrite(updates);

      httpResponse(req, res, 200, 'Trending names updated successfully', {
        modified: result.modifiedCount,
        total: trends.length,
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  getNamesByZodiac: async (req, res, next) => {
    try {
      const { sign } = req.params;
      const { page = 1, limit = 20, gender } = req.query;

      if (
        !sign ||
        ![
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
        ].includes(sign.toLowerCase())
      ) {
        httpError(next, 'Valid zodiac sign is required', req, 400);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const query = { 'zodiac.sign': sign.toLowerCase() };
      if (gender) query.gender = gender;

      const [names, total] = await Promise.all([
        Name.findByZodiac(sign).skip(skip).limit(Number(limit)),
        Name.countDocuments(query),
      ]);

      httpResponse(req, res, 200, 'Names by zodiac retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
  getNamesByElement: async (req, res, next) => {
    try {
      const { element } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!['fire', 'earth', 'air', 'water'].includes(element.toLowerCase())) {
        httpError(
          next,
          'Valid element (fire/earth/air/water) is required',
          req,
          400
        );
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const names = await Name.findByElement(element.toLowerCase())
        .skip(skip)
        .limit(Number(limit));

      const total = await Name.countDocuments({
        'zodiac.element': element.toLowerCase(),
      });

      httpResponse(req, res, 200, 'Names by element retrieved successfully', {
        names,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          hasMore: skip + names.length < total,
        },
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
  getLetterAnalysis: async (req, res, next) => {
    try {
      const { name } = req.params;

      const nameData = await Name.findOne({
        name: new RegExp(`^${name}$`, 'i'),
      }).select('name letterAnalysis zodiac');

      if (!nameData) {
        httpError(next, 'Name not found', req, 404);
        return;
      }

      httpResponse(
        req,
        res,
        200,
        'Letter analysis retrieved successfully',
        nameData
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  // Admin Panel Statistics
  getNameStatistics: async (req, res, next) => {
    try {
      const [
        totalNames,
        genderDistribution,
        originDistribution,
        lengthDistribution,
        popularityTrends,
      ] = await Promise.all([
        Name.countDocuments(),
        Name.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
        Name.aggregate([
          { $group: { _id: '$origin', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Name.aggregate([
          { $group: { _id: '$metadata.length', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Name.aggregate([
          { $sort: { 'popularity.score': -1 } },
          { $limit: 20 },
          {
            $project: {
              name: 1,
              trend: '$popularity.trend',
              score: '$popularity.score',
            },
          },
        ]),
      ]);

      httpResponse(req, res, 200, 'Name statistics retrieved successfully', {
        totalNames,
        genderDistribution,
        originDistribution,
        lengthDistribution,
        popularityTrends,
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  // Bulk Operations
  bulkUpdateNames: async (req, res, next) => {
    try {
      const { operations } = req.body;

      if (!Array.isArray(operations)) {
        httpError(next, 'Valid operations array is required', req, 400);
        return;
      }

      const bulkOps = operations.map(op => ({
        updateOne: {
          filter: { _id: op.nameId },
          update: { $set: op.updates },
          upsert: false,
        },
      }));

      const result = await Name.bulkWrite(bulkOps);

      httpResponse(req, res, 200, 'Bulk update completed successfully', {
        modified: result.modifiedCount,
        total: operations.length,
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  // Name Recommendations
  getSimilarNames: async (req, res, next) => {
    try {
      const { name } = req.params;
      const { limit = 10 } = req.query;

      const sourceName = await Name.findOne({
        name: new RegExp(`^${name}$`, 'i'),
      });

      if (!sourceName) {
        httpError(next, 'Name not found', req, 404);
        return;
      }

      const similarNames = await Name.aggregate([
        {
          $match: {
            _id: { $ne: sourceName._id },
            gender: sourceName.gender,
            $or: [
              { origin: sourceName.origin },
              { 'metadata.length': sourceName.metadata.length },
              { 'numerology.number': sourceName.numerology.number },
            ],
          },
        },
        { $sample: { size: Number(limit) } },
        {
          $project: {
            name: 1,
            meaning: 1,
            gender: 1,
            origin: 1,
            similarity: {
              $add: [
                { $cond: [{ $eq: ['$origin', sourceName.origin] }, 2, 0] },
                {
                  $cond: [
                    { $eq: ['$metadata.length', sourceName.metadata.length] },
                    1,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $eq: ['$numerology.number', sourceName.numerology.number],
                    },
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { similarity: -1 } },
      ]);

      httpResponse(
        req,
        res,
        200,
        'Similar names retrieved successfully',
        similarNames
      );
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },
};
