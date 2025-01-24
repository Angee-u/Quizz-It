import express from "express"
import axios from "axios"
import he from "he"
import bodyParser from "body-parser";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config()
const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static("public"))

const sessionSecret = process.env.SESSION_SECRET

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
}))

function shuffleAnswers(answers) {
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]]
  }

  return answers
}

app.get("/", async (req, res) => {  
  res.render("index.ejs")
})

app.post("/start-game", async (req, res) => {
  try {
    const selectedCategory = req.body.category;

    const API = `https://opentdb.com/api.php?amount=10&category=${selectedCategory}&type=multiple`
    
    const apiResponse = await axios.get(API)
    const questions = apiResponse.data.results.map(question => {
    
      const decodedQuestion = he.decode(question.question)
      const decodedCorrectAnswer = he.decode(question.correct_answer)
      const decodedIncorrectAnswers = question.incorrect_answers.map(answer => he.decode(answer))

      const unitedAnswers = [decodedCorrectAnswer, ... decodedIncorrectAnswers]
      const shuffledAnswers = shuffleAnswers(unitedAnswers)

      
      return {
        question: decodedQuestion,
        answers: shuffledAnswers,
        correct: decodedCorrectAnswer
      }
    })

    req.session.questions = questions
    const frontQuestions = questions.map(({question, answers}) => ({question, answers}))
    res.render("game.ejs", { questions: frontQuestions });
    
  } catch (error) {
    console.error("Erro ao iniciar:", error)
    res.status(500).send("Error, try later.")
  }
})

app.post("/result-game", async (req, res) => {
  const userAnswers = req.body.answers
  const correctAnswers = req.session.questions.map(q => q.correct)
  const totalQuestions = correctAnswers.length

  let correctAnswersCount = 0

  userAnswers.forEach((answer, index) => {

    const fixedAnswer = answer.trim()

    if (fixedAnswer === correctAnswers[index]) {
      correctAnswersCount++
    }
  })

  req.session.userAnswers = userAnswers
  req.session.correctAnswers = correctAnswers
  req.session.totalQuestions = totalQuestions
 
  res.json({
    correctAnswers: correctAnswersCount,
    totalQuestions
  })
})

app.post("/result-quizz", (req, res) => {
  const { userAnswers } = req.body
  const sessionQuestions = req.session.questions

  const questionsWithAnswers = sessionQuestions.map((q) => ({
    question: q.question,
    answers: q.answers,
    correct: q.correct
  }));

  req.session.userAnswers = userAnswers
  req.session.correctAnswers = sessionQuestions.map(q => q.correct)
  req.session.questions = questionsWithAnswers

  res.json({
    userAnswers,
    correctAnswers: req.session.correctAnswers,
    questions: questionsWithAnswers
  })
})

app.get("/result-quizz", (req, res) => {
  const { userAnswers, correctAnswers, questions } = req.session

  if (!userAnswers || !correctAnswers || !questions) {
    return res.status(400).send("Data missing, try later.")
  }

  let correctCount = 0;
  userAnswers.forEach((answer, index) => {
    if(answer.trim() === correctAnswers[index].trim()) {
      correctCount++
    }
  })

  res.render("result-quizz.ejs", {
    userAnswers,
    correctAnswers,
    questions,
    correctCount,
    totalQuestions: questions.length
  })
})

app.listen(port, () => {
  console.log(`Server running on port ${3000}.`)
})