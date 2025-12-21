import { useState } from "react";
import { loginUser } from "./api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async () => {
    const res = await loginUser(form);
    localStorage.setItem("token", res.access_token);
    alert("Login success");
  };

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input placeholder="Password" type="password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button onClick={submit}>Login</button>
    </div>
  );
}
