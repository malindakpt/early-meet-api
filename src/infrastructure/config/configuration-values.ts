export const configurationValues = {
  assessmentAreaGeneration: {
    maxConcurrentGenerations: 2,
    questionsPerArea: 5,
  },
  technicalQuestionGeneration: {
    preferredQuestionsPerTechnology: 1,
    requiredQuestionsPerTechnology: 3,
  },
  openAi: {
    maxRetries: 2,
  },
} as const;
