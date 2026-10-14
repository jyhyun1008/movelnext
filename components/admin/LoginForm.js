"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm({ next }) {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      {state?.error && <p className="notice error">{state.error}</p>}
      <label className="field">
        <span>비밀번호</span>
        <input type="password" name="password" autoComplete="current-password" autoFocus required />
      </label>
      <button className="btn" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
