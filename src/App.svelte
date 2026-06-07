<script lang="ts">
  import { onMount } from "svelte";
  import questionsData from "./lib/questions.json";

  // Interfaces
  interface Option {
    id: number;
    text: string;
  }

  interface Question {
    id: string;
    text: string;
    options: Option[];
    correctAnswer: number;
  }

  interface Section {
    id: string;
    title: string;
    questions: Question[];
  }

  interface PracticeQuestion extends Question {
    shuffledOptions: Option[];
    userAnswer: number | null; // 1-based index from the original option list
    sectionTitle: string;
    checked: boolean;
  }

  // Cast JSON data
  const sections = questionsData as Section[];

  // Option Labels
  const optionLabels = ["A", "B", "C", "D"];

  // State using Svelte 5 Runes
  let appState = $state<"setup" | "practicing" | "review">("setup");
  let selectedSections = $state<Record<string, boolean>>({});
  let questionLimit = $state<number>(0); // 0 means all questions
  let sessionQuestions = $state<PracticeQuestion[]>([]);
  let activeQuestionIndex = $state<number>(0);

  // Score stats (derived in Svelte 5)
  const totalQuestionsCount = $derived(sessionQuestions.length);
  const correctAnswersCount = $derived(
    sessionQuestions.filter((q) => q.userAnswer === q.correctAnswer).length,
  );
  const answeredCount = $derived(
    sessionQuestions.filter((q) => q.userAnswer !== null).length,
  );
  const scorePercentage = $derived(
    totalQuestionsCount > 0
      ? Math.round((correctAnswersCount / totalQuestionsCount) * 100 * 10) / 10
      : 0,
  );

  // Initialize all sections as selected by default
  onMount(() => {
    sections.forEach((sec) => {
      selectedSections[sec.id] = true;
    });
  });

  // Helper function to shuffle array
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Select/Deselect All sections
  function toggleAllSections(select: boolean) {
    sections.forEach((sec) => {
      selectedSections[sec.id] = select;
    });
  }

  // Get display text for feedback
  function getScoreMessage(pct: number): string {
    if (pct === 100) return "Xuất sắc! Bạn đã trả lời đúng tất cả các câu hỏi.";
    if (pct >= 80) return "Rất tốt! Bạn đã nắm chắc kiến thức chuyên đề.";
    if (pct >= 50)
      return "Đạt! Bạn nên ôn tập lại thêm để đạt điểm số cao hơn.";
    return "Chưa đạt! Bạn cần đọc kỹ lại tài liệu và làm lại bài thi ôn tập.";
  }

  // Start practicing
  function startTest() {
    const selectedSecIds = Object.keys(selectedSections).filter(
      (id) => selectedSections[id],
    );
    const selectedSecs = sections.filter((sec) =>
      selectedSecIds.includes(sec.id),
    );

    if (selectedSecs.length === 0) {
      alert("Vui lòng chọn ít nhất một chuyên đề để bắt đầu ôn tập!");
      return;
    }

    let questionsList: PracticeQuestion[] = [];

    // Process each section in the bank's original order
    selectedSecs.forEach((sec) => {
      // Shuffle questions within this section
      const shuffledQuestions = shuffleArray(sec.questions);

      const prepared = shuffledQuestions.map((q) => {
        // Shuffle options for this question
        const shuffledOpts = shuffleArray(q.options);
        return {
          ...q,
          shuffledOptions: shuffledOpts,
          userAnswer: null,
          checked: false,
          sectionTitle: sec.title,
        };
      });

      questionsList = [...questionsList, ...prepared];
    });

    // Apply limit if chosen
    if (questionLimit > 0 && questionsList.length > questionLimit) {
      questionsList = questionsList.slice(0, questionLimit);
    }

    sessionQuestions = questionsList;
    activeQuestionIndex = 0;
    appState = "practicing";

    // Scroll to top
    window.scrollTo({ top: 0 });
  }

  // Select an answer
  function handleAnswerSelect(qIndex: number, optionId: number) {
    sessionQuestions[qIndex].userAnswer = optionId;
    activeQuestionIndex = qIndex;
  }

  // Select a question and navigate
  function selectQuestion(index: number) {
    activeQuestionIndex = index;
    if (appState === "practicing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (appState === "review") {
      const element = document.getElementById(`question-card-${index}`);
      if (element) {
        const offset = 100; // Account for sticky header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  }

  // Submit test
  function submitTest() {
    const unanswered = totalQuestionsCount - answeredCount;
    if (unanswered > 0) {
      const confirmSubmit = confirm(
        `Bạn còn ${unanswered} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài thi ôn tập không?`,
      );
      if (!confirmSubmit) return;
    }
    appState = "review";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Reset/Restart test
  function resetTest() {
    appState = "setup";
    sessionQuestions = [];
    activeQuestionIndex = 0;
    window.scrollTo({ top: 0 });
  }

  // Start a new test consisting only of previously wrong answers
  function retestWrongAnswers() {
    const wrongQs = sessionQuestions.filter(
      (q) => q.userAnswer !== q.correctAnswer,
    );
    if (wrongQs.length === 0) {
      alert("Bạn đã trả lời đúng tất cả các câu hỏi!");
      return;
    }
    // Reset answers and check status for retest
    sessionQuestions = wrongQs.map((q) => ({
      ...q,
      userAnswer: null,
      checked: false,
    }));
    activeQuestionIndex = 0;
    appState = "practicing";
    window.scrollTo({ top: 0 });
  }

  // Proceed to the next question
  function nextQuestion() {
    if (activeQuestionIndex < totalQuestionsCount - 1) {
      activeQuestionIndex += 1;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Last question – submit the test automatically
      submitTest();
    }
  }

  // Option class mapping for styling check results
  function getOptionClass(optionId: number, q: PracticeQuestion): string {
    if (appState !== "review" && !q.checked) return "";

    const isCorrect = optionId === q.correctAnswer;
    const isUserSelected = optionId === q.userAnswer;

    if (isCorrect) {
      return "correct"; // green
    }
    if (isUserSelected && !isCorrect) {
      return "wrong"; // red
    }
    if (q.userAnswer !== null && !isCorrect && !isUserSelected) {
      return "muted"; // dim
    }
    return "";
  }

  // Map button class mapping
  function getMapBtnClass(q: PracticeQuestion, idx: number): string {
    let cls = "map-btn";
    if (idx === activeQuestionIndex) cls += " active";

    if (appState === "review") {
      if (q.userAnswer === q.correctAnswer) {
        cls += " map-correct";
      } else {
        cls += " map-wrong";
      }
    } else {
      if (q.checked) {
        if (q.userAnswer === q.correctAnswer) {
          cls += " map-correct";
        } else {
          cls += " map-wrong";
        }
      } else if (q.userAnswer !== null) {
        cls += " map-answered";
      } else {
        cls += " map-unanswered";
      }
    }
    return cls;
  }
</script>

<header>
  <div class="header-container">
    <h1>Hội thi lực lượng tham gia bảo vệ an ninh, trật tự</h1>
  </div>
</header>
<main>
  {#if appState === "setup"}
    <!-- Setup / Topic Selection View -->
    <div class="card setup-card" style="max-width: 800px; margin: 0 auto;">
      <h2
        style="margin-bottom: 1.5rem; color: var(--primary); font-family: var(--font-title); text-align: center;"
      >
        CẤU HÌNH ĐỀ ÔN TẬP
      </h2>

      <!-- Topics Selection -->
      <div style="margin-bottom: 2rem;">
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"
        >
          <h3 style="font-size: 1.1rem; font-weight: 600;">
            Chọn chuyên đề học tập:
          </h3>
          <div style="display: flex; gap: 0.5rem;">
            <fluent-button
              appearance="accent"
              onclick={() => toggleAllSections(true)}
            >
              Chọn tất cả
            </fluent-button>
            <fluent-button onclick={() => toggleAllSections(false)}>
              Bỏ chọn tất cả
            </fluent-button>
          </div>
        </div>

        <div class="topics-grid">
          {#each sections as sec}
            <div class="topic-item">
              <label class="topic-label">
                <input
                  type="checkbox"
                  checked={selectedSections[sec.id] || false}
                  onchange={(e) =>
                    (selectedSections[sec.id] = (
                      e.target as HTMLInputElement
                    ).checked)}
                />
                <span class="topic-text">
                  <strong>Chuyên đề {sec.id}:</strong>
                  {sec.title}
                  <span class="question-count"
                    >({sec.questions.length} câu)</span
                  >
                </span>
              </label>
            </div>
          {/each}
        </div>
      </div>

      <fluent-divider style="margin-bottom: 2rem;"></fluent-divider>

      <!-- Question Limit Selection -->
      <div style="margin-bottom: 2.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">
          Số lượng câu hỏi ôn tập:
        </h3>
        <div class="limit-selector">
          <label class="limit-option">
            <input
              type="radio"
              name="limit"
              value={0}
              checked={questionLimit === 0}
              onchange={() => (questionLimit = 0)}
            />
            <span>Tất cả các câu</span>
          </label>
          <label class="limit-option">
            <input
              type="radio"
              name="limit"
              value={10}
              checked={questionLimit === 10}
              onchange={() => (questionLimit = 10)}
            />
            <span>10 câu</span>
          </label>
          <label class="limit-option">
            <input
              type="radio"
              name="limit"
              value={20}
              checked={questionLimit === 20}
              onchange={() => (questionLimit = 20)}
            />
            <span>20 câu</span>
          </label>
          <label class="limit-option">
            <input
              type="radio"
              name="limit"
              value={30}
              checked={questionLimit === 30}
              onchange={() => (questionLimit = 30)}
            />
            <span>30 câu</span>
          </label>
          <label class="limit-option">
            <input
              type="radio"
              name="limit"
              value={50}
              checked={questionLimit === 50}
              onchange={() => (questionLimit = 50)}
            />
            <span>50 câu</span>
          </label>
        </div>
      </div>

      <!-- Start Button -->
      <div style="text-align: center;">
        <fluent-button
          appearance="accent"
          onclick={startTest}
          style="font-size: 1.1rem; padding: 0.5rem 2.5rem; height: auto; --accent-fill-rest: var(--accent); --accent-fill-hover: var(--accent-light);"
        >
          BẮT ĐẦU ÔN TẬP
        </fluent-button>
      </div>
    </div>
  {:else if appState === "practicing"}
    <!-- Practicing View (Single Question at a Time) -->
    <div class="test-layout">
      <div class="questions-column">
        {#if sessionQuestions.length > 0}
          {#key activeQuestionIndex}
            {@const q = sessionQuestions[activeQuestionIndex]}
            <div
              id="question-card-{activeQuestionIndex}"
              class="card question-card active-card"
            >
              <div class="q-header">
                <span class="q-badge">Câu hỏi {activeQuestionIndex + 1} / {totalQuestionsCount}</span>
                <span class="q-section-title">{q.sectionTitle}</span>
              </div>

              <p class="q-text">{q.text}</p>

              <fluent-divider style="margin: 1rem 0;"></fluent-divider>

              {#if !q.checked}
                <!-- Select Answer View -->
                <fluent-radio-group
                  value={q.userAnswer !== null ? q.userAnswer.toString() : ""}
                  onchange={(e: Event) => {
                    const val = parseInt((e.target as any).value, 10);
                    handleAnswerSelect(activeQuestionIndex, val);
                  }}
                >
                  {#each q.shuffledOptions as opt, optIdx}
                    <fluent-radio
                      id={q.id + "-" + opt.id}
                      value={opt.id.toString()}
                      checked={q.userAnswer === opt.id}
                      style="margin-bottom: 0.5rem; display: block;"
                    >
                      <span
                        style="font-weight: 600; color: var(--primary); margin-right: 0.25rem;"
                      >
                        {optionLabels[optIdx]}.
                      </span>
                      {opt.text}
                    </fluent-radio>
                  {/each}
                </fluent-radio-group>
                
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                  <fluent-button
                    appearance="accent"
                    disabled={q.userAnswer === null}
                    onclick={() => {
                      q.checked = true;
                    }}
                    style="flex: 1;"
                  >
                    Kiểm tra đáp án
                  </fluent-button>
                </div>
              {:else}
                <!-- Feedback view after checking answer -->
                <div
                  style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;"
                >
                  {#each q.shuffledOptions as opt, optIdx}
                    {@const optionClass = getOptionClass(opt.id, q)}
                    <div class="option-wrapper {optionClass}">
                      <fluent-radio
                        disabled
                        value={opt.id.toString()}
                        checked={q.userAnswer === opt.id}
                      >
                        <span style="font-weight: 600; margin-right: 0.25rem;">
                          {optionLabels[optIdx]}.
                        </span>
                        {opt.text}
                      </fluent-radio>
                      {#if optionClass === "correct"}
                        <span
                          class="feedback-icon correct-icon"
                          title="Đáp án đúng">✓ Đúng</span
                        >
                      {:else if optionClass === "wrong"}
                        <span
                          class="feedback-icon wrong-icon"
                          title="Lựa chọn của bạn (Sai)">✗ Sai</span
                        >
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}

              <!-- Navigation Controls (Always Visible) -->
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: space-between; align-items: center; width: 100%;">
                {#if activeQuestionIndex > 0}
                  <fluent-button
                    onclick={() => selectQuestion(activeQuestionIndex - 1)}
                  >
                    Câu trước
                  </fluent-button>
                {:else}
                  <div></div>
                {/if}

                {#if activeQuestionIndex < totalQuestionsCount - 1}
                  <fluent-button
                    appearance="accent"
                    onclick={nextQuestion}
                  >
                    Câu tiếp
                  </fluent-button>
                {:else}
                  <fluent-button
                    appearance="accent"
                    onclick={submitTest}
                    style="--accent-fill-rest: #10b981; --accent-fill-hover: #059669;"
                  >
                    Nộp bài & Xem kết quả
                  </fluent-button>
                {/if}
              </div>
            </div>
          {/key}
        {/if}
      </div>

      <!-- Question Map Sidebar (Sticky) -->
      <aside class="sidebar-column">
        <div class="card map-card">
          <h3
            style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; font-family: var(--font-title); color: var(--primary);"
          >
            Chọn câu hỏi
          </h3>
          <p
            style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;"
          >
            Đã trả lời {answeredCount}/{totalQuestionsCount} câu
          </p>

          <div class="map-grid">
            {#each sessionQuestions as q, idx}
              <button
                class={getMapBtnClass(q, idx)}
                onclick={() => selectQuestion(idx)}
              >
                {idx + 1}
              </button>
            {/each}
          </div>

          <fluent-divider style="margin: 1rem 0;"></fluent-divider>

          <!-- Legend -->
          <div class="legend-list">
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: var(--primary);"
              ></span>
              <span class="legend-text">Đã chọn đáp án</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: #10b981;"
              ></span>
              <span class="legend-text">Trả lời đúng</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="background-color: #ef4444;"
              ></span>
              <span class="legend-text">Trả lời sai</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="border: 1px solid var(--border-color); background-color: var(--card-bg);"
              ></span>
              <span class="legend-text">Chưa trả lời</span>
            </div>
            <div class="legend-item">
              <span
                class="legend-color"
                style="border: 2px solid var(--primary); background-color: var(--card-bg);"
              ></span>
              <span class="legend-text">Đang xem</span>
            </div>
          </div>

          <fluent-divider style="margin: 1rem 0;"></fluent-divider>

          <!-- Submit Button in Sidebar -->
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <fluent-button
              appearance="accent"
              onclick={submitTest}
              style="width: 100%; --accent-fill-rest: var(--accent); --accent-fill-hover: var(--accent-light);"
            >
              Nộp bài thi ôn tập
            </fluent-button>
            <fluent-button
              onclick={resetTest}
              style="width: 100%;"
            >
              Thoát
            </fluent-button>
          </div>
        </div>
      </aside>
    </div>
  {:else if appState === "review"}
    <!-- Review View -->
    <div class="test-layout">
      <div class="questions-column">
        <!-- Score Summary Card -->
        <div
          class="card result-card"
          style="border-left: 6px solid var(--primary);"
        >
          <h2 style="font-family: var(--font-title); margin-bottom: 0.5rem;">
            KẾT QUẢ ÔN TẬP
          </h2>
          <div class="score-display">
            <span class="score-num">{correctAnswersCount}</span>
            <span class="score-divider">/</span>
            <span class="score-total">{totalQuestionsCount}</span>
            <span class="score-text">câu trả lời đúng</span>
            <span class="score-badge" class:badge-pass={scorePercentage >= 50}
              >{scorePercentage}%</span
            >
          </div>
          <p style="font-weight: 500; color: var(--text-main); margin: 1rem 0;">
            {getScoreMessage(scorePercentage)}
          </p>
          <div
            style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;"
          >
            <fluent-button appearance="accent" onclick={resetTest}>
              Làm đề ôn tập mới
            </fluent-button>
            <fluent-button
              appearance="accent"
              onclick={retestWrongAnswers}
              style="margin-left: 0.5rem;"
            >
              Làm lại câu trả lời sai
            </fluent-button>
          </div>
        </div>

        <!-- Questions List (Review) -->
        {#each sessionQuestions as q, idx}
          <div
            id="question-card-{idx}"
            class="card question-card"
            class:active-card={idx === activeQuestionIndex}
          >
            <div class="q-header">
              <span class="q-badge">Câu hỏi {idx + 1}</span>
              <span class="q-section-title">{q.sectionTitle}</span>
            </div>

            <p class="q-text">{q.text}</p>

            <fluent-divider style="margin: 1rem 0;"></fluent-divider>

            <!-- Review Mode Option Highlight -->
            <div
              style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;"
            >
              {#each q.shuffledOptions as opt, optIdx}
                {@const optionClass = getOptionClass(opt.id, q)}
                <div class="option-wrapper {optionClass}">
                  <fluent-radio
                    disabled
                    value={opt.id.toString()}
                    checked={q.userAnswer === opt.id}
                  >
                    <span style="font-weight: 600; margin-right: 0.25rem;">
                      {optionLabels[optIdx]}.
                    </span>
                    {opt.text}
                  </fluent-radio>

                  {#if optionClass === "correct"}
                    <span class="feedback-icon correct-icon" title="Đáp án đúng"
                      >✓ Đúng</span
                    >
                  {:else if optionClass === "wrong"}
                    <span
                      class="feedback-icon wrong-icon"
                      title="Lựa chọn của bạn (Sai)">✗ Lựa chọn sai</span
                    >
                  {/if}
                </div>
              {/each}

              <!-- Unanswered Warning -->
              {#if q.userAnswer === null}
                <p
                  style="color: var(--wrong-text); font-size: 0.9rem; font-weight: 500; margin-top: 0.5rem;"
                >
                  ⚠️ Bạn chưa trả lời câu hỏi này.
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Question Map Sidebar (Sticky) -->
      <aside class="sidebar-column">
        <div class="card map-card">
          <h3
            style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; font-family: var(--font-title); color: var(--primary);"
          >
            Chọn câu hỏi
          </h3>
          <p
            style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;"
          >
            Đúng {correctAnswersCount}/{totalQuestionsCount} câu ({scorePercentage}%)
          </p>

          <div class="map-grid">
            {#each sessionQuestions as q, idx}
              <button
                class={getMapBtnClass(q, idx)}
                onclick={() => selectQuestion(idx)}
              >
                {idx + 1}
              </button>
            {/each}
          </div>

          <fluent-divider style="margin: 1rem 0;"></fluent-divider>

          <!-- Legend -->
          <div class="legend-list">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #10b981;"
              ></span>
              <span class="legend-text">Câu trả lời đúng</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #ef4444;"
              ></span>
              <span class="legend-text">Câu trả lời sai</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  {/if}
</main>

<footer>
  <div
    style="text-align: center; padding: 2rem 1rem; font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border-color); background-color: var(--card-bg); margin-top: 3rem;"
  >
    © 2026 Lực lượng tham gia bảo vệ an ninh, trật tự ở cơ sở. Phát triển cho
    kỳ thi trắc nghiệm học tập.
  </div>
</footer>

<style>
  /* Local Component Styling */
  .topics-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .topic-item {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background-color: rgba(15, 76, 129, 0.04);
    border: 1px solid var(--border-color);
    transition: background-color 0.2s ease;
  }

  .topic-item:hover {
    background-color: rgba(15, 76, 129, 0.08);
  }

  .topic-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
  }

  .topic-label input[type="checkbox"] {
    margin-top: 0.25rem;
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--primary);
    cursor: pointer;
  }

  .topic-text {
    font-size: 0.95rem;
    color: var(--text-main);
  }

  .question-count {
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .limit-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .limit-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg);
    cursor: pointer;
    font-weight: 500;
  }

  .limit-option input[type="radio"] {
    accent-color: var(--primary);
  }

  /* Test Layout Grid */
  .test-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .questions-column {
    flex: 1;
  }

  .sidebar-column {
    width: 100%;
  }

  @media (min-width: 992px) {
    .test-layout {
      flex-direction: row;
      align-items: flex-start;
    }

    .sidebar-column {
      width: 320px;
      position: sticky;
      top: 100px; /* Accounts for header height */
    }
  }

  /* Question Card */
  .question-card {
    border-left: 4px solid transparent;
    transition:
      border-left-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .question-card.active-card {
    border-left-color: var(--primary);
    box-shadow: var(--shadow-lg);
  }

  .q-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .q-badge {
    background-color: var(--primary);
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .q-section-title {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .q-text {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.5;
    color: var(--text-main);
  }

  /* Question Map */
  .map-card {
    padding: 1.25rem;
  }

  .map-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    max-height: 350px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  @media (min-width: 992px) {
    .map-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  .map-btn {
    aspect-ratio: 1;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg);
    color: var(--text-main);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .map-btn:hover {
    border-color: var(--primary);
    background-color: rgba(15, 76, 129, 0.04);
  }

  .map-btn.active {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }

  .map-btn.map-answered {
    background-color: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .map-btn.map-correct {
    background-color: #10b981;
    border-color: #10b981;
    color: white;
  }

  .map-btn.map-wrong {
    background-color: #ef4444;
    border-color: #ef4444;
    color: white;
  }

  /* Legend */
  .legend-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .legend-color {
    width: 1rem;
    height: 1rem;
    border-radius: 4px;
    display: inline-block;
    flex-shrink: 0;
  }

  /* Score Summary Display */
  .score-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .score-num {
    font-size: 3rem;
    font-weight: 800;
    color: #ef4444;
    line-height: 1;
  }

  .score-divider {
    font-size: 1.5rem;
    color: var(--text-muted);
  }

  .score-total {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-main);
  }

  .score-text {
    font-size: 1rem;
    color: var(--text-muted);
    margin-left: 0.5rem;
  }

  .score-badge {
    margin-left: auto;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ef4444;
    background-color: var(--wrong-bg);
    padding: 0.25rem 0.75rem;
    border-radius: 8px;
  }

  .score-badge.badge-pass {
    color: #10b981;
    background-color: var(--correct-bg);
  }

  /* Option labels inside review block */
  .option-label {
    font-weight: 600;
    margin-right: 0.25rem;
  }

  .feedback-icon {
    margin-left: auto;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }

  .correct-icon {
    background-color: var(--correct-bg);
    color: var(--correct-text);
  }

  .wrong-icon {
    background-color: var(--wrong-bg);
    color: var(--wrong-text);
  }
</style>
