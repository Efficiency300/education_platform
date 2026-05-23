import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Gamepad2,
  RotateCw,
  Trophy,
  X,
} from "lucide-react";
import { api, CourseDetail, QuizSubmitResponse } from "../api";
import { useProgress } from "../state/ProgressContext";
import Markdown from "../components/Markdown";

type Mode = "lesson" | "quiz" | "result";

export default function CourseDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user, refresh, notify } = useProgress();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("lesson");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const c = await api.course(slug, user.id);
    setCourse(c);
    const firstUnfinished = c.lessons.findIndex((l) => !l.completed);
    setActiveLessonIdx(firstUnfinished === -1 ? 0 : firstUnfinished);
  }, [slug, user]);

  useEffect(() => {
    load();
  }, [load]);

  const activeLesson = course?.lessons[activeLessonIdx];

  const completeAndAdvance = async () => {
    if (!course || !activeLesson || !user) return;
    setBusy(true);
    try {
      const res = await api.completeLesson(user.id, course.slug, activeLesson.slug);
      if (res.points_awarded > 0) notify("ok", `+${res.points_awarded} XP — урок «${activeLesson.title}»`);
      await refresh();
      await load();
      if (activeLessonIdx < course.lessons.length - 1) {
        setActiveLessonIdx((i) => i + 1);
      } else {
        setMode("quiz");
        setAnswers({});
        setQuizResult(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const submitQuiz = async () => {
    if (!course || !user) return;
    setBusy(true);
    try {
      const res = await api.submitQuiz(user.id, course.slug, answers);
      setQuizResult(res);
      setMode("result");
      if (res.course_completed) {
        notify("ok", `Курс «${course.title}» завершён · +${res.points_awarded} XP`);
      } else if (res.passed) {
        notify("info", `Квиз сдан: ${res.score}/${res.max_score}`);
      } else {
        notify("warn", `Квиз: ${res.score}/${res.max_score}. Требуется повтор.`);
      }
      await refresh();
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!course) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-900/20 border-t-gold-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/courses" className="btn-ghost !px-3 !py-1.5">
          <ArrowLeft size={14} /> К курсам
        </Link>
        <div className="flex items-center gap-2">
          <span className="chip">
            <BookOpen size={11} /> {course.lessons.length} уроков
          </span>
          <span className="chip">
            <Clock size={11} /> {course.estimated_minutes} мин
          </span>
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
          {course.subtitle}
        </div>
        <h1 className="hero-text mt-2">{course.title}</h1>
        <p className="mt-3 max-w-3xl text-base text-navy-900/60 dark:text-white/60">
          {course.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-1.5">
          <div className="px-2 text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
            Программа
          </div>
          {course.lessons.map((l, idx) => {
            const active = mode === "lesson" && idx === activeLessonIdx;
            return (
              <button
                key={l.slug}
                onClick={() => {
                  setMode("lesson");
                  setActiveLessonIdx(idx);
                }}
                className={`group flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-gold-500/40 bg-gold-500/10"
                    : "border-navy-900/8 bg-white/40 hover:bg-white/70 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/8"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    l.completed
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-gold-500 text-navy-900"
                        : "border border-navy-900/15 dark:border-white/20"
                  }`}
                >
                  {l.completed ? <Check size={13} /> : idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{l.title}</div>
                  <div className="mt-0.5 text-[11px] text-navy-900/50 dark:text-white/50">
                    {l.duration_min} мин · {l.summary}
                  </div>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => {
              setMode("quiz");
              setAnswers({});
              setQuizResult(null);
            }}
            className={`mt-2 flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
              mode === "quiz" || mode === "result"
                ? "border-gold-500/40 bg-gold-500/10"
                : "border-navy-900/8 bg-white/40 hover:bg-white/70 dark:border-white/8 dark:bg-white/[0.03] dark:hover:bg-white/8"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                course.completed
                  ? "bg-emerald-500 text-white"
                  : "border border-navy-900/15 dark:border-white/20"
              }`}
            >
              {course.completed ? <Check size={13} /> : <Trophy size={12} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Финальный квиз</div>
              <div className="mt-0.5 text-[11px] text-navy-900/50 dark:text-white/50">
                {course.quiz.length} вопросов · нужно ≥ 70%
              </div>
            </div>
          </button>
        </aside>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {mode === "lesson" && activeLesson && (
              <motion.div
                key={`lesson-${activeLesson.slug}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="glass p-7"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
                    Урок {activeLessonIdx + 1} из {course.lessons.length}
                  </div>
                  {activeLesson.completed && (
                    <span className="chip !bg-emerald-500/15 !text-emerald-700 dark:!text-emerald-300">
                      <Check size={11} /> пройдено
                    </span>
                  )}
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {activeLesson.title}
                </h2>
                <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">
                  {activeLesson.summary}
                </p>
                <div className="mt-6">
                  <Markdown source={activeLesson.body_md} />
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-navy-900/8 pt-5 dark:border-white/8">
                  <button
                    disabled={activeLessonIdx === 0}
                    onClick={() => setActiveLessonIdx((i) => Math.max(0, i - 1))}
                    className="btn-ghost disabled:opacity-30"
                  >
                    <ArrowLeft size={14} /> Назад
                  </button>
                  <button
                    onClick={completeAndAdvance}
                    disabled={busy}
                    className="btn-primary"
                  >
                    {activeLessonIdx === course.lessons.length - 1
                      ? "Перейти к квизу"
                      : activeLesson.completed
                        ? "Следующий урок"
                        : "Я изучил → дальше"} <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="glass p-7"
              >
                <div className="text-[11px] uppercase tracking-widest text-navy-900/50 dark:text-white/50">
                  Финальный квиз
                </div>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                  Проверка знаний
                </h2>
                <p className="mt-1 text-sm text-navy-900/60 dark:text-white/60">
                  Для зачёта нужно ответить правильно как минимум на 70% вопросов.
                </p>

                <div className="mt-6 space-y-5">
                  {course.quiz.map((q, qi) => (
                    <div key={q.id} className="rounded-2xl border border-navy-900/8 bg-white/40 p-5 dark:border-white/8 dark:bg-white/[0.03]">
                      <div className="text-[11px] uppercase tracking-wider text-navy-900/50 dark:text-white/50">
                        Вопрос {qi + 1}
                      </div>
                      <div className="mt-1 text-base font-semibold">{q.question}</div>
                      <div className="mt-3 flex flex-col gap-2">
                        {q.options.map((o) => {
                          const selected = answers[q.id] === o.id;
                          return (
                            <button
                              key={o.id}
                              onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                                selected
                                  ? "border-gold-500/60 bg-gold-500/10"
                                  : "border-navy-900/8 bg-white/60 hover:border-gold-500/30 dark:border-white/10 dark:bg-white/5"
                              }`}
                            >
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                                  selected
                                    ? "border-gold-500 bg-gold-500 text-navy-900"
                                    : "border-navy-900/20 dark:border-white/25"
                                }`}
                              >
                                {o.id.toUpperCase()}
                              </div>
                              <span className="leading-relaxed">{o.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-navy-900/8 pt-5 dark:border-white/8">
                  <button onClick={() => setMode("lesson")} className="btn-ghost">
                    <ArrowLeft size={14} /> К урокам
                  </button>
                  <button
                    onClick={submitQuiz}
                    disabled={busy || Object.keys(answers).length < course.quiz.length}
                    className="btn-gold disabled:opacity-50"
                  >
                    Отправить ответы <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {mode === "result" && quizResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 24 }}
                className="glass p-7"
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className={`flex h-20 w-20 items-center justify-center rounded-full shadow-glass-lg ${
                      quizResult.passed
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                        : "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    }`}
                  >
                    {quizResult.passed ? <Trophy size={36} /> : <RotateCw size={32} />}
                  </motion.div>
                  <div>
                    <div className="text-sm uppercase tracking-widest text-navy-900/50 dark:text-white/50">
                      {quizResult.passed ? "Зачёт" : "Нужен повтор"}
                    </div>
                    <h2 className="hero-text mt-2">
                      {quizResult.score}/{quizResult.max_score}
                    </h2>
                  </div>
                  {quizResult.course_completed && (
                    <div className="text-sm text-emerald-700 dark:text-emerald-300">
                      Курс пройден · +{quizResult.points_awarded} XP
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  {quizResult.results.map((r, i) => {
                    const q = course.quiz.find((q) => q.id === r.question_id);
                    return (
                      <div
                        key={r.question_id}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                          r.correct
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-rose-500/30 bg-rose-500/5"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            r.correct ? "bg-emerald-500" : "bg-rose-500"
                          } text-white`}
                        >
                          {r.correct ? <Check size={14} /> : <X size={14} />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">
                            {i + 1}. {q?.question}
                          </div>
                          {!r.correct && (
                            <div className="mt-1 text-navy-900/70 dark:text-white/70">
                              Правильный ответ:{" "}
                              <strong>
                                {q?.options.find((o) => o.id === r.expected_option_id)?.text}
                              </strong>
                            </div>
                          )}
                          {r.explanation && (
                            <div className="mt-1 text-navy-900/60 dark:text-white/60">
                              {r.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-navy-900/8 pt-5 dark:border-white/8">
                  <button
                    onClick={() => {
                      setMode("quiz");
                      setAnswers({});
                      setQuizResult(null);
                    }}
                    className="btn-ghost"
                  >
                    <RotateCw size={14} /> Пройти заново
                  </button>
                  {quizResult.passed ? (
                    <button
                      onClick={() => navigate(`/simulator/${quizResult.next_scenario_id}`)}
                      className="btn-gold"
                    >
                      <Gamepad2 size={14} /> К симулятору
                    </button>
                  ) : (
                    <button onClick={() => setMode("lesson")} className="btn-primary">
                      Вернуться к материалам <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
