
document.addEventListener("DOMContentLoaded", () => {
  startGame()
})

let actualQuestion = 0
let totalQuestions = document.querySelectorAll(".question-container").length
let userAnswers = []

function startGame() {
  const nextButton = document.getElementById("next-question")
  nextButton.addEventListener("click", showNextQuestion)
  nextButton.disabled = true

  showQuestion(actualQuestion)
}

function showQuestion(index) {
  const questions = document.querySelectorAll(".question-container")

  questions.forEach((question, i) => {
    question.classList.toggle("active", i === index);
  })

  const answersButtons = questions[index].querySelectorAll(".btn-answer")
  answersButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectAnswer(button, index)
    })
  })
}

function selectAnswer(button, answer) {
  const questionContainer = document.querySelectorAll(".question-container")[answer]

  const answersButtons = questionContainer.querySelectorAll(".btn-answer")

  answersButtons.forEach(btnAnswer => btnAnswer.classList.remove("selected"))
  button.classList.add("selected")

  const nextButton = document.getElementById("next-question")
  nextButton.disabled = false

  const selectedAnswer = button.textContent;
  userAnswers[answer] = selectedAnswer;
}

function showNextQuestion() {
  actualQuestion++

  if (actualQuestion < totalQuestions) {
    showQuestion(actualQuestion)

    const nextButton = document.getElementById("next-question")
    nextButton.disabled = true
  } else {
    submitAnswers(userAnswers, totalQuestions, questions)
  }
}

async function submitAnswers(answers, totalQuestions, questions) {
  try {
    const response = await fetch("/result-game", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({answers})
    })

    if (!response.ok) {
      throw new Error("Erro no response")
    }

    const resultQuizz = await fetch("/result-quizz", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAnswers: answers, questions })
    })

    if(!resultQuizz.ok) {
      throw new Error("Erro no resultado do quizz")
    }

    window.location.href = "/result-quizz";
    
    } catch (error) {
      console.error("Erro no catch", error)
      alert("Revisar o Submit")
    }
}