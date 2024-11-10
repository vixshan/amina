import mongoose from 'mongoose'

// Define type-safe constants and types
const RATINGS = ['PG', 'PG-13', 'PG-16', 'R'] as const
type Rating = (typeof RATINGS)[number]

const CATEGORIES = ['dare', 'paranoia', 'nhie', 'wyr', 'hye', 'wwyd'] as const
type Category = (typeof CATEGORIES)[number]

const PREFIX_MAP: Record<Category, string> = {
  dare: 'D',
  paranoia: 'P',
  nhie: 'NHIE',
  wyr: 'WYR',
  hye: 'HYE',
  wwyd: 'WWYD',
}

const reqString = {
  type: String,
  required: true,
}

// Define interface for the document
interface Question {
  category: Category
  questionId: string
  question: string
  rating: Rating
}

const Schema = new mongoose.Schema<Question>({
  category: {
    ...reqString,
    enum: CATEGORIES,
  },
  questionId: reqString,
  question: reqString,
  rating: {
    type: String,
    required: true,
    enum: RATINGS,
  },
})

const Model = mongoose.model<Question>('tod', Schema)

// Type-safe function parameters
interface GetQuestionsParams {
  limit?: number
  category?: Category | 'random'
  age?: number
  requestedRating?: Rating | null
}

export const TruthOrDare = {
  model: Model,

  addQuestion: async (category: Category, question: string, rating: Rating) => {
    const latestQuestion = await Model.findOne({ category }).sort({
      questionId: -1,
    })

    let questionId = 'T1'

    // Now TypeScript knows category is a valid key for PREFIX_MAP
    questionId = `${PREFIX_MAP[category]}1`

    if (latestQuestion) {
      const latestQuestionId = latestQuestion.questionId
      const idParts = latestQuestionId.split(/(\d+)/)
      const currentNumber = parseInt(idParts[1])
      questionId = idParts[0] + (currentNumber + 1)
    }

    const data = new Model({
      category,
      questionId,
      question,
      rating,
    })

    await data.save()
    return 'Question added successfully!'
  },

  getQuestions: async ({
    limit = 10,
    category = 'random',
    age = 13,
    requestedRating = null,
  }: GetQuestionsParams = {}) => {
    // Get allowed ratings based on age
    const allowedRatings = getAllowedRatings(age)

    // If a specific rating is requested, check if it's allowed
    if (requestedRating && !allowedRatings.includes(requestedRating)) {
      return [] // Return empty if requested rating isn't allowed for user's age
    }

    const matchStage: mongoose.PipelineStage.Match = {
      $match: {
        // If specific rating requested, use it; otherwise use all allowed ratings
        rating: requestedRating ? requestedRating : { $in: allowedRatings },
        ...(category !== 'random' ? { category } : {}),
      },
    }

    const aggregate: mongoose.PipelineStage[] = [matchStage]

    // Add random sampling
    aggregate.push({
      $sample: { size: limit },
    } as mongoose.PipelineStage.Sample)

    const questions = await Model.aggregate(aggregate)
    return questions
  },

  deleteQuestion: async (questionId: string) => {
    const normalizedId = questionId.toUpperCase()

    const question = await Model.findOne({
      questionId: { $regex: new RegExp(`^${normalizedId}$`, 'i') },
    })

    if (!question) {
      throw new Error(`Question with ID ${normalizedId} not found`)
    }

    await Model.deleteOne({ _id: question._id })
    return {
      category: question.category,
      questionId: question.questionId,
      question: question.question,
      rating: question.rating,
    }
  },

  getQuestionById: async (questionId: string): Promise<Question> => {
    const question = await Model.findOne({ questionId })
    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`)
    }
    return question
  },
}

function getAllowedRatings(age: number): Rating[] {
  if (age >= 18) return ['PG', 'PG-13', 'PG-16', 'R']
  if (age >= 16) return ['PG', 'PG-13', 'PG-16']
  if (age >= 13) return ['PG', 'PG-13']
  return ['PG']
}

export default TruthOrDare
