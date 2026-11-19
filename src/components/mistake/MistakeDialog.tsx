import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { STAGES } from "../../data/roadmap";
import { useApp } from "../../hooks/useApp";
import { STATUS_LABEL } from "../../services/notes";
import type { ReviewStatus, WrongQuestion } from "../../types";
import { Field, Seg } from "../ui";

export interface MistakeDraft {
  id?: string;
  title: string;
  content: string;
  myAnswer: string;
  correctAnswer: string;
  reason: string;
  points: string[];
  topicId: string;
  stageId: string;
  createdAt: string;
  sourceTaskId: string | null;
  sourceTaskTitle: string | null;
  status: ReviewStatus;
}

const blank = (): MistakeDraft => ({
  title: "",
  content: "",
  myAnswer: "",
  correctAnswer: "",
  reason: "",
  points: [],
  topicId: "",
  stageId: "stage-1",
  createdAt: "",
  sourceTaskId: null,
  sourceTaskTitle: null,
  status: "unlearned",
});

export function MistakeDialog({ open, initial, onClose }: { open: boolean; initial?: Partial<MistakeDraft> | WrongQuestion; onClose: () => void }) {
  const { addMistake, updateMistake } = useApp();
  const [draft, setDraft] = useState<MistakeDraft>(blank);

  useEffect(() => {
    if (open) setDraft({ ...blank(), ...(initial as MistakeDraft) });
  }, [open, initial]);

  if (!open) return null;

  const save = () => {
    if (!draft.title.trim()) return;
    const points = draft.points.map((p) => p.trim()).filter(Boolean);
    if (draft.id) {
      updateMistake(draft.id, { ...draft, points });
    } else {
      addMistake({
        title: draft.title.trim(),
        content: draft.content,
        myAnswer: draft.myAnswer,
        correctAnswer: draft.correctAnswer,
        reason: draft.reason,
        points,
        topicId: draft.topicId,
        stageId: draft.stageId,
        sourceTaskId: draft.sourceTaskId,
        sourceTaskTitle: draft.sourceTaskTitle,
        status: draft.status,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#05061a]/75 p-3 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="glass pop-in my-auto w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{draft.id ? "编辑错题" : "新增错题"}</h3>
          <button onClick={onClose} className="btn btn-ghost px-2 py-1" aria-label="关闭错题编辑">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="题目名称">
            <input className="input" placeholder="例如：__init__ 和 self 的区别" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} autoFocus />
          </Field>
          <Field label="题目内容">
            <textarea className="input min-h-[70px] resize-none" placeholder="把题目或当时的任务原样贴进来" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="我的原始答案">
              <textarea className="input min-h-[60px] resize-none" value={draft.myAnswer} onChange={(e) => setDraft({ ...draft, myAnswer: e.target.value })} />
            </Field>
            <Field label="正确答案">
              <textarea className="input min-h-[60px] resize-none" value={draft.correctAnswer} onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })} />
            </Field>
          </div>
          <Field label="错误原因" hint="写清是概念不清、记错、还是没看全题目">
            <textarea className="input min-h-[54px] resize-none" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
          </Field>
          <Field label="涉及知识点" hint="用逗号分隔，会用于笔记搜索和后续复习任务">
            <input className="input" placeholder="self, __init__, 实例属性" value={draft.points.join(", ")} onChange={(e) => setDraft({ ...draft, points: e.target.value.split(/[,，]/) })} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="所属阶段">
              <select className="input" value={draft.stageId} onChange={(e) => setDraft({ ...draft, stageId: e.target.value })}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#12132e]">
                    第 {s.index} 阶段 · {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="掌握状态">
              <Seg<ReviewStatus>
                value={draft.status}
                onChange={(v) => setDraft({ ...draft, status: v })}
                options={(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
              />
            </Field>
          </div>
          {draft.sourceTaskTitle && <p className="text-[10px] text-[var(--color-dim)]">来源任务：{draft.sourceTaskTitle}</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!draft.title.trim()}>
            {draft.id ? "保存修改" : "加入错题本"}
          </button>
        </div>
      </div>
    </div>
  );
}
